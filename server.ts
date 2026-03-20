import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { createServer as createViteServer } from 'vite';
import { google } from 'googleapis';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { Readable } from 'stream';

// Use diskStorage instead of memoryStorage for better handling of large files (prevents RAM issues)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, '/tmp'); // Render/Linux temp dir
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 1024 } // 1GB limit
});
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

dotenv.config();

const supabaseUrl = 'https://bftzcoofkitmjxfvqdei.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_publishable_ZAnSgAh055eiG7rS4Xzngw_5pucIUC4';
const supabase = createClient(supabaseUrl, supabaseKey);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Admin Password
const ADMIN_PASSWORD = '2008';

// Log Buffer for Admin Dashboard
const LOG_BUFFER: any[] = [];
const MAX_LOGS = 100;

const addLog = (type: string, message: string, details?: any) => {
  const log = {
    timestamp: new Date().toISOString(),
    type,
    message,
    details
  };
  LOG_BUFFER.unshift(log);
  if (LOG_BUFFER.length > MAX_LOGS) LOG_BUFFER.pop();
  
  if (type === 'ERROR') console.error(`[${type}] ${message}`, details || '');
  else console.log(`[${type}] ${message}`, details || '');
};

app.use(cors({
  origin: '*',
  methods: ["GET", "POST", "OPTIONS"],
  credentials: false
}));
app.use(express.json({ limit: '1024mb' }));
app.use(express.urlencoded({ limit: '1024mb', extended: true }));

// Google OAuth Setup
const getOAuth2Client = () => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const appUrl = process.env.APP_URL || 'http://localhost:3000';

  if (!clientId || !clientSecret) {
    console.warn('CRITICAL: Google Client ID or Secret is missing in environment variables!');
  }

  return new google.auth.OAuth2(
    clientId,
    clientSecret,
    `${appUrl}/api/google/callback`
  );
};

// API Routes Router
const apiRouter = express.Router();

// Logging Middleware for API
apiRouter.use((req, res, next) => {
  addLog('API', `${req.method} ${req.url}`);
  next();
});

// Admin Authentication Middleware
const adminAuth = (req: Request, res: Response, next: any) => {
  const password = req.headers['x-admin-password'];
  if (password === ADMIN_PASSWORD) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized admin access' });
  }
};

// Google OAuth Routes
apiRouter.get('/google/auth', (req: Request, res: Response) => {
  console.log("Google auth route hit");
  try {
    console.log('[Google Auth] Generating Auth URL...');
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.error('[Google Auth] Missing credentials in environment');
      return res.status(500).json({
        error: 'Google API is not configured on the server.',
        details: 'GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is missing. Please set them in your environment variables.'
      });
    }

    const oauth2Client = getOAuth2Client();
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
      ],
      prompt: 'consent'
    });
    console.log('[Google Auth] Auth URL generated:', authUrl);
    res.json({ authUrl });
  } catch (error: any) {
    console.error('[Google Auth] Error generating auth URL:', error);
    res.status(500).json({ error: 'Failed to generate auth URL', details: error.message });
  }
});

apiRouter.get('/google/auth/', (req: Request, res: Response) => {
  res.redirect('/api/google/auth');
});

apiRouter.get(['/google/callback', '/google/callback/'], async (req: Request, res: Response) => {
  const { code } = req.query;
  if (!code) return res.status(400).json({ error: 'Code is required' });

  const oauth2Client = getOAuth2Client();

  try {
    console.log('Exchanging code for tokens...');
    const { tokens } = await oauth2Client.getToken(code as string);
    console.log('Tokens received successfully, refresh token present:', !!tokens.refresh_token);

    // Send success message to parent window and close popup
    res.send(`
      <html>
        <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f9fafb;">
          <div style="text-align: center; padding: 2rem; background: white; border-radius: 1rem; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
            <h2 style="color: #111827; margin-bottom: 0.5rem;">Authentication Successful</h2>
            <p style="color: #4b5563;">Connecting to your vault... This window will close automatically.</p>
            <script>
              if (window.opener) {
                window.opener.postMessage({ 
                  type: 'GOOGLE_AUTH_SUCCESS', 
                  tokens: ${JSON.stringify(tokens)} 
                }, '*');
                window.close();
              } else {
                window.location.href = '/dashboard';
              }
            </script>
          </div>
        </body>
      </html>
    `);
  } catch (error: any) {
    console.error('Error exchanging code for tokens:', error);
    res.status(500).json({ error: 'Authentication failed', details: error.message });
  }
});

