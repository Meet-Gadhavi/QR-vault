import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://bftzcoofkitmjxfvqdei.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Real client for Auth only
const realSupabase = createClient(supabaseUrl, supabaseKey);

// Custom client to redirect all DB queries and RPC calls to Mazeway DB
class MazewayClient {
  private apiKey: string;
  private apiBase = 'https://mazeway-db.onrender.com/api/v1';

  // Delegate auth to real Supabase
  auth = realSupabase.auth;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  from(table: string) {
    const apiKey = this.apiKey;
    const apiBase = this.apiBase;

    let selectFields = '*';
    let filterEqs: { col: string; val: any }[] = [];
    let filterIns: { col: string; list: any[] }[] = [];
    let filterLts: { col: string; val: any }[] = [];
    let filterGts: { col: string; val: any }[] = [];
    let orderCol: string | null = null;
    let orderAsc = true;
    let isSingle = false;
    let limitCount: number | null = null;

    const requestHeaders = {
      'apikey': apiKey,
      'Content-Type': 'application/json'
    };

    const runSelect = async () => {
      try {
        const res = await fetch(`${apiBase}/tables/${table}/rows`, {
          headers: requestHeaders
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Select failed: ${text}`);
        }
        let rows = await res.json();

        // Perform in-memory filtering
        for (const eq of filterEqs) {
          if (table === 'files' && eq.col === 'vaults.user_id') {
            const vaultsRes = await fetch(`${apiBase}/tables/vaults/rows`, { headers: requestHeaders });
            const vaults = vaultsRes.ok ? await vaultsRes.json() : [];
            const userVaultIds = new Set(vaults.filter((v: any) => v.user_id === eq.val).map((v: any) => v.id));
            rows = rows.filter((r: any) => userVaultIds.has(r.vault_id));
          } else {
            rows = rows.filter((r: any) => {
              const rowVal = r[eq.col];
              if (typeof rowVal === 'boolean') return rowVal === (eq.val === 'true' || eq.val === true);
              if (typeof rowVal === 'number') return Number(rowVal) === Number(eq.val);
              return String(rowVal) === String(eq.val);
            });
          }
        }

        for (const fIn of filterIns) {
          const listSet = new Set(fIn.list.map(String));
          rows = rows.filter((r: any) => listSet.has(String(r[fIn.col])));
        }

        for (const lt of filterLts) {
          rows = rows.filter((r: any) => new Date(r[lt.col]) < new Date(lt.val));
        }

        for (const gt of filterGts) {
          rows = rows.filter((r: any) => new Date(r[gt.col]) > new Date(gt.val));
        }

        // Perform in-memory joins
        if (selectFields.includes('files (*)') || selectFields.includes('requests:access_requests (*)')) {
          let files: any[] = [];
          if (selectFields.includes('files (*)')) {
            const filesRes = await fetch(`${apiBase}/tables/files/rows`, { headers: requestHeaders });
            files = filesRes.ok ? await filesRes.json() : [];
          }

          let requests: any[] = [];
          if (selectFields.includes('requests:access_requests (*)')) {
            const reqRes = await fetch(`${apiBase}/tables/access_requests/rows`, { headers: requestHeaders });
            requests = reqRes.ok ? await reqRes.json() : [];
          }

          rows = rows.map((vault: any) => {
            const vFiles = files.filter((f: any) => f.vault_id === vault.id);
            const vRequests = requests.filter((r: any) => r.vault_id === vault.id);
            return {
              ...vault,
              files: vFiles,
              requests: vRequests
            };
          });
        }

        if (table === 'submissions' && selectFields.includes('files (*)')) {
          const filesRes = await fetch(`${apiBase}/tables/files/rows`, { headers: requestHeaders });
          const files = filesRes.ok ? await filesRes.json() : [];
          rows = rows.map((s: any) => ({
            ...s,
            files: files.filter((f: any) => f.submission_id === s.id)
          }));
        }

        if (orderCol) {
          rows.sort((a: any, b: any) => {
            const valA = a[orderCol!];
            const valB = b[orderCol!];
            if (valA === valB) return 0;
            const factor = orderAsc ? 1 : -1;
            return valA < valB ? -factor : factor;
          });
        }

        if (limitCount !== null) {
          rows = rows.slice(0, limitCount);
        }

        if (isSingle) {
          return { data: rows[0] || null, error: null };
        }
        return { data: rows, error: null };
      } catch (err: any) {
        return { data: null, error: err };
      }
    };

    const chain = {
      select: (fields = '*') => {
        selectFields = fields;
        return chain;
      },
      eq: (col: string, val: any) => {
        filterEqs.push({ col, val });
        return chain;
      },
      in: (col: string, list: any[]) => {
        filterIns.push({ col, list });
        return chain;
      },
      lt: (col: string, val: any) => {
        filterLts.push({ col, val });
        return chain;
      },
      gt: (col: string, val: any) => {
        filterGts.push({ col, val });
        return chain;
      },
      order: (col: string, options = { ascending: true }) => {
        orderCol = col;
        orderAsc = options.ascending;
        return chain;
      },
      limit: (count: number) => {
        limitCount = count;
        return chain;
      },
      single: () => {
        isSingle = true;
        return runSelect();
      },
      insert: (payload: any) => {
        const runInsert = async () => {
          try {
            const rowsToInsert = Array.isArray(payload) ? payload : [payload];
            const insertedRows = [];
            for (const r of rowsToInsert) {
              const res = await fetch(`${apiBase}/tables/${table}/rows`, {
                method: 'POST',
                headers: requestHeaders,
                body: JSON.stringify({ row: r })
              });
              if (!res.ok) {
                const text = await res.text();
                throw new Error(`Insert failed: ${text}`);
              }
              insertedRows.push(r);
            }
            const dataVal = Array.isArray(payload) ? insertedRows : insertedRows[0];
            return { data: dataVal, error: null };
          } catch (err: any) {
            return { data: null, error: err };
          }
        };
        const runInsertPromise = runInsert();
        return {
          select: () => {
            return {
              single: async () => {
                const res = await runInsertPromise;
                return { data: res.data ? (Array.isArray(res.data) ? res.data[0] : res.data) : null, error: res.error };
              },
              then: (cb: any) => runInsertPromise.then(cb),
              catch: (cb: any) => runInsertPromise.catch(cb)
            };
          },
          then: (cb: any) => runInsertPromise.then(cb),
          catch: (cb: any) => runInsertPromise.catch(cb)
        };
      },
      update: (payload: any) => {
        const runUpdate = async () => {
          try {
            const selectRes = await runSelect();
            if (selectRes.error) throw selectRes.error;
            const rowsToUpdate = selectRes.data ? (Array.isArray(selectRes.data) ? selectRes.data : [selectRes.data]) : [];
            
            for (const r of rowsToUpdate) {
              const res = await fetch(`${apiBase}/tables/${table}/rows`, {
                method: 'PATCH',
                headers: requestHeaders,
                body: JSON.stringify({
                  match: { id: r.id },
                  update: payload
                })
              });
              if (!res.ok) {
                const text = await res.text();
                throw new Error(`Update failed: ${text}`);
              }
            }
            return { data: rowsToUpdate, error: null };
          } catch (err: any) {
            return { data: null, error: err };
          }
        };
        const runUpdatePromise = runUpdate();
        return {
          then: (cb: any) => runUpdatePromise.then(cb),
          catch: (cb: any) => runUpdatePromise.catch(cb)
        };
      },
      delete: () => {
        const runDelete = async () => {
          try {
            const selectRes = await runSelect();
            if (selectRes.error) throw selectRes.error;
            const rowsToDelete = selectRes.data ? (Array.isArray(selectRes.data) ? selectRes.data : [selectRes.data]) : [];
            
            for (const r of rowsToDelete) {
              const res = await fetch(`${apiBase}/tables/${table}/rows`, {
                method: 'DELETE',
                headers: requestHeaders,
                body: JSON.stringify({
                  match: { id: r.id }
                })
              });
              if (!res.ok) {
                const text = await res.text();
                throw new Error(`Delete failed: ${text}`);
              }
            }
            return { data: rowsToDelete, error: null };
          } catch (err: any) {
            return { data: null, error: err };
          }
        };
        const runDeletePromise = runDelete();
        return {
          then: (cb: any) => runDeletePromise.then(cb),
          catch: (cb: any) => runDeletePromise.catch(cb)
        };
      },
      upsert: (payload: any) => {
        const runUpsert = async () => {
          try {
            const records = Array.isArray(payload) ? payload : [payload];
            for (const r of records) {
              const checkRes = await fetch(`${apiBase}/tables/${table}/rows`, { headers: requestHeaders });
              const rows = checkRes.ok ? await checkRes.json() : [];
              const exists = rows.some((row: any) => row.id === r.id);
              if (exists) {
                await fetch(`${apiBase}/tables/${table}/rows`, {
                  method: 'PATCH',
                  headers: requestHeaders,
                  body: JSON.stringify({
                    match: { id: r.id },
                    update: r
                  })
                });
              } else {
                await fetch(`${apiBase}/tables/${table}/rows`, {
                  method: 'POST',
                  headers: requestHeaders,
                  body: JSON.stringify({ row: r })
                });
              }
            }
            return { error: null };
          } catch (err: any) {
            return { error: err };
          }
        };
        const runUpsertPromise = runUpsert();
        return {
          then: (cb: any) => runUpsertPromise.then(cb),
          catch: (cb: any) => runUpsertPromise.catch(cb)
        };
      },
      then: (cb: any) => runSelect().then(cb),
      catch: (cb: any) => runSelect().catch(cb)
    };

    return chain;
  }

  rpc(name: string, args: any) {
    const runRpc = async () => {
      if (name === 'increment_vault_view') {
        const vaultId = args.vault_id;
        const headers = { 'apikey': this.apiKey, 'Content-Type': 'application/json' };
        try {
          const res = await fetch(`${this.apiBase}/tables/vaults/rows`, { headers });
          const rows = res.ok ? await res.json() : [];
          const vault = rows.find((r: any) => r.id === vaultId);
          if (vault) {
            const views = (parseInt(vault.views || '0', 10) || 0) + 1;
            await fetch(`${this.apiBase}/tables/vaults/rows`, {
              method: 'PATCH',
              headers,
              body: JSON.stringify({
                match: { id: vaultId },
                update: { views }
              })
            });
          }
          return { error: null };
        } catch (e: any) {
          return { error: e };
        }
      }
      return { error: null };
    };
    const rpcPromise = runRpc();
    return {
      then: (cb: any) => rpcPromise.then(cb),
      catch: (cb: any) => rpcPromise.catch(cb)
    };
  }

  // Storage Mock (Bypasses Supabase Storage completely, converting to base64 Data URLs)
  storage = {
    from: (bucket: string) => {
      return {
        upload: async (path: string, file: File) => {
          try {
            const base64Url = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = () => reject(reader.error);
              reader.readAsDataURL(file);
            });
            (window as any)._fileCache = (window as any)._fileCache || {};
            (window as any)._fileCache[path] = base64Url;
            return { data: { path }, error: null };
          } catch (e: any) {
            return { data: null, error: e };
          }
        },
        getPublicUrl: (path: string) => {
          const cache = (window as any)._fileCache || {};
          const publicUrl = cache[path] || '';
          return { data: { publicUrl } };
        },
        remove: async (paths: string[]) => {
          const cache = (window as any)._fileCache || {};
          for (const p of paths) {
            delete cache[p];
          }
          return { data: null, error: null };
        }
      };
    }
  };
}

const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJncm91cCI6ImFub24iLCJpYXQiOjE3ODA1MDQ3NDF9.mazeway_db_anon_bW2ZZjt2Sjo1wgXjztKaHNtQ3qDweIkMBLdxkXt2JfHUoJ6SNuDXI94uilesnFoC';

export const supabase = new MazewayClient(anonKey) as any;
