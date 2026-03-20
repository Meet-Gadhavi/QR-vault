import { Vault, FileType, AccessLevel, RequestStatus, User, PlanType, PLAN_LIMITS, Invoice } from '../types';
import { supabase } from './supabaseClient';

// --- DB HELPERS ---

function mapDbVault(v: any): Vault {
    return {
        id: v.id,
        userId: v.user_id,
        name: v.name,
        createdAt: v.created_at,
        views: v.views,
        active: v.active,
        accessLevel: v.access_level || AccessLevel.PUBLIC,
        files: (v.files || []).map((f: any) => ({ id: f.id, name: f.name, size: f.size, type: f.type, url: f.url, mimeType: f.mime_type })),
        requests: (v.requests || []).map((r: any) => ({ id: r.id, email: r.email, status: r.status, requestedAt: r.requested_at })),
        userPlan: v.profiles?.plan as PlanType
    };
}

function createFileRecord(vaultId: string, file: File, url: string) {
    let fType = FileType.OTHER;
    if (file.type.startsWith('image/')) fType = FileType.IMAGE;
    else if (file.type === 'application/pdf') fType = FileType.PDF;
    else if (file.type.includes('zip')) fType = FileType.ZIP;
    return { vault_id: vaultId, name: file.name, size: file.size, type: fType, mime_type: file.type, url };
}

