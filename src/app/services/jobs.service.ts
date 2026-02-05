import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Job } from '../models';

@Injectable({
  providedIn: 'root'
})
export class JobsService {
  private jobs: Job[] = [
    { 
      id: 1, 
      jobCode: 'FE-001',
      title: 'Senior Frontend Developer', 
      companyName: 'Tech Corp',
      description: 'We are looking for an experienced Angular developer.', 
      location: 'New York, NY',
      minExperience: 5,
      maxExperience: 7,
      minSalary: 120000,
      maxSalary: 150000,
      status: 'Open',
      createdDate: new Date('2023-10-01'),
      candidateCount: 2
    },
    { 
      id: 2, 
      jobCode: 'BE-002',
      title: 'Backend Node.js Developer', 
      companyName: 'Tech Corp',
      description: 'Join our backend team building scalable APIs.', 
      location: 'Remote',
      minExperience: 3,
      maxExperience: 5,
      cooldownPeriod: 90,
      status: 'Open',
      createdDate: new Date('2023-10-05'),
      candidateCount: 1
    },
  ];

  jobs$ = new BehaviorSubject<Job[]>(this.jobs);

  constructor() { }

  getJob(id: number): Job | undefined {
    return this.jobs.find(j => j.id === id);
  }

  addJob(job: Partial<Job>) {
    const newJob: Job = {
      ...job,
      id: this.jobs.length + 1,
      createdDate: new Date(),
      status: 'Open',
      candidateCount: 0
    } as Job;
    
    this.jobs.push(newJob);
    this.jobs$.next([...this.jobs]);
  }

  updateJob(updatedJob: Job) {
    const index = this.jobs.findIndex(j => j.id === updatedJob.id);
    if (index !== -1) {
      this.jobs[index] = updatedJob;
      this.jobs$.next([...this.jobs]);
    }
  }

  updateCandidateCount(jobId: number, count: number) {
    const job = this.jobs.find(j => j.id === jobId);
    if (job) {
      job.candidateCount = count;
      this.jobs$.next([...this.jobs]);
    }
  }
}