// Google Drive API Routes
apiRouter.post(['/google-drive/list', '/google-drive/list/'], async (req: Request, res: Response) => {
  const { tokens } = req.body;
  if (!tokens) return res.status(400).json({ error: 'Tokens required' });

  const oauth2Client = getOAuth2Client();
  console.log('[Google Drive] Tokens received:', tokens ? 'Tokens present' : 'Tokens missing');
  if (tokens) {
    console.log('[Google Drive] Refresh token present:', !!tokens.refresh_token);
  }
  oauth2Client.setCredentials(tokens);

  const drive = google.drive({ version: 'v3', auth: oauth2Client });

  try {
    const response = await drive.files.list({
      pageSize: 20,
      q: "mimeType = 'application/vnd.google-apps.folder' and trashed = false",
      fields: 'nextPageToken, files(id, name, mimeType, webViewLink, iconLink)',
    });
    res.json(response.data);
  } catch (error: any) {
    console.error('Drive API Error:', error);
    res.status(500).json({ error: 'Failed to list files', details: error.message });
  }
});

// Get total storage used in QRVM folder and user quota
apiRouter.post(['/google-drive/storage-usage', '/google-drive/storage-usage/'], async (req: Request, res: Response) => {
  const { tokens } = req.body;
  if (!tokens) return res.status(400).json({ error: 'Tokens required' });

  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials(tokens);
  const drive = google.drive({ version: 'v3', auth: oauth2Client });

  try {
    // Fetch user's overall Google Drive quota
    const aboutParams = {
      fields: 'storageQuota',
    };
    const aboutResponse = await drive.about.get(aboutParams);
    const driveQuota = {
      usage: parseInt(aboutResponse.data.storageQuota?.usage || '0', 10),
      limit: parseInt(aboutResponse.data.storageQuota?.limit || '0', 10),
    };

    // Find QRVM folder
    const folderSearch = await drive.files.list({
      q: "name = 'QRVM' and mimeType = 'application/vnd.google-apps.folder' and trashed = false",
      fields: 'files(id)',
      spaces: 'drive',
    });

    if (!folderSearch.data.files || folderSearch.data.files.length === 0) {
      return res.json({ totalBytes: 0, totalFiles: 0, driveQuota });
    }

    const qrvmId = folderSearch.data.files[0].id!;
    let totalBytes = 0;
    let totalFiles = 0;

    // Recursively calculate all file sizes inside QRVM
    const calcFolderSize = async (folderId: string) => {
      let pageToken: string | undefined;
      do {
        const result = await drive.files.list({
          q: `'${folderId}' in parents and trashed = false`,
          fields: 'nextPageToken, files(id, mimeType, size)',
          pageSize: 100,
          pageToken,
        });
        for (const f of result.data.files || []) {
          if (f.mimeType === 'application/vnd.google-apps.folder') {
            await calcFolderSize(f.id!);
          } else {
            totalBytes += parseInt(f.size || '0', 10);
            totalFiles++;
          }
        }
        pageToken = result.data.nextPageToken || undefined;
      } while (pageToken);
    };

    await calcFolderSize(qrvmId);
    console.log(`[Google Drive] QRVM storage: ${totalBytes} bytes, ${totalFiles} files. Overall Quota: ${driveQuota.usage} / ${driveQuota.limit}`);
    res.json({ totalBytes, totalFiles, driveQuota });
  } catch (error: any) {
    console.error('[Google Drive] Storage usage error:', error);
    res.status(500).json({ error: 'Failed to get storage usage', details: error.message });
  }
});

