# QR Vault - Fixes and Updates Report

**Generated:** 2026-04-17  
**Project:** QR Vault (Secure File Storage & Sharing Platform)

---

## Critical Issues (Must Fix)

### 1. Missing Environment Variables in Supabase Client
**Location:** `services/supabaseClient.ts:3-4`

**Issue:** The Supabase client falls back to a mock implementation when `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` are missing. This causes silent failures in production.

**Impact:** All database operations fail silently, leading to data loss and broken authentication.

**Fix:**
```typescript
// Add explicit error handling and user notification
if (!supabaseUrl || !supabaseKey) {
  console.error("[CRITICAL] Supabase credentials missing!");
  // Show user-facing error in development
  if (import.meta.env.DEV) {
    alert("Missing Supabase configuration. Check .env file.");
  }
}
```

---

### 2. Password Stored in LocalStorage (Security Risk)
**Location:** `pages/PublicView.tsx:68-74`

**Issue:** Vault passwords are stored in plaintext in localStorage (`qrvault_pass_${vault.id}`), making them accessible to XSS attacks.

**Impact:** Compromised user security, potential unauthorized access to password-protected vaults.

**Fix:**
- Use session storage instead (clears on browser close)
- Implement short-lived tokens from backend
- Add password encryption at rest

---

### 3. Google OAuth Tokens in LocalStorage
**Location:** `pages/Dashboard.tsx:263-272`, `mockService.ts:271`

**Issue:** Google Drive refresh tokens stored unencrypted in localStorage, vulnerable to XSS token theft.

**Impact:** Attackers could gain persistent access to user's Google Drive.

**Fix:**
- Store tokens in httpOnly cookies via backend
- Implement token rotation
- Add scope restrictions

---

### 4. No Input Validation on File Upload Settings
**Location:** `pages/Dashboard.tsx:207` (fileSettings state)

**Issue:** File settings (maxDownloads, expiresAt, deleteAfterMinutes) are stored without validation, allowing potential injection of malformed data.

**Impact:** Could lead to data corruption or unexpected vault behavior.

**Fix:**
```typescript
// Add validation before saving
const validateFileSettings = (settings: any) => {
  if (settings.maxDownloads && settings.maxDownloads < 1) return false;
  if (settings.deleteAfterMinutes && settings.deleteAfterMinutes < 1) return false;
  return true;
};
```

---

### 5. Race Condition in Auth State Navigation
**Location:** `pages/Auth.tsx:17-21`, `pages/Dashboard.tsx:248-253`

**Issue:** Navigation redirects happen before auth state is fully settled, causing potential redirect loops or flash of unauthenticated content.

**Fix:**
```typescript
// Wait for loading to complete before navigating
useEffect(() => {
  if (!loading && isAuthenticated) {
    navigate('/dashboard');
  }
}, [isAuthenticated, loading, navigate]);
```

---

## Medium Issues (Should Fix)

### 1. Inconsistent Error Handling Across Components
**Location:** Multiple files (`Dashboard.tsx`, `PublicView.tsx`, `Payment.tsx`)

**Issue:** Some errors are logged to console only, others show toasts, some do nothing. No unified error boundary.

**Fix:** Implement a global ErrorBoundary component with user-friendly fallbacks.

---

### 2. Missing Loading States for Async Operations
**Location:** `pages/Dashboard.tsx:343-383` (loadData function)

**Issue:** Only a general loading state exists. Individual operations (upload, delete, edit) lack granular feedback.

**Fix:** Add per-operation loading states:
```typescript
const [operationLoading, setOperationLoading] = useState<'upload' | 'delete' | 'edit' | null>(null);
```

---

### 3. Hardcoded API URLs
**Location:** `mockService.ts:169`, `Payment.tsx:70`

**Issue:** API URLs fallback to `http://localhost:3000`, causing issues in production if environment variables aren't set.

**Fix:** Use absolute URLs from environment variables with proper validation.

---

### 4. No Rate Limiting on Password Verification
**Location:** `mockService.ts:233-246`

**Issue:** No rate limiting on password verification attempts, allowing brute force attacks.

**Fix:** Implement exponential backoff and account lockout after failed attempts.

---

### 5. Missing File Type Validation on Upload
**Location:** `pages/Dashboard.tsx` (file upload logic)

**Issue:** File type detection relies on MIME type which can be spoofed. No server-side validation visible.

**Fix:** Add magic number/file signature validation for sensitive file types.

---

### 6. Inconsistent Date Handling
**Location:** Throughout codebase

**Issue:** Mix of `new Date()`, ISO strings, and timestamps without timezone handling.

**Fix:** Standardize on a date library (date-fns or dayjs) with UTC storage.

---

## Minor Issues (Nice to Fix)

### 1. Accessibility Issues
**Locations:** Multiple components

**Issues:**
- Missing aria-labels on icon-only buttons
- Color contrast may not meet WCAG standards in dark mode
- No keyboard navigation hints for flip cards

---

### 2. Code Duplication
**Location:** `components/Dashboard/VaultCard.tsx` and `pages/Dashboard.tsx`

**Issue:** `generateTrendData` function duplicated in both files.

**Fix:** Extract to a shared utility file.

