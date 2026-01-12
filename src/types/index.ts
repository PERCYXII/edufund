// ============================================
// UniFund Type Definitions
// ============================================

export interface University {
  id: string;
  name: string;
  bankName: string;
  accountNumber: string;
  branchCode: string;
  accountName: string;
  logo?: string;
  website?: string;
  email?: string;
  phone?: string;
  physicalAddress?: string;
  postalAddress?: string;
  contactPerson?: string;
  viceChancellor?: string;
}

export interface UniversityApplicationFee {
  id: string;
  universityId: string;
  bankName: string;
  accountNumber: string;
  branchCode: string;
  referenceFormat: string;
}

export interface Student {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  universityId: string;
  studentNumber: string;
  course: string;
  yearOfStudy: string;
  expectedGraduation: string;
  verificationStatus: 'pending' | 'approved' | 'rejected';
  verificationDocument?: string;
  fieldOfStudy?: string;
  title?: string;
  profileImage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Campaign {
  id: string;
  studentId: string;
  title: string;
  story: string;
  goal: number;
  raised: number;
  donors: number;
  daysLeft: number;
  startDate: string;
  endDate: string;
  status: 'draft' | 'pending' | 'active' | 'completed' | 'expired' | 'rejected';
  type: 'standard' | 'quick';
  category: 'tuition' | 'accommodation' | 'food' | 'textbooks' | 'transport' | 'application_fee' | 'registration_fee' | 'stationary' | 'other';
  isUrgent: boolean;
  fundingBreakdown: FundingItem[];
  images?: string[];
  invoiceUrl?: string;
  feeStatementUrl?: string;
  idUrl?: string;
  enrollmentUrl?: string;
  videoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignWithStudent extends Campaign {
  student: Student;
  university: University;
}

export interface FundingItem {
  id: string;
  name: string;
  amount: number;
  description?: string;
}

export interface Donor {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  profileImage?: string;
  isAnonymous: boolean;
  totalDonated: number;
  createdAt: string;
}

export interface Donation {
  id: string;
  campaignId: string;
  donorId: string;
  amount: number;
  message?: string;
  isAnonymous: boolean;
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentReference: string;
  createdAt: string;
}

export interface DonationWithDetails extends Donation {
  donor: Donor;
  campaign: Campaign;
}

export interface User {
  id: string;
  email: string;
  role: 'student' | 'donor' | 'admin';
  student?: Student;
  donor?: Donor;
}

export interface VerificationRequest {
  id: string;
  studentId: string;
  documentType: string;
  documentUrl: string;
  idUrl?: string;
  enrollmentUrl?: string;
  transcriptUrl?: string;
  feeStatementUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'donation_received' | 'payment_made' | 'campaign_update' | 'verification_update';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  data?: any;
}

export interface CampaignStats {
  totalRaised: number;
  totalDonors: number;
  averageDonation: number;
  percentFunded: number;
  dailyDonations: { date: string; amount: number }[];
  topDonations: Donation[];
  recentDonations: DonationWithDetails[];
}

export interface PlatformStats {
  totalFunded: number;
  studentsHelped: number;
  totalDonors: number;
  partnerUniversities: number;
  activeCampaigns: number;
  pendingVerifications: number;
}

// Form Types
export interface StudentRegistrationData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  universityId: string;
  studentNumber: string;
  course: string;
  fieldOfStudy: string;
  title: string;
  yearOfStudy: string;
  expectedGraduation: string;
  verificationDocument?: File;
  idDocument?: File;
  enrollmentDocument?: File;
  academicRecord?: File;
  feeStatement?: File;
}

export interface DonorRegistrationData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface CampaignFormData {
  title: string;
  story: string;
  type: 'standard' | 'quick';
  category: 'tuition' | 'accommodation' | 'food' | 'textbooks' | 'transport' | 'application_fee' | 'registration_fee' | 'stationary' | 'other';
  goal: number;
  endDate: string;
  fundingBreakdown: FundingItem[];
  images?: File[];
  invoice?: File;
  videoUrl?: string;
}

export interface DonationFormData {
  amount: number;
  message?: string;
  isAnonymous: boolean;
}
