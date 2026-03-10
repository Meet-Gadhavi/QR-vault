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

const upload = multer({ storage: multer.memoryStorage() });

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(cors({
  origin: '*',
  methods: ["GET", "POST", "OPTIONS"],
  credentials: false
}));
app.use(express.json());

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
  console.log(`[API Request] ${req.method} ${req.url}`);
  next();
});

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
        body: Readable.from(file.buffer),
      },
      fields: 'id, name, webViewLink, size',
    });

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
  // Always serve public files (like robots.txt, sitemap.xml)
  app.use(express.static('public'));

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production (if built)
    app.use(express.static('dist'));

    // SPA Fallback for BrowserRouter
    app.get(/.*/, (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
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