---

### 3. Magic Numbers
**Location:** `pages/Dashboard.tsx:44`, `VaultCard.tsx:30`

**Issue:** Hardcoded values for chart thresholds (60, 35, 15) without explanation.

**Fix:** Extract to constants with descriptive names:
```typescript
const ENGAGEMENT_THRESHOLDS = { HIGH: 60, MEDIUM: 35, LOW: 15 };
```

---

### 4. Unused Imports
**Location:** Multiple files

**Issue:** Dead code increases bundle size.

**Fix:** Run tree-shaking analysis and remove unused imports.

---

### 5. Inconsistent Toast Usage
**Location:** Throughout codebase

**Issue:** Some errors use toast, others use inline messages, some use neither.

**Fix:** Create a unified notification service wrapper.

---

### 6. No Cleanup for Aborted Operations
**Location:** `pages/PublicView.tsx:229-300` (bulk download)

**Issue:** If user navigates away during bulk download, no cleanup of partial ZIP files.

---

### 7. Missing TypeScript Types
**Location:** `services/mockService.ts:621`

**Issue:** Some functions use `any` type, reducing type safety.

---

### 8. Skeleton Loading Flicker
**Location:** `pages/Dashboard.tsx:21-22`

**Issue:** Skeleton shows even for cached/fast loads, causing unnecessary visual noise.

**Fix:** Add delay before showing skeleton:
```typescript
const [showSkeleton, setShowSkeleton] = useState(false);
useEffect(() => {
  const timer = setTimeout(() => !loaded && setShowSkeleton(true), 200);
  return () => clearTimeout(timer);
}, [loaded]);
```

---

## Top 5 Recommended Features

### 1. Two-Factor Authentication (2FA)
**Priority:** Critical for Security

**Description:** Add TOTP-based 2FA (Google Authenticator, Authy) for account login and sensitive operations (vault deletion, password changes).

**Implementation:**
- Use `speakeasy` or `otpauth` library
- Store encrypted secrets in database
- Provide backup codes for recovery
- Add UI for enrollment and management

**Business Value:** Essential for enterprise adoption, compliance requirements.

---

### 2. Real-Time Collaboration & Sharing
**Priority:** High

**Description:** Allow multiple users to access and edit shared vaults with role-based permissions (Owner, Editor, Viewer).

**Implementation:**
- Create `vault_collaborators` table with role enum
- Add invitation system with email notifications
- Implement permission checks on all vault operations
- Add activity log for audit trail

**Business Value:** Enables team workflows, justifies higher pricing tiers.

---

### 3. Advanced Analytics Dashboard
**Priority:** Medium-High

**Description:** Expand current analytics with geographic data, device types, referrer tracking, and engagement funnels.

**Implementation:**
- Track user agent, IP (hashed for privacy), referrer on each view
- Add charts for geographic distribution, device breakdown
- Implement conversion funnels (view → download)
- Add exportable reports (PDF/CSV)

**Business Value:** Differentiates from competitors, valuable for marketing users.

---

### 4. Scheduled Vault Operations
**Priority:** Medium

**Description:** Allow users to schedule vault creation, expiration, or file additions/removals at specific times.

**Implementation:**
- Add `scheduled_actions` table
- Use cron jobs or queue system (Bull, Agenda)
- Add UI for scheduling with timezone support
- Send notifications before scheduled actions

**Business Value:** Useful for time-sensitive releases, compliance scenarios.

---

### 5. API Key Management & Developer Portal
**Priority:** Medium

**Description:** Allow users to generate API keys for programmatic vault management with rate limiting and usage dashboards.

**Implementation:**
- Add `api_keys` table with hashed keys
- Implement rate limiting per key
- Create developer documentation
- Add usage analytics dashboard
- Support webhooks for vault events

**Business Value:** Enables integrations, attracts developer users, creates ecosystem.

---

## Additional Recommendations

### Performance Optimizations
1. **Lazy Load Heavy Components:** Split chart libraries, QR code generator
2. **Image Optimization:** Add WebP conversion, responsive images
3. **Service Worker:** Cache static assets for offline support
4. **Database Indexing:** Add indexes on frequently queried columns

### Security Enhancements
1. **Content Security Policy:** Add CSP headers to prevent XSS
2. **Rate Limiting:** Implement on all authentication endpoints
3. **Audit Logging:** Log all sensitive operations
4. **File Scanning:** Integrate virus scanning (ClamAV) for uploads

### UX Improvements
1. **Onboarding Tour:** First-time user guidance
2. **Keyboard Shortcuts:** Power user features
3. **Bulk Operations:** Select multiple vaults for batch actions
4. **Search Improvements:** Full-text search, filters, saved searches

---

## Summary

| Category | Count |
|----------|-------|
| Critical Issues | 5 |
| Medium Issues | 6 |
| Minor Issues | 8 |
| Recommended Features | 5 |

**Immediate Action Items:**
1. Fix Supabase credential handling
2. Secure password/token storage
3. Add input validation
4. Implement error boundaries

**Next Sprint:**
1. Add 2FA support
2. Implement collaboration features
3. Enhance analytics dashboard

---

*Report generated by automated code analysis*
