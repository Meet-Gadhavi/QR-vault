export type MazewayColumnSchema = {
  name: string;
  type: string;
  isPrimaryKey?: boolean;
};

export type MazewayTableSchema = {
  name: string;
  rls: string;
  columns: MazewayColumnSchema[];
};

export const MAZEWAY_TABLE_SCHEMAS: MazewayTableSchema[] = [
  {
    name: 'profiles',
    rls: 'Enabled',
    columns: [
      { name: 'id', type: 'uuid', isPrimaryKey: true },
      { name: 'email', type: 'text' },
      { name: 'full_name', type: 'text' },
      { name: 'plan', type: 'text' },
      { name: 'storage_used', type: 'bigint' },
      { name: 'storage_limit', type: 'bigint' },
      { name: 'subscription_expiry_date', type: 'timestamp' },
      { name: 'updated_at', type: 'timestamp' }
    ]
  },
  {
    name: 'vaults',
    rls: 'Enabled',
    columns: [
      { name: 'id', type: 'uuid', isPrimaryKey: true },
      { name: 'user_id', type: 'uuid' },
      { name: 'name', type: 'text' },
      { name: 'created_at', type: 'timestamp' },
      { name: 'views', type: 'integer' },
      { name: 'active', type: 'boolean' },
      { name: 'access_level', type: 'text' },
      { name: 'expires_at', type: 'timestamp' },
      { name: 'max_views', type: 'integer' },
      { name: 'report_count', type: 'integer' },
      { name: 'locked_until', type: 'timestamp' },
      { name: 'password', type: 'text' },
      { name: 'custom_domain', type: 'text' },
      { name: 'vault_type', type: 'text' },
      { name: 'receiving_config', type: 'text' }
    ]
  },
  {
    name: 'files',
    rls: 'Enabled',
    columns: [
      { name: 'id', type: 'uuid', isPrimaryKey: true },
      { name: 'vault_id', type: 'uuid' },
      { name: 'name', type: 'text' },
      { name: 'size', type: 'bigint' },
      { name: 'type', type: 'text' },
      { name: 'mime_type', type: 'text' },
      { name: 'url', type: 'text' },
      { name: 'max_downloads', type: 'integer' },
      { name: 'download_count', type: 'integer' },
      { name: 'expires_at', type: 'timestamp' },
      { name: 'delete_after_minutes', type: 'integer' },
      { name: 'first_viewed_at', type: 'timestamp' },
      { name: 'submission_id', type: 'uuid' }
    ]
  },
  {
    name: 'access_requests',
    rls: 'Enabled',
    columns: [
      { name: 'id', type: 'uuid', isPrimaryKey: true },
      { name: 'vault_id', type: 'uuid' },
      { name: 'email', type: 'text' },
      { name: 'status', type: 'text' },
      { name: 'requested_at', type: 'timestamp' }
    ]
  },
  {
    name: 'invoices',
    rls: 'Enabled',
    columns: [
      { name: 'id', type: 'text', isPrimaryKey: true },
      { name: 'user_id', type: 'uuid' },
      { name: 'date', type: 'text' },
      { name: 'plan', type: 'text' },
      { name: 'amount', type: 'integer' },
      { name: 'expiry', type: 'text' },
      { name: 'timestamp', type: 'bigint' }
    ]
  },
  {
    name: 'deleted_vault_logs',
    rls: 'Enabled',
    columns: [
      { name: 'id', type: 'uuid', isPrimaryKey: true },
      { name: 'user_id', type: 'uuid' },
      { name: 'vault_name', type: 'text' },
      { name: 'original_vault_id', type: 'uuid' },
      { name: 'views', type: 'integer' },
      { name: 'deletion_reason', type: 'text' },
      { name: 'file_manifest', type: 'text' },
      { name: 'created_at', type: 'timestamp' },
      { name: 'deleted_at', type: 'timestamp' }
    ]
  },
  {
    name: 'reports',
    rls: 'Enabled',
    columns: [
      { name: 'id', type: 'uuid', isPrimaryKey: true },
      { name: 'vault_id', type: 'uuid' },
      { name: 'file_ids', type: 'text' },
      { name: 'reason_virus', type: 'boolean' },
      { name: 'reason_content', type: 'boolean' },
      { name: 'custom_message', type: 'text' },
      { name: 'expires_at', type: 'timestamp' },
      { name: 'created_at', type: 'timestamp' }
    ]
  },
  {
    name: 'submissions',
    rls: 'Enabled',
    columns: [
      { name: 'id', type: 'uuid', isPrimaryKey: true },
      { name: 'vault_id', type: 'uuid' },
      { name: 'sender_data', type: 'text' },
      { name: 'created_at', type: 'timestamp' }
    ]
  }
];

export function isMazewayTableMissingError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error || '');
  return /Table\s+'[^']+'\s+not found/i.test(message);
}

export async function ensureMazewayTables(
  apiBase: string,
  apiKey: string,
  fetchImpl: typeof fetch = fetch
) {
  const headers = {
    apikey: apiKey,
    'Content-Type': 'application/json'
  };

  const res = await fetchImpl(`${apiBase}/tables`, { headers });
  if (!res.ok) {
    throw new Error(`[Mazeway DB] Failed to list tables: ${await res.text()}`);
  }

  const tables = await res.json();
  const existingTableNames = new Set(tables.map((table: any) => table.name));
  const created: string[] = [];

  for (const schema of MAZEWAY_TABLE_SCHEMAS) {
    if (existingTableNames.has(schema.name)) continue;

    const createRes = await fetchImpl(`${apiBase}/tables`, {
      method: 'POST',
      headers,
      body: JSON.stringify(schema)
    });

    if (!createRes.ok) {
      throw new Error(`[Mazeway DB] Failed to create table ${schema.name}: ${await createRes.text()}`);
    }

    created.push(schema.name);
  }

  return created;
}
