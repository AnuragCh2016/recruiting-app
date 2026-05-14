// ---------------------------------- Base Model Interfaces --------------------------------------
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

// ------------------------------ END: Base Model Interfaces ---------------------------------

// ------------------------------ START: Enum interfaces -------------------------------------
export enum ApplicationStatus {
  Sourced = 'Sourced',
  Shared = 'Shared',
  InProcess = 'In Process',
  OfferReleased = 'Offer Released',
  Rejected = 'Rejected',
  Joined = 'Joined',
}

export enum RecruiterStatus {
  CallBack = 'Call back',
  Sourced = 'Sourced',
  DNP = 'DNP',
  RecentSwitch = 'Recent Switch',
  NLFC = 'Not looking for change',
  NotInterested = 'Not interested',
  CriteriaMismatch = 'Criteria mismatch',
}

export enum UserRole {
  Admin = 'Admin',
  Manager = 'Manager',
  Recruiter = 'Recruiter',
  TeamLead = 'TeamLead',
}
// END: Enum interfaces

// --------------------------------START: Application Interfaces------------------------------
export interface ApplicationCreate {
  candidateId: number;
  jobId: number;
  totalExperience?: number;
  relevantExperience?: number;
  currentCtc?: number;
  expectedCtc?: number;
  noticePeriod?: string;
  comments?: string;
  status: ApplicationStatus;
}

export interface ApplicationSummary {
  id: number;
  status: string;
  sharedDate: Date; // Mapping datetime to the native JS Date object
  candidateName: string;
  candidatePhone: string;
  jobCode: string;
  clientName: string;
  jobRoleTitle: string;
  sourcedByName: string;
}

export interface ApplicationDetailRead {
  id: number;
  status: ApplicationStatus;
  lastStatusUpdate: Date;
  comments?: string;

  // Snapshot of professional details at time of application
  totalExperience?: number;
  relevantExperience?: number;
  currentCtc?: number;
  expectedCtc?: number;
  noticePeriod?: string;

  // Hydrated Objects
  candidate: CandidateDetailsRead;
  sourcedBy: UserRead;

  /**
   * RUNTIME CALCULATION
   * Derived field, usually a pre-signed S3/Cloud Storage URL
   */
  resumeSignedUrl?: string;
}

export interface ApplicationRead {
  id: number;
  candidateId: number;
  candidateName?: string;
  status: ApplicationStatus;
  sourcedByName?: string;
  sharedDate: Date | string;
}
// --------------------------END: Application interfaces--------------------------------------

/**
 * ============================================================
 * CALL LOG MODELS
 * ============================================================
 */

export interface CallLogCreate {
  candidateId: number;
  // userId: number;
  associatedJobId: number;
  applicationId?: number;
  recruiterStatus: RecruiterStatus; // Assuming this enum is defined elsewhere
  comments?: string;
}

export interface CallLogRead {
  id: number;
  candidateId: number;
  userId: number;
  associatedJobId: number;
  applicationId?: number;
  recruiterStatus: string;
  comments?: string;
  createdAt: Date;

  /** * UI Flattened Fields
   * These are populated by the backend @model_validator
   */
  candidateName: string;
  candidatePhone: string;
  recruiterName: string;
  jobRole?: string;
  clientName?: string;
}

export interface CallLogSummary {
  recruiterName: string;
  date: string; // Python 'date' serializes to "YYYY-MM-DD" string
  clientName: string;
  jobRole: string;
  totalCalls: number;
  totalSourced: number;
}

// --------------------------START: Candidate interfaces--------------------------------------
interface SkillRead {
  id: number;
  name: string;
}

export interface CandidateListRead {
  id: number;
  firstName: string;
  lastName?: string;
  email?: string;
  currentOrg?: string;
  currentDesignation?: string;
  totalYearsExp?: number;

  // Skills
  skills: SkillRead[];

  fullName: string;
  keySkills: string[];

  // Meta field
  createdAt: Date;
}

export interface CandidateDetailsRead extends CandidateListRead {
  // Basic info
  phone: string;
  gender?: string;
  dob?: string;

  // Professional snapshot
  currentLocation?: string;

  // Education
  latestDegree?: string;
  latestSpecialization?: string;
  educationCompletionYear?: number;

  // Compensation and timing
  currentCtc?: number;
  expectedCtc?: number;
  noticePeriod?: number;

  // Employment status
  isCurrentlyWorking: boolean;
  lastWorkingDay?: Date;

  // File
  resumeUrl?: string;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdById: number;
  updatedById?: number;
}
// --------------------------END: Candidate interfaces----------------------------------------

// --------------------------START: User interface--------------------------------------------
export interface UserRead {
  id: number;
  fullName: string;
  email: string; // EmailStr maps to string
  phone: string;
  role: UserRole;
  isActive: boolean;

  mustChangePassword: boolean;
  isFirstLogin: boolean;
  managerId: number;
}

export interface UserMinimum {
  id: number;
  fullName: string;
  role: UserRole;
  mustChangePassword: boolean;
  isFirstLogin: boolean;
  requirePasswordReset: boolean;
}
// --------------------------END: User interfaces----------------------------------------

// --------------------------START: Job interfaces----------------------------------------
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

export interface JobReadWithApplications extends JobRead {
  applications: ApplicationRead[];
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

export interface JobReadWithCount extends JobRead {
  appCount: number; // Came from app_count via interceptor
}
// --------------------------END: Job interfaces----------------------------------------

// ---------------------- RESPONSE TYPES -------------------------
export interface APIResponse {
  status: string;
  message: string;
  data?: any;
}
