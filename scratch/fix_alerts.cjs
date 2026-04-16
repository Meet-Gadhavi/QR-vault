const fs = require('fs');
const path = require('path');

// Go up one level from scratch directory
const filePath = path.join(__dirname, '..', 'pages', 'Dashboard.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const replacements = [
  {
    target: /alert\("Account limit reached\. Your data is secure, but you must upgrade to add or remove files\."\);/g,
    replacement: 'toast.error("Account limit reached", { description: "Your data is secure, but you must upgrade to add or remove files." });'
  },
  {
    target: /alert\("Please clear unwanted data from your google drive to make new vaults\."\);/g,
    replacement: 'toast.error("Google Drive Storage Full", { description: "Please clear unwanted data from your google drive to make new vaults." });'
  },
  {
    target: /alert\(`Upload failed: This vault exceeds your total \${formatBytes\(appUser\.storageLimit, 0\)} storage plan limit\. Please delete files or upgrade your plan\.`\);/g,
    replacement: 'toast.error("Upload failed", { description: `This vault exceeds your total ${formatBytes(appUser.storageLimit, 0)} storage plan limit. Please delete files or upgrade your plan.` });'
  },
  {
    target: /alert\(`Upload failed: \${e\.message}`\);/g,
    replacement: 'toast.error("Upload failed", { description: e.message });'
  },
  {
    target: /alert\("Vault recovery is only available for Plus and Pro members\. Please upgrade to recover your data\."\);/g,
    replacement: 'toast.error("Upgrade required", { description: "Vault recovery is only available for Plus and Pro members. Please upgrade to recover your data." });'
  },
  {
    target: /alert\("Please connect your Google Drive to recover vaults stored there\."\);/g,
    replacement: 'toast.error("Cloud Connection Required", { description: "Please connect your Google Drive to recover vaults stored there." });'
  },
  {
    target: /alert\(`Successfully recovered "\\"\${log\.vault_name}\\""\!`\);/g,
    replacement: 'toast.success("Vault Recovered", { description: `Successfully recovered "${log.vault_name}"!` });'
  },
  {
    target: /alert\(err\.message\);/g,
    replacement: 'toast.error("Recovery failed", { description: err.message });'
  },
  {
    target: /alert\(error\.message \|\| "Could not delete vault\. Please try again\."\);/g,
    replacement: 'toast.error("Delete failed", { description: error.message || "Could not delete vault. Please try again." });'
  },
  {
    target: /alert\('Please allow popups for this site to connect your Google Drive\.'\);/g,
    replacement: 'toast.warning("Pop-up Blocked", { description: "Please allow popups for this site to connect your Google Drive." });'
  },
  {
    target: /alert\(`Failed to initialize Google connection: \${error\.message}`\);/g,
    replacement: 'toast.error("Google Connection Error", { description: `Failed to initialize: ${error.message}` });'
  }
];

replacements.forEach(({ target, replacement }) => {
  content = content.replace(target, replacement);
});

fs.writeFileSync(filePath, content);
console.log('Successfully replaced alerts with toasts in Dashboard.tsx');
