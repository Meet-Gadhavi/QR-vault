# QR Vault - UI/UX Issues Audit

This document outlines the identified UI and UX issues in the QR Vault application, categorized by severity.

---

## 🔴 CRITICAL Issues

### 1. Dashboard Component Over-Complexity
**File:** `pages/Dashboard.tsx`
- **Issue:** The `Dashboard.tsx` file is over **3,200 lines long**. This concentration of logic, state, and UI in a single file is a major architectural flaw.
- **UX Impact:**
    - High potential for **Layout Shift (CLS)** during data loading.
    - Slower initial render times on mobile devices.
    - Fragmented "State Soup" (25+ `useState` calls) leading to unpredictable UI behavior and jarring re-render cycles.
    - Extremely difficult to fix small UI bugs without introducing regressions.

### 2. Lack of Component Modularization
**File:** Multiple components in `pages/`
- **Issue:** Core features like analytics, file management, and modal logic are not decoupled.
- **UX Impact:** Users experience inconsistent interactions across different parts of the app because behavior is not standardized into reusable UI base components.

### 3. Janky Load-to-Data Transitions
**File:** `pages/Dashboard.tsx`, `pages/PublicView.tsx`
- **Issue:** The switch between the `Loader2` spinner and the final data grid is abrupt. There are no skeleton screens or staggered animations to guide the user's eye.
- **UX Impact:** A "flash of empty content" that makes the app feel less "premium" and more like an MVP.

---

## 🟡 MEDIUM Issues

### 4. Readability & Accessibility (WCAG Compliance)
**Files:** `components/VaultModals.tsx`, `pages/AdminDashboard.tsx`, `pages/Dashboard.tsx`
- **Issue:** Frequent use of micro-text (`text-[10px]` and `text-[8px]`) for status labels, timers, and metadata.
- **UX Impact:** Users with visual impairments or those on high-DPI screens will struggle to read important information. 12px should be the absolute minimum for interface text.

### 5. Inconsistent Feedback Mechanisms
**Files:** `pages/Payment.tsx`, `pages/PublicView.tsx`
- **Issue:** Dependence on native browser `alert()` and `console.warn()` for errors/feedback.
- **UX Impact:** Native alerts are jarring, block the main thread, and look unprofessional. A premium app should use cohesive toast notifications or inline status banners.

### 6. Dark Mode Edge Cases
**Files:** `pages/Home.tsx`, `Dashboard.tsx`
- **Issue:** While dark mode is implemented, certain elements (like the Google Drive logo or specific file type icons) lack proper contrast or inverted variants for dark backgrounds.
- **UX Impact:** Visual "muddiness" in dark mode where edges of elements disappear or colors clash.

### 7. Pop-up & Modal Scroll Behavior
**File:** `components/VaultModals.tsx`
- **Issue:** Modals use `overflow-y-auto` but don't always lock the underlying page scroll effectively on all browsers.
- **UX Impact:** "Double scrollbar" syndrome which can be confusing and makes navigation feel "stuck."

---

## 🟢 MINOR Issues

### 8. Missing ARIA Labels & Semantic HTML
**Files:** Throughout `Lucide-React` icon usage
- **Issue:** Many interactive icons (Search, Filter, Delete) lack `aria-label` or `title` attributes.
- **UX Impact:** Screen reader users will hear "Icon" or "Button" without knowing the specific action being performed.

### 9. Visual Consistency (Radii & Spacing)
**Files:** `index.css` vs Inline styles
- **Issue:** Inconsistent use of border radius: `rounded-xl`, `rounded-2xl`, and `rounded-[2.5rem]` are used seemingly at random across modals and cards.
- **UX Impact:** A subtle "off" feeling where the design system feels slightly uncoordinated.

### 10. Manual Refresh Dependency
**File:** `pages/AdminDashboard.tsx`
- **Issue:** Relying on a 5-second `setInterval` for "live" data.
- **UX Impact:** Jarring UI updates (flicker) every 5 seconds even if data hasn't changed. Implementing a cache-swapping library like SWR or React Query would yield a much smoother "live" experience.

---

## 🛠️ Summary Recommendations

1.  **Refactor `Dashboard.tsx`**: Break the dashboard into smaller, functional components (e.g., `StatGrid`, `VaultList`, `FileToolbar`).
2.  **Standardize Typography**: Set a global CSS rule to prevent text smaller than 12px.
3.  **Implement skeleton screens**: Replace loading spinners with content-shaped skeletons to reduce perceived latency.
4.  **Adopt a Toast System**: Replace all `alert()` calls with a standardized notification system (like `sonner` or a custom accessible `Toast` component).
