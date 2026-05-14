// services/resume.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ResumeService {
  // Store the parsed data temporarily
  private parsedDataStore = new BehaviorSubject<any>(null);
  private resumeFileStore = new BehaviorSubject<File | null>(null);
  parsedData$ = this.parsedDataStore.asObservable();
  resumeFile$ = this.resumeFileStore.asObservable();

  setParsedData(data: any) {
    this.parsedDataStore.next(data);
  }

  setResumeFile(file: File) {
    this.resumeFileStore.next(file);
  }

  // In clearData(), also clear the file
  clearData() {
    this.parsedDataStore.next(null);
    this.resumeFileStore.next(null);
  }
}
