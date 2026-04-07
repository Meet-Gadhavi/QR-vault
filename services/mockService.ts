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
        userPlan: v.profiles?.plan as PlanType,
        expiresAt: v.expires_at,
        maxViews: v.max_views
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

    createVault: async (userId: string, name: string, files: File[], links: string[], accessLevel: AccessLevel, email?: string, expiresAt?: string, maxViews?: number): Promise<Vault> => {
        await supabaseImpl.ensureProfile(userId, email);

        // 1. Create Vault Record
        const { data: vault, error } = await supabase.from('vaults').insert({
            user_id: userId,
            name,
            access_level: accessLevel,
            created_at: new Date().toISOString(),
            views: 0,
            active: true,
            expires_at: expiresAt,
            max_views: maxViews
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

    updateVault: async (userId: string, id: string, name: string, newFiles: File[], newLinks: string[], deletedFileIds: string[], accessLevel?: AccessLevel, email?: string, expiresAt?: string, maxViews?: number) => {
        await supabaseImpl.ensureProfile(userId, email);

        const updatePayload: any = { name };
        if (accessLevel) updatePayload.access_level = accessLevel;
        if (expiresAt !== undefined) updatePayload.expires_at = expiresAt;
        if (maxViews !== undefined) updatePayload.max_views = maxViews;

        const { error } = await supabase.from('vaults').update({ ...updatePayload, report_count: 0 }).eq('id', id);
        if (error) throw new Error(`Update failed: ${error.message}`);

        // Reset Reputation: Delete all reports for this vault upon update
        await supabase.from('reports').delete().eq('vault_id', id);

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
        // 1. Get vault and files for manifest
        const { data: vault } = await supabase.from('vaults').select('name, created_at, views').eq('id', id).single();
        const { data: files } = await supabase.from('files').select('name, size, type, mime_type, url').eq('vault_id', id);

        // 2. Cleanup Supabase Storage files
        try {
            const { data: storageFiles, error: listError } = await supabase.storage.from('vault-files').list(id);
            if (!listError && storageFiles && storageFiles.length > 0) {
                const paths = storageFiles.map((f: any) => `${id}/${f.name}`);
                await supabase.storage.from('vault-files').remove(paths);
            }
        } catch (storageErr) {
            console.warn("Storage cleanup failed:", storageErr);
        }

        // 3. Log the deletion with manifest before record is gone
        if (vault) {
            await supabase.from('deleted_vault_logs').insert({
                user_id: userId,
                vault_name: vault.name,
                original_vault_id: id,
                created_at: vault.created_at,
                views: vault.views || 0,
                deletion_reason: 'MANUAL_DELETE',
                file_manifest: files || []                        // NEW: Save precise manifest
            });
        }

        // 4. Delete from DB (Cascade delete handles files/requests/reports metadata)
        const { error } = await supabase.from('vaults').delete().eq('id', id);
        if (error) throw new Error(error.message);
    },

    recoverVault: async (userId: string, vaultName: string, driveFiles: any[]) => {
        // 1. Get the deletion log to find the manifest
        const { data: log } = await supabase
            .from('deleted_vault_logs')
            .select('file_manifest')
            .eq('user_id', userId)
            .eq('vault_name', vaultName)
            .order('deleted_at', { ascending: false })
            .limit(1)
            .single();

        const manifest = log?.file_manifest || [];

        // 2. Create Vault Record
        const { data: vault, error: vError } = await supabase.from('vaults').insert({
            user_id: userId,
            name: vaultName,
            access_level: AccessLevel.PUBLIC,
            created_at: new Date().toISOString(),
            views: 0,
            active: true
        }).select().single();

        if (vError) throw new Error(`Recovery failed: ${vError.message}`);

        // 3. Insert Files - ONLY if they are in the manifest (if manifest exists)
        for (const f of driveFiles) {
            // Check if file name exists in manifest. If manifest is empty (older deletion), allow all.
            const isInManifest = manifest.length === 0 || manifest.some((m: any) => m.name === f.name);
            
            if (!isInManifest) {
                console.log(`[Recovery] Skipping file not in manifest: ${f.name}`);
                continue;
            }

            const fType = f.mimeType?.startsWith('image/') ? FileType.IMAGE : 
                         (f.mimeType === 'application/pdf' ? FileType.PDF : FileType.OTHER);
            
            await supabase.from('files').insert({
                vault_id: vault.id,
                name: f.name,
                size: f.size || 0,
                type: fType,
                mime_type: f.mimeType || 'application/octet-stream',
                url: f.webViewLink
            });
        }

        // 4. Delete from Deletion Logs (clean up history)
        await supabase.from('deleted_vault_logs').delete().eq('user_id', userId).eq('vault_name', vaultName);

        return (await supabaseImpl.getVaultById(vault.id)) as Vault;
    },

    getVaultReports: async (vaultId: string): Promise<Report[]> => {
        const { data, error } = await supabase
            .from('reports')
            .select('*')
            .eq('vault_id', vaultId)
            .order('created_at', { ascending: false });
        
        if (error) return [];
        return (data || []).map((r: any) => ({
            id: r.id,
            vaultId: r.vault_id,
            fileIds: r.file_ids || [],                      // NEW: Support multiple files
            reasonVirus: r.reason_virus,
            reasonContent: r.reason_content,
            customMessage: r.custom_message,
            expiresAt: r.expires_at,
            createdAt: r.created_at
        }));
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
        const { data, error } = await supabase.from('invoices').select('*').eq('id', userId).order('timestamp', { ascending: false });
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
    },

    submitContactForm: async (data: { name: string; email: string; subject: string; message: string }) => {
        // In a real app, this would send an email via an API
        console.log('Contact Form Submitted:', data);
        return new Promise((resolve) => setTimeout(resolve, 1000));
    },

    sendCancellationCode: async (userId: string, email: string) => {
        // In a real app, this would send an email with a 6-digit code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        console.log(`[MOCK] Cancellation code for ${email}: ${code}`);
        // Store code in local storage or a mock map for verification
        sessionStorage.setItem(`cancel_code_${userId}`, code);
        return new Promise((resolve) => setTimeout(resolve, 1500));
    },

    verifyCancellationCode: async (userId: string, code: string) => {
        const storedCode = sessionStorage.getItem(`cancel_code_${userId}`);
        if (code === storedCode) {
            sessionStorage.removeItem(`cancel_code_${userId}`);
            return true;
        }
        throw new Error("Invalid verification code. Please try again.");
    }
};

export const mockService = supabaseImpl;