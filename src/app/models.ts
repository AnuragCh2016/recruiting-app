export interface Job {
  id: number;
  jobCode: string;
  title: string;
  companyName: string;
  description: string;
  location: string;
  // removed employmentType
  minExperience: number;
  maxExperience: number;
  minSalary?: number;
  maxSalary?: number;
  cooldownPeriod?: number; // in days
  status: 'Open' | 'Closed';
  createdDate: Date;
  candidateCount?: number;
  customFields?: string[]; // headers from uploaded tracker
}

export interface Candidate {
  id: number;
  jobId: number;
  fullName: string;
  email: string;
  phone: string;
  totalExperience: string;
  relevantExperience: string;
  currentCtc: string;
  expectedCtc: string;
  noticePeriod: string;
  location: string;
  status: 'Sourced' | 'Shortlisted' | 'In Process' | 'Hired' | 'Rejected' | 'On Hold';
  rejectedOn?: Date;
  notes?: string;
  resumeUrl?: string;
  createdDate: Date; // Keep as Date if valid, or string if JSON
  dynamicData?: Record<string, any>; // Store values for custom fields
}
