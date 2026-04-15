import { Vault, FileType, AccessLevel, RequestStatus, User, PlanType, PLAN_LIMITS, Invoice, VaultType, ReceivingConfig, Submission } from '../types';
import { supabase } from './supabaseClient';

// --- DB HELPERS ---

function generateMockAnalytics(vaultName: string, views: number, files: any[]): any {
    const uniqueViewers = Math.floor(views * 0.7);
    const totalScans = Math.floor(views * 1.2);
    const totalDownloads = files.reduce((acc, f) => acc + (f.downloadCount || 0), 0);
    
    const timestampComparison = [
        { time: '00:00', engagement: Math.floor(Math.random() * 10) },
        { time: '04:00', engagement: Math.floor(Math.random() * 5) },
        { time: '08:00', engagement: Math.floor(Math.random() * 30) },
        { time: '12:00', engagement: Math.floor(Math.random() * 50) },
        { time: '16:00', engagement: Math.floor(Math.random() * 40) },
        { time: '20:00', engagement: Math.floor(Math.random() * 20) },
    ];

    const fileEngagement = files.map(f => ({
        fileName: f.name,
        engagement: Math.floor(Math.random() * views),
        downloads: f.downloadCount || 0
    }));

    return {
        uniqueViewers,
        totalScans,
        totalDownloads,
        timestampComparison,
        fileEngagement
    };
}

function mapDbVault(v: any): Vault {
    const files = (v.files || []).map((f: any) => ({ 
        id: f.id, 
        name: f.name, 
        size: f.size, 
        type: f.type, 
        url: f.url, 
        mimeType: f.mime_type,
        maxDownloads: f.max_downloads,
        downloadCount: f.download_count || 0,
        expiresAt: f.expires_at,
        deleteAfterMinutes: f.delete_after_minutes,
        firstViewedAt: f.first_viewed_at
    }));

    return {
        id: v.id,
        userId: v.user_id,
        name: v.name,
        createdAt: v.created_at,
        views: v.views,
        active: v.active,
        accessLevel: v.access_level || AccessLevel.PUBLIC,
        files: files,
        requests: (v.requests || []).map((r: any) => ({ id: r.id, email: r.email, status: r.status, requestedAt: r.requested_at })),
        userPlan: v.profiles?.plan as PlanType,
        expiresAt: v.expires_at,
        maxViews: v.max_views,
        password: v.password,
        customDomain: v.custom_domain,
        vaultType: v.vault_type as VaultType || VaultType.SENDING,
        receivingConfig: v.receiving_config as ReceivingConfig,
        analytics: generateMockAnalytics(v.name, v.views, files)
    };
}