// Proxy route to handle Google Drive downloads and bypass virus scan warnings for large files
apiRouter.get(['/drive-proxy', '/drive-proxy/'], async (req: Request, res: Response) => {
  const { id, name } = req.query;
  if (!id) return res.status(400).json({ error: 'File ID is required' });

  addLog('DRIVE', `Proxying download for file ID: ${id}`);

  try {
    const downloadUrl = `https://drive.google.com/uc?export=download&id=${id}`;
    
    // Initial fetch to check for confirmation page (common for files > 100MB)
    let response = await fetch(downloadUrl, { redirect: 'follow' });
    
    // Handle large file "confirm" page by extracting the token and retrying
    if (response.status === 200 && response.headers.get('content-type')?.includes('text/html')) {
      const text = await response.text();
      const confirmMatch = text.match(/confirm=([a-zA-Z0-9_]+)/);
      if (confirmMatch) {
        const confirmToken = confirmMatch[1];
        addLog('DRIVE', `Large file detected for ${id}, using confirm token: ${confirmToken}`);
        response = await fetch(`${downloadUrl}&confirm=${confirmToken}`, { redirect: 'follow' });
      } else if (text.includes('google.com/ServiceLogin')) {
        addLog('ERROR', `Google Drive file ${id} is NOT public. Redirected to login.`);
        return res.status(403).json({ 
          error: 'Access Denied', 
          details: 'This Google Drive file is not public. Please set sharing to "Anyone with the link can view" in Google Drive.' 
        });
      } else {
        addLog('ERROR', `Google Drive returned unexpected HTML for ${id}`);
        return res.status(404).json({ 
          error: 'File not available', 
          details: 'Google Drive did not provide a download link. Ensure the file is shared correctly.' 
        });
      }
    }

    if (!response.ok) {
      addLog('ERROR', `Google Drive returned status ${response.status} for ${id}`);
      throw new Error(`Google Drive returned status ${response.status}`);
    }

    // Set headers for file download
    const fileName = (name as string) || 'download';
    // Use standard Content-Disposition for compatibility
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"; filename*=UTF-8''${encodeURIComponent(fileName)}`);
    res.setHeader('Content-Type', response.headers.get('content-type') || 'application/octet-stream');
    
    const contentLength = response.headers.get('content-length');
    if (contentLength) {
      res.setHeader('Content-Length', contentLength);
    }

    // Stream the response body directly to the client
    if (response.body) {
      // Node 18 fetch body is a Web Stream. Readable.fromWeb handles backpressure and is standard in Node 18+.
      if ((Readable as any).fromWeb) {
        (Readable as any).fromWeb(response.body).pipe(res);
      } else {
        // Fallback for environments where fromWeb might not be exposed on Readable directly
        const reader = response.body.getReader();
        const stream = new Readable({
          async read() {
            try {
              const { done, value } = await reader.read();
              if (done) this.push(null);
              else this.push(Buffer.from(value));
            } catch (err) { this.destroy(err as any); }
          }
        });
        stream.pipe(res);
      }
    } else {
      res.status(500).json({ error: 'Empty response body from Google Drive' });
    }

  } catch (error: any) {
    addLog('ERROR', `Drive Proxy Error for ${id}: ${error.message}`);
    res.status(500).json({ error: 'Failed to proxy Google Drive download', details: error.message });
  }
});

// Ensure QRVM folder exists in Google Drive
apiRouter.post(['/google-drive/ensure-folder', '/google-drive/ensure-folder/'], async (req: Request, res: Response) => {
  const { tokens } = req.body;
  if (!tokens) return res.status(400).json({ error: 'Tokens required' });

  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials(tokens);
  const drive = google.drive({ version: 'v3', auth: oauth2Client });

  try {
    // Check if QRVM folder already exists
    const search = await drive.files.list({
      q: "name = 'QRVM' and mimeType = 'application/vnd.google-apps.folder' and trashed = false",
      fields: 'files(id, name)',
      spaces: 'drive',
    });

    if (search.data.files && search.data.files.length > 0) {
      console.log('[Google Drive] QRVM folder found:', search.data.files[0].id);
      return res.json({ folderId: search.data.files[0].id });
    }

    // Create QRVM folder
    const folder = await drive.files.create({
      requestBody: {
        name: 'QRVM',
        mimeType: 'application/vnd.google-apps.folder',
      },
      fields: 'id',
    });

    console.log('[Google Drive] QRVM folder created:', folder.data.id);
    res.json({ folderId: folder.data.id });
  } catch (error: any) {
    console.error('[Google Drive] Ensure folder error:', error);
    res.status(500).json({ error: 'Failed to ensure QRVM folder', details: error.message });
  }
});

