# QR Vault — How It Works

## For Users

### Getting Started
1. Open `http://localhost:3000` in your browser
2. Sign up or sign in with email/password or Google
3. You'll land on the **Dashboard** where you manage your vaults

### Creating a Vault
1. Click **"+ Create New Vault"** on the dashboard
2. Enter a vault name
3. Upload files (drag & drop or click to browse) — images, PDFs, ZIPs, any file
4. Optionally add links
5. Choose access level: **Public** (anyone with QR) or **Restricted** (approval needed)
6. Click **Create** — your vault is saved and a unique QR code is generated

### Sharing via QR Code
- Click **"View QR"** on any vault card to see its QR code
- Download the QR as SVG or copy the shareable link
- Anyone scanning the QR can preview and download your files

### Google Drive Backup (Auto-Sync)
1. Click **"Connect Google Drive"** on the dashboard
2. Sign in with your Google account and grant permission
3. Once connected, the button disappears and a **"Drive Synced"** badge appears
4. Every time you create or update a vault, your data is **automatically backed up** to Google Drive:
   - A folder called **QRVM** is created in your Drive root
   - Inside QRVM, a sub-folder is created for each vault (named after the vault)
   - Each vault folder contains:
     - `vault-info.json` — vault metadata (name, created date, file list, links)
     - `qr-code.svg` — the QR code for the vault
     - All uploaded files (images, PDFs, ZIPs, etc.)
5. To disconnect, click the small **×** next to the "Drive Synced" badge

> **Note:** Plus and Pro users **must** connect Google Drive before creating vaults. Their storage is tracked on Google Drive (QRVM folder size).

### Plans & Storage
| Plan | Storage | Price | Google Drive Required |
|------|---------|-------|----------------------|
| Free | 1 GB | ₹0/forever | No |
| Plus | 10 GB | ₹99/month | Yes |
| Pro | 20 GB | ₹199/month | Yes |

- Upgrade from the dashboard or pricing page
- Click **"Pay ₹99"** or **"Pay ₹199"** to complete purchase instantly
- After payment, you'll see a **Thank You page** with:
  - Invoice summary (ID, plan, amount, valid until)
  - **Download Invoice** button (opens printable PDF)
  - **Go to Dashboard** button

### Cancel Subscription
1. Go to the **Pricing** page
2. Your current plan card will be highlighted in green with time remaining
3. Click **"Cancel Subscription"** below the timer
4. A confirmation modal appears — click **"Yes, Cancel"** to downgrade to Free

### Invoice History
- All invoices are saved and visible on the **Dashboard** under **"Invoice History"**
- Click the download icon on any invoice to print/save as PDF

---

## For Developers

### Tech Stack
- **Frontend**: React 18 + TypeScript + Tailwind CSS v4 + Vite
- **Backend**: Express 5 (TypeScript via tsx)
- **Database**: Supabase (PostgreSQL + Auth + Storage)
- **Payments**: Instant (no external gateway — see Change Notes)
- **Google Drive**: googleapis (OAuth2 + Drive API v3)

### Project Structure
```
qr-vault/
├── server.ts              # Express server (API routes + Vite middleware)
├── App.tsx                # React app with routes
├── index.tsx              # Entry point
├── index.html             # HTML template
├── index.css              # Global Tailwind styles
├── types.ts               # TypeScript types (Vault, User, Plan, etc.)
├── vite.config.ts         # Vite config with Tailwind plugin
├── supabase_setup.sql     # Database schema + migrations
├── package.json           # Dependencies and scripts
├── .env                   # Environment variables (DO NOT COMMIT)
├── GD.png                 # Google Drive icon
├── HOW_IT_WORKS.md        # This file
├── contexts/
│   └── AuthContext.tsx     # Supabase auth provider
├── services/
│   ├── supabaseClient.ts  # Supabase client init
│   └── mockService.ts     # Database operations (CRUD for vaults, users)
├── pages/
│   ├── Home.tsx           # Landing page
│   ├── Auth.tsx           # Login/Signup page
│   ├── Dashboard.tsx      # Main dashboard (vaults, Drive, invoices)
│   ├── Pricing.tsx        # Pricing plans with plan-aware UI
│   ├── Payment.tsx        # Instant payment + thank you + invoice
│   ├── PublicView.tsx     # Public vault viewer (scanned QR lands here)
│   ├── Legal.tsx          # Privacy, Terms, Refund pages
│   └── InfoPages.tsx      # About, Contact, FAQ, Security pages
└── components/
    └── Layout.tsx         # Navbar + footer wrapper
```

### Environment Variables (.env)
```
VITE_API_URL=http://localhost:3000
GOOGLE_CLIENT_ID=        # Google OAuth client ID
GOOGLE_CLIENT_SECRET=    # Google OAuth client secret
APP_URL=http://localhost:3000
```

### Running Locally
```bash
npm install
npm run dev        # Starts Express + Vite on port 3000
```

### API Endpoints

#### Authentication (Google OAuth for Drive)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/google/auth` | Returns Google OAuth URL |
| GET | `/api/google/callback` | OAuth callback, exchanges code for tokens |

