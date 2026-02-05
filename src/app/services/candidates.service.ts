import { Injectable } from '@angular/core';
import { BehaviorSubject, map } from 'rxjs';
import { Candidate } from '../models';

@Injectable({
  providedIn: 'root'
})
export class CandidatesService {
  private candidates: Candidate[] = [
    {
      id: 1,
      jobId: 1,
      fullName: 'Alice Johnson',
      email: 'alice@example.com',
      phone: '123-456-7890',
      totalExperience: '6 years',
      relevantExperience: '5 years',
      currentCtc: '$100k',
      expectedCtc: '$120k',
      noticePeriod: '30 days',
      location: 'New York, NY',
      status: 'Sourced',
      createdDate: new Date('2023-10-02')
    },
    {
      id: 2,
      jobId: 1,
      fullName: 'Bob Smith',
      email: 'bob@example.com',
      phone: '987-654-3210',
      totalExperience: '4 years',
      relevantExperience: '3 years',
      currentCtc: '$90k',
      expectedCtc: '$110k',
      noticePeriod: '15 days',
      location: 'Jersey City, NJ',
      status: 'Shortlisted',
      createdDate: new Date('2023-10-03')
    },
    {
      id: 3,
      jobId: 2,
      fullName: 'Charlie Brown',
      email: 'charlie@example.com',
      phone: '555-0123-4567',
      totalExperience: '5 years',
      relevantExperience: '5 years',
      currentCtc: '$110k',
      expectedCtc: '$130k',
      noticePeriod: 'Immediate',
      location: 'Remote',
      status: 'In Process',
      createdDate: new Date('2023-10-06')
    }
  ];

  candidates$ = new BehaviorSubject<Candidate[]>(this.candidates);

  constructor() {}

  getCandidates(jobId: number) {
    return this.candidates$.pipe(
      map(candidates => candidates.filter(c => c.jobId === jobId))
    );
  }

  getCandidate(id: number) {
    return this.candidates.find(c => c.id === id);
  }

  getAllCandidates() {
    return this.candidates$.asObservable();
  }

  checkDuplicate(jobId: number, email: string, phone: string): boolean {
    return this.candidates.some(c => 
      c.jobId === jobId && (c.email === email || c.phone === phone)
    );
  }

  addCandidate(candidate: Partial<Candidate>) {
    const newCandidate: Candidate = {
      ...candidate,
      id: this.candidates.length + 1,
      createdDate: new Date(),
      status: candidate.status || 'Sourced'
    } as Candidate;

    this.candidates.push(newCandidate);
    this.candidates$.next([...this.candidates]);
  }

  updateCandidateStatus(id: number, status: Candidate['status']) {
    const candidate = this.candidates.find(c => c.id === id);
    if (candidate) {
      candidate.status = status;
      this.candidates$.next([...this.candidates]);
    }
  }

  updateCandidate(updatedCandidate: Candidate) {
    const index = this.candidates.findIndex(c => c.id === updatedCandidate.id);
    if (index !== -1) {
      this.candidates[index] = updatedCandidate;
      this.candidates$.next([...this.candidates]);
    }
  }
}