// Upload a single file to Google Drive
apiRouter.post(['/google-drive/upload-file', '/google-drive/upload-file/'], upload.single('file'), async (req: any, res: Response) => {
  const { tokens, folderId } = req.body;
  const file = req.file;

  if (!tokens || !folderId || !file) {
    return res.status(400).json({ error: 'tokens, folderId, and file are required' });
  }

  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials(JSON.parse(tokens));
  const drive = google.drive({ version: 'v3', auth: oauth2Client });

  try {
    const response = await drive.files.create({
      requestBody: {
        name: file.originalname,
        parents: [folderId],
      },
      media: {
        mimeType: file.mimetype,
        body: fs.createReadStream(file.path),
      },
      fields: 'id, name, webViewLink, size',
    });

    // Cleanup temp file
    fs.unlinkSync(file.path);

    console.log('[Google Drive] File uploaded:', response.data.id);
    res.json(response.data);
  } catch (error: any) {
    console.error('[Google Drive] Upload file error:', error);
    res.status(500).json({ error: 'Failed to upload file to Drive', details: error.message });
  }
});

// Save vault data to Google Drive QRVM folder
apiRouter.post(['/google-drive/save-vault', '/google-drive/save-vault/'], async (req: Request, res: Response) => {
  const { tokens, folderId, vault, qrSvg } = req.body;
  if (!tokens || !folderId || !vault) {
    return res.status(400).json({ error: 'tokens, folderId, and vault are required' });
  }

  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials(tokens);
  const drive = google.drive({ version: 'v3', auth: oauth2Client });

  try {
    const vaultFolderName = vault.name.replace(/[^a-zA-Z0-9 _-]/g, '_');

    // Check if vault sub-folder already exists
    const search = await drive.files.list({
      q: `name = '${vaultFolderName}' and '${folderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
      fields: 'files(id, name)',
      spaces: 'drive',
    });

    let vaultFolderId: string;

    if (search.data.files && search.data.files.length > 0) {
      vaultFolderId = search.data.files[0].id!;
      console.log('[Google Drive] Vault folder found:', vaultFolderId);
    } else {
      // Create vault sub-folder inside QRVM
      const vaultFolder = await drive.files.create({
        requestBody: {
          name: vaultFolderName,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [folderId],
        },
        fields: 'id',
      });
      vaultFolderId = vaultFolder.data.id!;
      console.log('[Google Drive] Vault folder created:', vaultFolderId);
    }

    // Upload vault-info.json
    const vaultInfo = {
      id: vault.id,
      name: vault.name,
      createdAt: vault.createdAt,
      accessLevel: vault.accessLevel,
      files: vault.files.map((f: any) => ({
        name: f.name,
        type: f.type,
        url: f.url,
        size: f.size,
      })),
      savedAt: new Date().toISOString(),
    };

    // Delete existing vault-info.json if exists
    const existingInfo = await drive.files.list({
      q: `name = 'vault-info.json' and '${vaultFolderId}' in parents and trashed = false`,
      fields: 'files(id)',
    });
    if (existingInfo.data.files) {
      for (const f of existingInfo.data.files) {
        await drive.files.delete({ fileId: f.id! });
      }
    }

    const { Readable } = await import('stream');

    await drive.files.create({
      requestBody: {
        name: 'vault-info.json',
        mimeType: 'application/json',
        parents: [vaultFolderId],
      },
      media: {
        mimeType: 'application/json',
        body: Readable.from([JSON.stringify(vaultInfo, null, 2)]),
      },
      fields: 'id',
    });
    console.log('[Google Drive] vault-info.json uploaded');

    // Upload QR code SVG if provided
    if (qrSvg) {
      // Delete existing QR SVG if exists
      const existingQr = await drive.files.list({
        q: `name = 'qr-code.svg' and '${vaultFolderId}' in parents and trashed = false`,
        fields: 'files(id)',
      });
      if (existingQr.data.files) {
        for (const f of existingQr.data.files) {
          await drive.files.delete({ fileId: f.id! });
        }
      }

      await drive.files.create({
        requestBody: {
          name: 'qr-code.svg',
          mimeType: 'image/svg+xml',
          parents: [vaultFolderId],
        },
        media: {
          mimeType: 'image/svg+xml',
          body: Readable.from([qrSvg]),
        },
        fields: 'id',
      });
      console.log('[Google Drive] qr-code.svg uploaded');
    }

    // Upload actual vault files from their URLs
    if (vault.files && vault.files.length > 0) {
      console.log(`[Google Drive] Uploading ${vault.files.length} vault files...`);

      for (const file of vault.files) {
        // Skip LINK type files or files already on Drive
        if (file.type === 'LINK' || !file.url || file.url.includes('drive.google.com') || file.url.includes('googleapis.com')) continue;

        try {
          const fileName = file.name || `file_${file.id}`;

          // Check if this file already exists in the Drive folder
          const existingFile = await drive.files.list({
            q: `name = '${fileName.replace(/'/g, "\\'")}' and '${vaultFolderId}' in parents and trashed = false`,
            fields: 'files(id)',
          });

          // Skip if file already exists
          if (existingFile.data.files && existingFile.data.files.length > 0) {
            console.log(`[Google Drive] File '${fileName}' already exists, skipping`);
            continue;
          }

          // Download file from Supabase URL
          console.log(`[Google Drive] Downloading: ${fileName}`);
          const fileResponse = await fetch(file.url);
          if (!fileResponse.ok) {
            console.error(`[Google Drive] Failed to download ${fileName}: ${fileResponse.status}`);
            continue;
          }

          const fileBuffer = Buffer.from(await fileResponse.arrayBuffer());
          const mimeType = file.mimeType || fileResponse.headers.get('content-type') || 'application/octet-stream';

          const { Readable: ReadableStream } = await import('stream');

          await drive.files.create({
            requestBody: {
              name: fileName,
              mimeType: mimeType,
              parents: [vaultFolderId],
            },
            media: {
              mimeType: mimeType,
              body: ReadableStream.from([fileBuffer]),
            },
            fields: 'id',
          });
          console.log(`[Google Drive] Uploaded: ${fileName}`);
        } catch (fileErr: any) {
          console.error(`[Google Drive] Error uploading file ${file.name}:`, fileErr.message);
          // Continue with other files even if one fails
        }
      }
    }

    res.json({ status: 'success', vaultFolderId });
  } catch (error: any) {
    console.error('[Google Drive] Save vault error:', error);
    res.status(500).json({ error: 'Failed to save vault to Drive', details: error.message });
  }
});