// --- SUPABASE IMPLEMENTATION ---
const supabaseImpl = {
    // Ensure profile exists in 'profiles' table. 
    ensureProfile: async (userId: string, email?: string) => {
        if (!email) return;

        // Check if profile exists
        const { data: existing } = await supabase.from('profiles').select('id').eq('id', userId).single();

        if (!existing) {
            const namePart = email.split('@')[0];
            const displayName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
            const newProfile = {
                id: userId,
                email: email,
                full_name: displayName,
                plan: PlanType.FREE,
                storage_used: 0,
                storage_limit: PLAN_LIMITS[PlanType.FREE]
            };
            const { error } = await supabase.from('profiles').upsert(newProfile);
            if (error) console.error("Error creating profile:", error);
        }
    },

    getUser: async (userId: string, email?: string): Promise<User> => {
        // Sync profile
        if (email) await supabaseImpl.ensureProfile(userId, email);

        let { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();

        // --- CHECK SUBSCRIPTION EXPIRY ---
        if (profile?.subscription_expiry_date) {
            const expiry = new Date(profile.subscription_expiry_date);
            const now = new Date();

            if (expiry < now) {
                // Subscription expired: Downgrade to FREE
                const updates = {
                    plan: PlanType.FREE,
                    storage_limit: PLAN_LIMITS[PlanType.FREE],
                    subscription_expiry_date: null // Clear expiry so we don't check again until next purchase
                };

                const { error } = await supabase.from('profiles').update(updates).eq('id', userId);

                if (!error) {
                    // Update local profile object to reflect changes immediately
                    profile = { ...profile, ...updates };
                } else {
                    console.error("Failed to downgrade expired subscription", error);
                }
            }
        }

        // Calculate real-time usage from files
        const { data: files } = await supabase.from('files').select('size, vault_id, vaults!inner(user_id)').eq('vaults.user_id', userId);
        const totalUsage = files?.reduce((acc: number, f: { size: number }) => acc + f.size, 0) || 0;

        return {
            id: userId,
            email: profile?.email || email || '',
            name: profile?.full_name || email?.split('@')[0] || 'User',
            plan: profile?.plan || PlanType.FREE,
            storageUsed: totalUsage,
            storageLimit: profile?.storage_limit || PLAN_LIMITS[PlanType.FREE],
            subscriptionExpiryDate: profile?.subscription_expiry_date
        };
    },

    getVaults: async (userId: string): Promise<Vault[]> => {
        const { data, error } = await supabase.from('vaults').select(`*, files (*), requests:access_requests (*)`).eq('user_id', userId).order('created_at', { ascending: false });
        if (error) {
            console.error("Error fetching vaults:", error);
            return [];
        }
        return (data || []).map((v: any) => mapDbVault(v));
    },

    getVaultById: async (id: string): Promise<Vault | null> => {
        const { data, error } = await supabase.from('vaults').select(`*, profiles(plan), files (*), requests:access_requests (*)`).eq('id', id).single();
        if (error || !data) return null;

        // Increment view count via RPC if available, or just ignore if not
        supabase.rpc('increment_vault_view', { vault_id: id }).then(({ error }: { error: any }) => {
            if (error) console.warn("View increment failed:", error.message);
        });

        return mapDbVault(data);
    },

    createVault: async (userId: string, name: string, files: File[], links: string[], accessLevel: AccessLevel, email?: string): Promise<Vault> => {
        await supabaseImpl.ensureProfile(userId, email);

        // 1. Create Vault Record
        const { data: vault, error } = await supabase.from('vaults').insert({
            user_id: userId,
            name,
            access_level: accessLevel,
            created_at: new Date().toISOString(),
            views: 0,
            active: true
        }).select().single();

        if (error) throw new Error(`Failed to create vault: ${error.message}`);

        // 2. Upload Files to Storage
        for (const file of files) {
            // If file is already uploaded (has a URL), just use it
            if ((file as any).url) {
                const f = file as any;
                await supabase.from('files').insert({
                    vault_id: vault.id,
                    name: f.name,
                    size: f.size,
                    type: f.type || FileType.OTHER,
                    mime_type: f.mimeType || 'application/octet-stream',
                    url: f.url
                });
                continue;
            }

            const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
            const path = `${vault.id}/${Math.random().toString(36).slice(2)}_${cleanName}`;

            const { error: uploadError } = await supabase.storage.from('vault-files').upload(path, file);
            if (uploadError) throw new Error(`Upload failed for ${file.name}: ${uploadError.message}`);

            const { data: { publicUrl } } = supabase.storage.from('vault-files').getPublicUrl(path);

            await supabase.from('files').insert(createFileRecord(vault.id, file, publicUrl));
        }

        // 3. Add Links
        for (const link of links) {
            await supabase.from('files').insert({
                vault_id: vault.id, name: link, size: 0, type: FileType.LINK, mime_type: 'text/url', url: link.startsWith('http') ? link : `https://${link}`
            });
        }

        return (await supabaseImpl.getVaultById(vault.id)) as Vault;
    },

    updateVault: async (userId: string, id: string, name: string, newFiles: File[], newLinks: string[], deletedFileIds: string[], accessLevel?: AccessLevel, email?: string) => {
        await supabaseImpl.ensureProfile(userId, email);

        const updatePayload: any = { name };
        if (accessLevel) updatePayload.access_level = accessLevel;

        const { error } = await supabase.from('vaults').update(updatePayload).eq('id', id);
        if (error) throw new Error(`Update failed: ${error.message}`);

        // Delete files from DB
        if (deletedFileIds.length) {
            // Optionally delete from Storage too if you track paths, but for now we just delete metadata
            await supabase.from('files').delete().in('id', deletedFileIds);
        }

        // Upload new files
        for (const file of newFiles) {
            // If file is already uploaded (has a URL), just use it
            if ((file as any).url) {
                const f = file as any;
                await supabase.from('files').insert({
                    vault_id: id,
                    name: f.name,
                    size: f.size,
                    type: f.type || FileType.OTHER,
                    mime_type: f.mimeType || 'application/octet-stream',
                    url: f.url
                });
                continue;
            }

            const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
            const path = `${id}/${Math.random().toString(36).slice(2)}_${cleanName}`;

            const { error: uploadError } = await supabase.storage.from('vault-files').upload(path, file);
            if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

            const { data: { publicUrl } } = supabase.storage.from('vault-files').getPublicUrl(path);
            await supabase.from('files').insert(createFileRecord(id, file, publicUrl));
        }

        // Add new links
        for (const link of newLinks) {
            await supabase.from('files').insert({ vault_id: id, name: link, size: 0, type: FileType.LINK, mime_type: 'text/url', url: link });
        }

        return (await supabaseImpl.getVaultById(id)) as Vault;
    },

    deleteVault: async (userId: string, id: string) => {
        // 1. Cleanup Supabase Storage files
        try {
            const { data: files, error: listError } = await supabase.storage.from('vault-files').list(id);
            if (!listError && files && files.length > 0) {
                const paths = files.map((f: any) => `${id}/${f.name}`);
                await supabase.storage.from('vault-files').remove(paths);
            }
        } catch (storageErr) {
            console.warn("Storage cleanup failed:", storageErr);
        }

        // 2. Delete from DB (Cascade delete handles files/requests metadata)
        const { error } = await supabase.from('vaults').delete().eq('id', id);
        if (error) throw new Error(error.message);
    },

    requestAccess: async (vaultId: string, email: string) => {
        const { error } = await supabase.from('access_requests').insert({ vault_id: vaultId, email, status: RequestStatus.PENDING, requested_at: new Date().toISOString() });
        if (error) throw error;
    },

    manageAccessRequest: async (userId: string, vaultId: string, requestId: string, status: RequestStatus) => {
        await supabase.from('access_requests').update({ status }).eq('id', requestId);
    },

    upgradeSubscription: async (userId: string, plan: PlanType, expiryDate?: string) => {
        const updateData: any = {
            plan,
            storage_limit: PLAN_LIMITS[plan]
        };
        if (expiryDate) {
            updateData.subscription_expiry_date = expiryDate;
        }

        const { error } = await supabase.from('profiles').update(updateData).eq('id', userId);
        if (error) {
            console.error("Subscription update failed", error);
            throw new Error("Failed to update subscription");
        }
    },

    cancelSubscription: async (userId: string) => {
        const { error } = await supabase.from('profiles').update({
            plan: PlanType.FREE,
            storage_limit: PLAN_LIMITS[PlanType.FREE],
            subscription_expiry_date: null
        }).eq('id', userId);
        if (error) {
            console.error("Subscription cancel failed", error);
            throw new Error("Failed to cancel subscription");
        }
    },

    saveInvoice: async (invoice: Invoice): Promise<void> => {
        const { error } = await supabase.from('invoices').insert([{
            id: invoice.id,
            user_id: invoice.userId,
            date: invoice.date,
            plan: invoice.plan,
            amount: invoice.amount,
            expiry: invoice.expiry,
            timestamp: invoice.timestamp
        }]);
        if (error) throw error;
    },

    getUserInvoices: async (userId: string): Promise<Invoice[]> => {
        const { data, error } = await supabase.from('invoices').select('*').eq('user_id', userId).order('timestamp', { ascending: false });
        if (error) throw error;
        return (data || []).map((inv: any) => ({
            id: inv.id,
            userId: inv.user_id,
            date: inv.date,
            plan: inv.plan,
            amount: inv.amount,
            expiry: inv.expiry,
            timestamp: inv.timestamp
        }));
    }
};

export const mockService = supabaseImpl;