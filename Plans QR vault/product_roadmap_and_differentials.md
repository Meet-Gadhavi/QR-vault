# QR Vault: Product Strategy & Roadmap

This document outlines the differentiation between the **Plus** and **Pro** plans, identifies missing features, and suggests improvements to make QR Vault a market leader in secure file sharing via QR.

---

## 1. Plan Differentiation: Plus vs. Pro

To drive upgrades, the **Pro** plan must offer features that significantly impact business workflows and security, while **Plus** remains the ultimate choice for power users.

| Feature Area | **Plus (Personal Power)** | **Pro (Business/Professional)** |
| :--- | :--- | :--- |
| **Storage Capacity** | 10 GB | 50 GB - 100 GB (Scalable) |
| **Branding** | QR Vault Branding | **White-label**: Your logo & colors on all pages. |
| **Security** | SSL Encryption | **Password Protection** + **End-to-End Encryption**. |
| **Vault Lifecycle** | **[NEW] Expiration Logic**: 24h Free / 72h Plus enforcement. | **Permanent Storage** (Optional Expiry settings) |
| **Moderation** | **Community Flagging**: 4 reports lock, 10 delete. | **Self-Moderation**: Appeal or white-list files. |
| **Recovery** | N/A | **[NEW] Manifest-Based Recovery**: Restore original files only. |
| **Analytics** | Basic (Daily Scans) | **Deep Analytics**: Geo-tracking, Device, and OS data. |
| **Domains** | qrvault.com/v/id | **Custom Domains**: e.g., `files.yourbrand.com/id`. |
| **Management** | Individual Account | **Team Access**: Invite members to manage vaults. |
| **QR Customization** | Standard Colors | **Dynamic Designs**: Custom shapes, logos in QR, gradient colors. |

---

## 2. Upcoming Features & Roadmap

The following features represent the next development milestones:

- **[UPCOMING] Dynamic Link Swapping**: Ability to change the destination of a live QR code without reprinting (Update the files/links inside the vault).
- **[UPCOMING] File Request Vaults**: Create a QR code that *receives* files from others instead of just sharing them.
- **[MISSING] Mobile App**: Dedicated iOS/Android app for fast scanning, uploading, and managing vaults on the go.
- **[UPCOMING] API Access**: Webhooks and REST API for developers to automate vault creation for shipping labels, menus, or IDs.

---

## 3. Most Suggested Features

Based on market trends for QR-based sharing:

1.  **Lead Generation Forms**: Require a name/email before a user can access the files in the vault.
2.  **Self-Destructing Files**: Files that vanish after the first successful download or a set time limit (e.g., 5 minutes after scanning).
3.  **Scan Notifications**: Real-time push or email notifications when your QR code is scanned.
4.  **Offline Access**: Ability to cache a vault on the phone for 24 hours after the first scan, even without internet.

---

## 4. UI/UX Improvements

To make the platform feel like a premium, state-of-the-art web application:

- **Glassmorphism Redesign**: Update the public view page with a more modern "frosted glass" aesthetic.
- **Micro-Animations**: Add subtle transitions when files are uploaded or when the QR code is generated.
- **Global Dark Mode**: A sleek, toggleable dark mode for the entire dashboard.
- **Integrated Video Player**: Allow users to play videos directly on the public view page without downloading them first.
- **PDF Viewer Enhancement**: A high-fidelity, in-browser PDF reader for menus and brochures.

---

## 5. Feature Logs (Changelog)

Track the evolution of QR Vault's core engine:

### [2026-04-07] - Content Moderation & Recovery Engine
- **Vault Lifecycle Enforcement**: Implemented `server.ts` background job for plan-based auto-deletion (24h Free / 72h Plus).
- **Community Reporting**: Added multi-file report selection on public view. Integrated 4/6/10 report escalation logic (Lock for 10d / Lock for 20d / Auto-Delete).
- **Precise Recovery**: Developed manifest-based restoration for Plus/Pro users. Vaults now save a JSON snapshot of files at deletion to ensure only original data is recovered from Google Drive.
- **UI Enhancements**: Broadened reporting modals and added animated "swipe-to-reveal" report buttons on file cards.

### [2026-03-25] - Bulk Operations
- **Bulk Download**: Integrated `JSZip` to allow visitors to download all vault contents in a single click.
- **Storage Tracking**: Added real-time storage quota monitoring for user profiles.

---

> [!TIP]
> **Priority Recommendation**: Implement **Custom Domains** and **Password Protection** immediately, as these are the strongest "hook" features for Pro users.