#### Google Drive
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/google-drive/list` | List Drive folders (QRVM) |
| POST | `/api/google-drive/ensure-folder` | Find/create QRVM root folder |
| POST | `/api/google-drive/save-vault` | Save vault data + files to Drive |
| POST | `/api/google-drive/storage-usage` | Get total QRVM folder size (bytes) |

#### Other
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |

### Google Drive Auto-Save Flow
```
User creates/updates vault
        ↓
handleSubmit() in Dashboard.tsx
        ↓
mockService.createVault() → saves to Supabase
        ↓
saveVaultToDrive() (if googleTokens exist)
        ↓
POST /api/google-drive/ensure-folder → finds/creates QRVM folder
        ↓
POST /api/google-drive/save-vault
        ↓
Server creates vault sub-folder in QRVM
        ↓
Uploads vault-info.json + qr-code.svg + all files
        ↓
POST /api/google-drive/storage-usage → refreshes drive storage count
        ↓
Done!
```

### Google Cloud Console Setup
1. Create OAuth 2.0 Client ID at https://console.cloud.google.com/apis/credentials
2. Add authorized JavaScript origin: `http://localhost:3000`
3. Add authorized redirect URI: `http://localhost:3000/api/google/callback`
4. Enable Google Drive API
5. If app is in "Testing" mode, add your email as a test user

### Database (Supabase)
- Tables: `profiles`, `vaults`, `files`, `access_requests`
- Storage bucket: `vault-files`
- See `supabase_setup.sql` for full schema + migrations

---

## Change Notes

### v2.0 — Payment, Storage & Security Overhaul (March 2026)

#### Payment System
- **Removed Razorpay integration** entirely (no more `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET`)
- Payment is now **instant click-to-pay** — clicking "Pay ₹99" or **"Pay ₹199"** directly upgrades the plan
- After payment: Thank You page → Invoice summary → Download Invoice (PDF) → Go to Dashboard
- Previous plan is cancelled when upgrading (e.g., Plus → Pro cancels Plus first)

#### Subscription & UX Refinements
- **Custom Cancel Modal**: Replaced browser `confirm()` with a styled in-app modal in `Pricing.tsx`.
- **Server-Side Invoices**: Invoices are now saved to Supabase `invoices` table instead of `localStorage`, allowing cross-device history.
- **Dashboard Refinements**: Fixed "View QR" button cursor to show pointer/hand icon; restored and styled invoice download buttons.
- **Invoice Empty State**: Always showing history section with helpful empty state message.

#### Subscription Management
- Users can **cancel subscription** from the Pricing page via custom in-app modal
- Cancel sets: `plan = 'FREE'`, `storage_limit = 1 GB`, `subscription_expiry_date = NULL`
- Pricing page shows:
  - Current plan card in **green** with expiry countdown
  - **Subscription Expiry**: Tracked on profiles, enforced via Dashboard and Pricing checks.
- **Invoices**: Stored in `public.invoices` table, linked by `user_id`. Each record contains plan details, amount, and formatted date strings for PDF generation.

#### Google Drive Storage Enforcement
- Plus/Pro users **must connect Google Drive** before creating vaults
- Storage is tracked by recursively calculating QRVM folder size via Drive API
- New endpoint: `POST /api/google-drive/storage-usage`
- Storage limits: Plus = 10 GB, Pro = 20 GB (enforced on Drive, not Supabase)
- Dashboard storage card shows **"Drive Storage"** with Google Drive icon for paid plans

#### Database Changes
- `subscription_expiry_date` column must be **nullable** (set to NULL on cancel)
- No new tables added — same schema, see `supabase_setup.sql` for migration ALTERs
- If upgrading from older schema, run the MIGRATION section in `supabase_setup.sql`

#### Security Notes
- **RLS policies are currently open** (`using (true)`) — tighten for production:
  - Profiles: users should only read/write their own profile
  - Vaults: users should only CRUD their own vaults
  - Files: users should only access files in their own vaults
  - Access requests: vault owners manage requests, requesters can only create
- **Google OAuth tokens** are stored in `localStorage` — acceptable for demo, but for production consider:
  - Storing refresh tokens server-side in an encrypted `google_tokens` table
  - Using HTTP-only cookies for session management
- **Invoice data** is in `localStorage` — for production, store in a Supabase `invoices` table
- **CORS**: Currently no CORS restrictions — add allowed origins for production
- **Rate limiting**: No rate limiting on API endpoints — add `express-rate-limit` for production

#### Deployment Checklist
- [ ] Update `APP_URL` and `VITE_API_URL` to production domain
- [ ] Update Google Cloud Console redirect URIs to production domain
- [ ] Add production domain to Supabase Auth settings (URL Configuration)
- [ ] Tighten RLS policies (see Security Notes above)
- [ ] Move Google OAuth tokens to server-side storage
- [ ] Move invoice storage from localStorage to Supabase table
- [ ] Set up HTTPS (required for Google OAuth in production)
- [ ] Add rate limiting on API endpoints
- [ ] Set Supabase storage bucket to private and use signed URLs
- [ ] Remove `console.log` statements from server.ts
- [ ] Set `NODE_ENV=production` on hosting provider
