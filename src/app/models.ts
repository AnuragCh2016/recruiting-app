export interface Job {
  id: number;
  jobCode: string;
  clientName: string;
  roleTitle: string;
  description: string; // Detailed JD or summary
  jdUrl?: string; // S3 link to the actual document
  location: string; // e.g., "Bangalore (Hybrid)" or "Remote"

  // Experience Range
  minExp: number;
  maxExp: number;

  // Budget Range (Numbers for easy filtering/sorting)
  minCompensation?: number;
  maxCompensation?: number;

  cooldownPeriod: number; // Number of days before a candidate can be re-applied

  trackerHeaders: string[]; // For the dynamic form engine
  status: 'Open' | 'Closed';
  applications?: Application[];
  createdDate: Date;
  recruiters?: User[];
}

export interface Candidate {
  id: number;
  fullName: string;
  contacts: ContactDetail[]; // Array for multiple emails/phones
  createdDate: Date;
  applications?: Application[];
}

export interface ContactDetail {
  id?: number;
  candidateId?: number;
  type: 'email' | 'phone';
  value: string; // The unique identifier
  isPrimary: boolean;
}

export interface Application {
  id: number;
  jobId: number; // The connection you missed
  candidateId: number;
  sourcedById: number; // From JWT/User model
  status: ApplicationStatus;

  // --- Standard Professional Fields ---
  totalExperience: number;
  relevantExperience: number;
  currentCtc: string;
  expectedCtc: string;
  noticePeriod: string;
  currentLocation: string;
  resumeUrl: string; // S3 link to the parsed file

  // --- The "Dumbass Tracker" Data ---
  // Key-value pairs matching Job.trackerHeaders
  dynamicData: Record<string, any>;

  notes?: string;
  createdDate: Date;
  rejectedDate?: Date;
  job?: Job;
  candidate?: Candidate;
  sourcedBy?: User;
}

export interface User {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  // hashedPassword: string;
  // hashed_password is usually excluded from API responses, but included for completeness
  mustChangePassword: boolean;
  isFirstLogin: boolean;
  requirePasswordReset: boolean;
  managerId?: number;
  sourcedApplications?: Application[];
  assignedJobs?: Job[];
}

export interface UserMinimum {
  id: number;
  fullName: string;
  role: UserRole;
  mustChangePassword: boolean;
  isFirstLogin: boolean;
  requirePasswordReset: boolean;
}

export enum ApplicationStatus {
  Sourced = 'Sourced',
  Shared = 'Shared',
  InProcess = 'In Process',
  OfferReleased = 'Offer Released',
  Rejected = 'Rejected',
  Joined = 'Joined',
}

export enum UserRole {
  Admin = 'Admin',
  Manager = 'Manager',
  Recruiter = 'Recruiter',
  TeamLead = 'TeamLead',
}

export interface ApplicationCreate {
  job_id: number;
  candidate_id: number;
  sourced_by_id: number;
  total_experience: number;
  relevant_experience: number;
  current_ctc: string;
  expected_ctc: string;
  notice_period: string;
  current_location: string;
  resume_url: string;
  dynamic_data: Record<string, any>;
  notes?: string;
}

export interface ApplicationSummary {
  id: number;
  candidateId: number;
  candidateName: string; // Injected by Backend Join
  sourcedByName: string; // Injected by Backend Join
  status: ApplicationStatus;
  createdDate: string | Date; // Sourced Date
}

export interface CandidateRead {
  id: number;
  fullName: string;
}

export interface ApplicationRead {
  id: number;
  candidateId: number;
  candidateName?: string;
  status: ApplicationStatus;
  sourcedByName?: string;
  createdDate: Date | string;
}

export interface JobRead {
  id: number;
  jobCode: string;
  clientName: string;
  roleTitle: string;
  description: string;
  location: string;
  status: string;
  minExp: number;
  maxExp: number;
  minCompensation?: number;
  maxCompensation?: number;
  cooldownPeriod: number;
  trackerHeaders: string[];
  createdDate: Date | string;
  jdUrl?: string;
  jdStoragePath?: string;
}

// Composite Schemas
export interface JobReadWithApplications extends JobRead {
  applications: ApplicationRead[];
}

export interface ApplicationReadWithCandidate extends ApplicationRead {
  candidate: CandidateRead;
}

export interface JobCreate {
  jobCode: string;
  clientName: string;
  roleTitle: string;
  description: string;
  location: string;
  minExp: number;
  maxExp: number;
  minCompensation?: number;
  maxCompensation?: number;
  cooldownPeriod: number;
  status: string;
  trackerHeaders: string[];
}

// Matches: ApplicationWithCandidateCreate
export interface ApplicationWithCandidateCreate {
  // Candidate/Contact Details
  fullName: string;
  email: string;
  phone: string;

  // Application Specifics
  jobId: number;
  totalExperience: number;
  relevantExperience: number;
  currentCtc: string;
  expectedCtc: string;
  noticePeriod: string;
  currentLocation: string;
  resumeUrl: string; // S3 Link
  dynamicData: Record<string, any>;
  notes?: string;
}

// Matches backend: ApplicationListRead
export interface ApplicationListRead {
  id: number;
  candidateId: number;
  fullName: string; // From Candidate.full_name
  phone: string | null; // From ContactDetail.value (Primary Phone)
  email: string | null; // From ContactDetail.value (Primary Email)
  sourcedByName: string; // From User.full_name (The Recruiter)
  createdDate: Date | string; // Sourced On date
  clientName: string; // From Job.client_name
  roleTitle: string; // From Job.role_title
  totalExperience: number;
  relevantExperience: number;
  currentCtc: string;
  expectedCtc: string;
  noticePeriod: string;
  resumeUrl: string;
  status: ApplicationStatus;
}

export interface JobReadWithCount extends JobRead {
  appCount: number; // Came from app_count via interceptor
}

// ---------------------- RESPONSE TYPES -------------------------
export interface APIResponse {
  status: string;
  message: string;
  data?: any;
}
