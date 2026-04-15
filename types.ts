export enum PlanType {
  FREE = 'FREE',
  STARTER = 'STARTER',
  PRO = 'PRO'
}

export interface User {
  id: string;
  email: string;
  name: string;
  plan: PlanType;
  storageUsed: number; // in bytes
  storageLimit: number; // in bytes
  subscriptionExpiryDate?: string; // ISO Date string
}

export enum FileType {
  IMAGE = 'IMAGE',
  PDF = 'PDF',
  ZIP = 'ZIP',
  LINK = 'LINK',
  VIDEO = 'VIDEO',
  OTHER = 'OTHER'
}

export interface VaultFile {
  id: string;
  name: string;
  size: number; // bytes
  type: FileType;
  url: string; // Mock url
  mimeType: string;
  maxDownloads?: number;                             // NEW: Self-destruct after X downloads
  downloadCount: number;                             // Tracked downloads
  expiresAt?: string;                                // NEW: Self-destruct at fixed time
  deleteAfterMinutes?: number;                       // NEW: Self-destruct X mins after first view
  firstViewedAt?: string;                            // Tracked first view time
}

export enum AccessLevel {
  PUBLIC = 'PUBLIC',
  RESTRICTED = 'RESTRICTED'
}

export enum VaultType {
  SENDING = 'SENDING',
  RECEIVING = 'RECEIVING'
}

export enum RequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export interface AccessRequest {
  id: string;
  email: string;
  status: RequestStatus;
  requestedAt: string;
}

export interface EngagementData {
  uniqueViewers: number;
  totalScans: number;
  totalDownloads: number;
  timestampComparison: { time: string; engagement: number }[];
  fileEngagement: { fileName: string; engagement: number; downloads: number }[];
}

export interface Vault {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
  files: VaultFile[];
  views: number;
  active: boolean;
  accessLevel: AccessLevel;
  requests: AccessRequest[];
  userPlan?: PlanType;
  expiresAt?: string;
  maxViews?: number;
  password?: string;                               // NEW: Shared password for access
  hasPassword?: boolean;                           // NEW: Flag to indicate if vault is password-protected
  reportCount?: number;                            // TOTAL flags received
  lockedUntil?: string;                            // NEW: ISO Date for temporary block
  analytics?: EngagementData;                      // NEW: Engagement analytics
  customDomain?: string;                           // NEW: Branded URL (PRO only)
  vaultType?: VaultType;                           // SENDING or RECEIVING
  receivingConfig?: ReceivingConfig;               // Configuration for collection mode
}

export interface FormField {
  label: string;
  type: 'text' | 'email' | 'number' | 'tel';
  required: boolean;
}

export interface FileRequest {
  label: string;
  fileType: string;
  required: boolean;
}

export interface ReceivingConfig {
  allowedFileTypes: string[];
  maxFiles: number;
  minFiles: number;
  formFields: FormField[];
  fileRequests: FileRequest[];
  thankYouMessage: string;
}

export interface Submission {
  id: string;
  vaultId: string;
  senderData: Record<string, string>;
  fileIds: string[];
  createdAt: string;
}

export interface Report {
  id: string;
  vaultId: string;
  fileIds?: string[];                               // NEW: specific files reported
  reasonVirus: boolean;
  reasonContent: boolean;
  customMessage: string;
  expiresAt?: string;                              // NEW: report expiry
  createdAt: string;
}

export interface DeletedVaultLog {
  id: string;
  userId: string;
  vaultName: string;
  originalVaultId?: string;
  views: number;
  deletionReason?: string;
  fileManifest?: any[];                            // NEW: List of files at deletion
  createdAt: string;
  deletedAt: string;
}

export interface Invoice {
  id: string;
  userId: string;
  date: string;
  plan: string;
  amount: number;
  expiry: string;
  timestamp: number;
}

export const PLAN_LIMITS = {
  [PlanType.FREE]: 1 * 1024 * 1024 * 1024, // 1GB
  [PlanType.STARTER]: 10 * 1024 * 1024 * 1024, // 10GB
  [PlanType.PRO]: 20 * 1024 * 1024 * 1024, // 20GB
};