// Health Check
apiRouter.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Razorpay Routes
apiRouter.post('/razorpay/create-order', async (req: Request, res: Response) => {
  try {
    const { amount, currency = 'INR', receipt } = req.body;

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({ error: 'Razorpay keys not configured' });
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const options = {
      amount: amount * 100, // amount in smallest currency unit (paise)
      currency,
      receipt: receipt || `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error: any) {
    console.error('Razorpay create order error:', error);
    res.status(500).json({ error: 'Failed to create Razorpay order', details: error.message });
  }
});

apiRouter.post('/razorpay/verify', async (req: Request, res: Response) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      return res.status(500).json({ error: 'Razorpay secret not configured' });
    }

    const generated_signature = crypto
      .createHmac('sha256', secret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest('hex');

    if (generated_signature === razorpay_signature) {
      res.json({ status: 'success', message: 'Payment verified successfully' });
    } else {
      res.status(400).json({ status: 'failure', message: 'Invalid payment signature' });
    }
  } catch (error: any) {
    console.error('Razorpay verify error:', error);
    res.status(500).json({ error: 'Failed to verify payment', details: error.message });
  }
});

// Admin Routes
const adminRouter = express.Router();
adminRouter.use(adminAuth);

adminRouter.get('/overview', async (req, res) => {
  try {
    // 1. Fetch Users Data
    const { data: profiles, error: pError } = await supabase
      .from('profiles')
      .select('plan');
    
    if (pError) throw pError;

    const totalUsers = profiles.length;
    const paidUsersCount = profiles.filter(p => p.plan !== 'FREE').length;
    const plans = {
      free: profiles.filter(p => p.plan === 'FREE').length,
      starter: profiles.filter(p => p.plan === 'STARTER').length,
      pro: profiles.filter(p => p.plan === 'PRO').length
    };

    // 2. Fetch Revenue Data (from invoices)
    const { data: invoices, error: iError } = await supabase
      .from('invoices')
      .select('amount, timestamp')
      .order('timestamp', { ascending: true });

    if (iError) throw iError;

    // Group revenue by day for the last 30 days (1M)
    const last1MonthRevenue = new Array(30).fill(0);
    const oneDayMs = 24 * 60 * 60 * 1000;

    // Group revenue by month for the last 6 and 12 months
    const last6MonthsRevenue = new Array(6).fill(0);
    const last12MonthsRevenue = new Array(12).fill(0);
    const oneMonthMs = 30 * 24 * 60 * 60 * 1000;

    const now = Date.now();
    invoices.forEach(inv => {
      const ageMs = now - inv.timestamp;
      
      // 1M calculation
      const dayIdx = 29 - Math.floor(ageMs / oneDayMs);
      if (dayIdx >= 0 && dayIdx < 30) {
        last1MonthRevenue[dayIdx] += inv.amount;
      }

      // 6M calculation
      const monthIdx6 = 5 - Math.floor(ageMs / oneMonthMs);
      if (monthIdx6 >= 0 && monthIdx6 < 6) {
        last6MonthsRevenue[monthIdx6] += inv.amount;
      }

      // 12M calculation
      const monthIdx12 = 11 - Math.floor(ageMs / oneMonthMs);
      if (monthIdx12 >= 0 && monthIdx12 < 12) {
        last12MonthsRevenue[monthIdx12] += inv.amount;
      }
    });

    res.json({
      activeUsers: Math.floor(totalUsers * 0.4),
      totalUsers,
      paidUsers: paidUsersCount,
      unpaidUsers: totalUsers - paidUsersCount,
      plans,
      revenue: {
        last1Month: last1MonthRevenue,
        last3Months: last6MonthsRevenue.slice(3),
        last6Months: last6MonthsRevenue,
        last12Months: last12MonthsRevenue
      },
      health: {
        cpuUsage: Math.floor(Math.random() * 20) + 5,
        memoryUsage: Math.floor(Math.random() * 30) + 30,
        uptime: process.uptime(),
        loadSpeed: '0.6s',
        concurrentUsers: Math.floor(totalUsers * 0.05) + 5
      }
    });
  } catch (error: any) {
    console.error('[Admin API] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

adminRouter.get('/logs', (req, res) => {
  res.json(LOG_BUFFER);
});

adminRouter.get('/users/:userId/invoices', async (req, res) => {
  try {
    const { userId } = req.params;
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false });

    if (error) throw error;
    res.json(invoices);
  } catch (error: any) {
    console.error('[Admin API] Error fetching user invoices:', error);
    res.status(500).json({ error: error.message });
  }
});

adminRouter.get('/users', async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('profiles')
      .select('*')
      .order('id', { ascending: false });

    if (error) throw error;

    // Map to the format expected by the frontend
    const mappedUsers = users.map(u => ({
      id: u.id,
      name: u.full_name || 'Unnamed User',
      email: u.email,
      plan: u.plan,
      used: (u.storage_used / (1024 * 1024 * 1024)).toFixed(1) + ' GB',
      quota: (u.storage_limit / (1024 * 1024 * 1024)).toFixed(0) + ' GB',
      status: u.plan !== 'FREE' ? 'Active' : 'Trial' // Approximation
    }));

    res.json(mappedUsers);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.use('/admin', adminRouter);

// Mount API Router
app.use('/api', apiRouter);

// API 404 Handler - Catch unmatched API routes before Vite
app.use('/api', (req, res) => {
  res.status(404).json({
    error: 'API route not found',
    method: req.method,
    path: req.url
  });
});

// Vite Middleware
async function startServer() {
  // 1. Explicitly serve SEO files FIRST with absolute paths
  // This prevents SPA fallback (index.html) from intercepting these requests
  app.get('/robots.txt', (req, res) => {
    const robotsPath = process.env.NODE_ENV === 'production'
      ? path.join(__dirname, 'dist', 'robots.txt')
      : path.join(__dirname, 'public', 'robots.txt');
    
    console.log(`[SEO] Serving robots.txt from: ${robotsPath}`);
    res.type('text/plain').sendFile(robotsPath, (err) => {
      if (err) {
        console.error(`[SEO] Error serving robots.txt:`, err);
        // Fallback or send simple plain text if file missing
        res.status(200).send('User-agent: *\nAllow: /\n\nSitemap: https://qr-vault-2008.onrender.com/sitemap.xml');
      }
    });
  });

  app.get('/sitemap.xml', (req, res) => {
    const sitemapPath = process.env.NODE_ENV === 'production'
      ? path.join(__dirname, 'dist', 'sitemap.xml')
      : path.join(__dirname, 'public', 'sitemap.xml');
      
    console.log(`[SEO] Serving sitemap.xml from: ${sitemapPath}`);
    res.sendFile(sitemapPath, (err) => {
      if (err) {
        console.error(`[SEO] Error serving sitemap.xml:`, err);
        res.status(404).send('Sitemap not found');
      }
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // 2. Serve static files with absolute path
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));

    // 3. SPA Fallback (only for routes that didn't match files or SEO routes)
    app.get(/.*/, (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log('================================================');
    console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 APP_URL: ${process.env.APP_URL || 'Not set (defaulting to localhost)'}`);
    console.log('================================================');
  });
}

startServer();