function createFileRecord(vaultId: string, file: File, url: string, settings?: any) {
    let fType = FileType.OTHER;
    if (file.type.startsWith('image/')) fType = FileType.IMAGE;
    else if (file.type.startsWith('video/')) fType = FileType.VIDEO;
    else if (file.type === 'application/pdf') fType = FileType.PDF;
    else if (file.type.includes('zip')) fType = FileType.ZIP;
    
    return { 
        vault_id: vaultId, 
        name: file.name, 
        size: file.size, 
        type: fType, 
        mime_type: file.type, 
        url,
        max_downloads: settings?.maxDownloads,
        expires_at: settings?.expiresAt,
        delete_after_minutes: settings?.deleteAfterMinutes,
        download_count: 0
    };
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

    getAuthHeader: async () => {
        const { data: { session } } = await supabase.auth.getSession();
        return session ? { 'Authorization': `Bearer ${session.access_token}` } : {};
    },

    hashPassword: async (password: string): Promise<string> => {
        try {
            const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            const authHeader = await supabaseImpl.getAuthHeader();
            const response = await fetch(`${apiBase}/api/vault/hash-password`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    ...authHeader
                },
                body: JSON.stringify({ password })
            });
            if (!response.ok) throw new Error("Hashing failed");
            const { hash } = await response.json();
            return hash;
        } catch (error) {
            console.error("Password hashing failed:", error);
            throw error;
        }
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
        try {
            const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            const response = await fetch(`${apiBase}/api/vault/${id}`);
            if (!response.ok) return null;
            const data = await response.json();

            // --- FILTER EXPIRED/SELF-DESTRUCTED FILES ---
            const now = new Date();
            const activeFiles = (data.files || []).filter((f: any) => {
                if (f.max_downloads && (f.download_count || 0) >= f.max_downloads) return false;
                if (f.expires_at && new Date(f.expires_at) < now) return false;
                if (f.delete_after_minutes && f.first_viewed_at) {
                    const viewsAt = new Date(f.first_viewed_at);
                    const expiry = new Date(viewsAt.getTime() + f.delete_after_minutes * 60000);
                    if (expiry < now) return false;
                }
                return true;
            });

            data.files = activeFiles;

            // Increment vault view count
            try {
                await supabase.rpc('increment_vault_view', { vault_id: id });
            } catch (e) {
                console.warn("View increment failed:", e);
            }

            return mapDbVault(data);
        } catch (error) {
            console.error("Error fetching vault:", error);
            return null;
        }
    },

    verifyVaultPassword: async (vaultId: string, password: string): Promise<boolean> => {
        try {
            const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            const response = await fetch(`${apiBase}/api/vault/verify-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ vaultId, password })
            });
            return response.ok;
        } catch (error) {
            console.error("Password verification failed:", error);
            return false;
        }
    },

    incrementFileDownload: async (fileId: string) => {
        // Increment download count in DB
        const { data: file } = await supabase.from('files').select('id, url, max_downloads, download_count').eq('id', fileId).single();
        if (file) {
            const newCount = (file.download_count || 0) + 1;
            await supabase.from('files').update({ download_count: newCount }).eq('id', fileId);

            // Trigger Google Drive deletion if limit reached
            if (file.url.includes('drive.google.com') && file.max_downloads && newCount >= file.max_downloads) {
                await supabaseImpl.deleteFileFromDrive(file.url).catch(err => console.error("Drive auto-destruct failed:", err));
            }
        }
    },

    deleteFileFromDrive: async (url: string) => {
        const match = url.match(/\/d\/([^/|?]+)/) || url.match(/[?&]id=([^&]+)/);
        const fileId = match ? match[1] : null;
        if (!fileId) return;

        const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        // Note: This requires the user's Google tokens. In a real app, 
        // we'd retrieve them from the session or a secure store.
        // For this implementation, we'll look for them in localStorage as a fallback.
        const tokens = JSON.parse(localStorage.getItem('qrvault_google_tokens') || 'null');
        
        if (!tokens) {
            console.warn("Cannot delete from Drive: No tokens found for background destruct.");
            return;
        }

        try {
            await fetch(`${apiBase}/api/google-drive/delete-file`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tokens, fileId })
            });
        } catch (e) {
            console.error("Failed to call Drive deletion API", e);
        }
    },

    recordFileView: async (fileId: string) => {
        // Record first view time
        const { data: file } = await supabase.from('files').select('first_viewed_at').eq('id', fileId).single();
        if (file && !file.first_viewed_at) {
            await supabase.from('files').update({ first_viewed_at: new Date().toISOString() }).eq('id', fileId);
        }
    },

    createVault: async (userId: string, name: string, files: File[], links: string[], accessLevel: AccessLevel, email?: string, expiresAt?: string, maxViews?: number, password?: string, customDomain?: string, vaultType: VaultType = VaultType.SENDING, receivingConfig?: ReceivingConfig): Promise<Vault> => {
        await supabaseImpl.ensureProfile(userId, email);

        // 1. Create Vault Record
        let hashedPassword = password;
        if (password) {
            hashedPassword = await supabaseImpl.hashPassword(password);
        }

        const { data: vault, error } = await supabase.from('vaults').insert({
            user_id: userId,
            name,
            access_level: accessLevel,
            created_at: new Date().toISOString(),
            views: 0,
            active: true,
            expires_at: expiresAt,
            max_views: maxViews,
            password: hashedPassword,
            custom_domain: customDomain,
            vault_type: vaultType,
            receiving_config: receivingConfig
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
                    type: f.type || (f.mimeType?.startsWith('video/') ? FileType.VIDEO : FileType.OTHER),
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

            const fileSettings = (file as any).settings;
            await supabase.from('files').insert(createFileRecord(vault.id, file, publicUrl, fileSettings));
        }

        // 3. Add Links
        for (const link of links) {
            await supabase.from('files').insert({
                vault_id: vault.id, name: link, size: 0, type: FileType.LINK, mime_type: 'text/url', url: link.startsWith('http') ? link : `https://${link}`
            });
        }

        return (await supabaseImpl.getVaultById(vault.id)) as Vault;
    },

    updateVault: async (userId: string, id: string, name: string, newFiles: File[], newLinks: string[], deletedFileIds: string[], accessLevel?: AccessLevel, email?: string, expiresAt?: string, maxViews?: number, password?: string, customDomain?: string, vaultType?: VaultType, receivingConfig?: ReceivingConfig) => {
        await supabaseImpl.ensureProfile(userId, email);

        const updatePayload: any = { name };
        if (accessLevel) updatePayload.access_level = accessLevel;
        if (expiresAt !== undefined) updatePayload.expires_at = expiresAt;
        if (maxViews !== undefined) updatePayload.max_views = maxViews;
        if (password !== undefined) {
            updatePayload.password = password ? await supabaseImpl.hashPassword(password) : null;
        }
        if (customDomain !== undefined) updatePayload.custom_domain = customDomain;
        if (vaultType !== undefined) updatePayload.vault_type = vaultType;
        if (receivingConfig !== undefined) updatePayload.receiving_config = receivingConfig;

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
                    type: f.type || (f.mimeType?.startsWith('video/') ? FileType.VIDEO : FileType.OTHER),
                    mime_type: f.mimeType || 'application/octet-stream',
                    url: f.url,
                    max_downloads: f.maxDownloads,
                    expires_at: f.expiresAt,
                    delete_after_minutes: f.deleteAfterMinutes,
                    download_count: f.downloadCount || 0
                });
                continue;
            }

            const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
            const path = `${id}/${Math.random().toString(36).slice(2)}_${cleanName}`;

            const { error: uploadError } = await supabase.storage.from('vault-files').upload(path, file);
            if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

            const { data: { publicUrl } } = supabase.storage.from('vault-files').getPublicUrl(path);
            const fileSettings = (file as any).settings;
            await supabase.from('files').insert(createFileRecord(id, file, publicUrl, fileSettings));
        }

        // Add new links
        for (const link of newLinks) {
            await supabase.from('files').insert({ vault_id: id, name: link, size: 0, type: FileType.LINK, mime_type: 'text/url', url: link.startsWith('http') ? link : `https://${link}` });
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
                         (f.mimeType?.startsWith('video/') ? FileType.VIDEO :
                         (f.mimeType === 'application/pdf' ? FileType.PDF : FileType.OTHER));
            
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
    },

    submitContactForm: async (data: { name: string; email: string; subject: string; message: string }) => {
        // In a real app, this would send an email via an API
        console.log('Contact Form Submitted:', data);
        return new Promise((resolve) => setTimeout(resolve, 1000));
    },

    sendCancellationCode: async (userId: string, email: string) => {
        const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const authHeader = await supabaseImpl.getAuthHeader();
        
        const response = await fetch(`${apiBase}/api/auth/send-cancellation-code`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                ...authHeader
            },
            body: JSON.stringify({ email })
        });

        if (!response.ok) throw new Error("Failed to send cancellation code");
        return new Promise((resolve) => setTimeout(resolve, 1000));
    },

    verifyCancellationCode: async (userId: string, code: string) => {
        const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const authHeader = await supabaseImpl.getAuthHeader();

        const response = await fetch(`${apiBase}/api/auth/verify-cancellation-code`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                ...authHeader
            },
            body: JSON.stringify({ code })
        });

        if (response.ok) return true;
        throw new Error("Invalid verification code. Please try again.");
    },

    // --- SUBMISSION METHODS ---
    submitToVault: async (vaultId: string, senderData: Record<string, string>, files: File[]): Promise<void> => {
        // 1. Create Submission Entry
        const { data: submission, error: subError } = await supabase.from('submissions').insert({
            vault_id: vaultId,
            sender_data: senderData,
            created_at: new Date().toISOString()
        }).select().single();

        if (subError) throw new Error(`Submission failed: ${subError.message}`);

        // 2. Upload Files linked to this submission
        for (const file of files) {
            const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
            const path = `${vaultId}/submissions/${submission.id}/${Math.random().toString(36).slice(2)}_${cleanName}`;

            const { error: uploadError } = await supabase.storage.from('vault-files').upload(path, file);
            if (uploadError) throw new Error(`Upload failed for ${file.name}: ${uploadError.message}`);

            const { data: { publicUrl } } = supabase.storage.from('vault-files').getPublicUrl(path);

            // Create file record linked to submission
            await supabase.from('files').insert({
                vault_id: vaultId,
                submission_id: submission.id,
                name: file.name,
                size: file.size,
                type: file.type.startsWith('image/') ? FileType.IMAGE : (file.type === 'application/pdf' ? FileType.PDF : FileType.OTHER),
                mime_type: file.type,
                url: publicUrl
            });
        }
    },

    getSubmissions: async (vaultId: string): Promise<Submission[]> => {
        const { data, error } = await supabase
            .from('submissions')
            .select(`*, files (*)`)
            .eq('vault_id', vaultId)
            .order('created_at', { ascending: false });

        if (error) return [];

        return (data || []).map((s: any) => ({
            id: s.id,
            vaultId: s.vault_id,
            senderData: s.sender_data,
            fileIds: (s.files || []).map((f: any) => f.id),
            createdAt: s.created_at,
            files: (s.files || []).map((f: any) => ({
                id: f.id,
                name: f.name,
                size: f.size,
                type: f.type,
                url: f.url
            }))
        }));
    }
};

export const mockService = supabaseImpl;