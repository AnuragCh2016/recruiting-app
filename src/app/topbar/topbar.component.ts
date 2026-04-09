import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription, of } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  switchMap,
  tap,
  catchError,
} from 'rxjs/operators';
import { SearchService } from '../services/search.service';
import { AuthService } from '../services/auth.service';
import { UserMinimum } from '../models';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.css'],
})
export class TopbarComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private searchService = inject(SearchService);
  private authService = inject(AuthService);

  // State
  searchQuery = '';
  searchType: 'All' | 'Jobs' | 'Candidates' = 'All';
  searchResults: any[] = [];
  showResults = false;
  isSearching = false;

  // Pagination
  currentOffset = 0;
  readonly pageSize = 10;
  canLoadMore = false;

  private searchSubject = new Subject<{
    q: string;
    type: string;
    offset: number;
  }>();
  private searchSubscription?: Subscription;
  private userSubscription?: Subscription;

  currentUser: UserMinimum | null = null;

  ngOnInit() {
    this.userSubscription = this.authService.currentUser$.subscribe(
      (user) => (this.currentUser = user),
    );

    this.searchSubscription = this.searchSubject
      .pipe(
        debounceTime(300),
        // We only trigger a new search if the query/type changes OR offset increases
        distinctUntilChanged(
          (p, c) => p.q === c.q && p.type === c.type && p.offset === c.offset,
        ),
        tap(() => (this.isSearching = true)),
        switchMap(({ q, type, offset }) =>
          this.searchService.globalSearch(q, type, this.pageSize, offset).pipe(
            catchError(() => of([])), // Handle errors gracefully
            tap((newResults) => {
              if (offset === 0) {
                this.searchResults = newResults;
              } else {
                this.searchResults = [...this.searchResults, ...newResults];
              }
              // If we got exactly 'pageSize' results, there's likely more to fetch
              this.canLoadMore = newResults.length === this.pageSize;
              this.isSearching = false;
            }),
          ),
        ),
      )
      .subscribe();
  }

  onInputChange() {
    this.currentOffset = 0;
    this.canLoadMore = false;

    if (this.searchQuery.trim().length < 2) {
      this.showResults = false;
      this.searchResults = [];
      return;
    }

    this.showResults = true;
    this.searchSubject.next({
      q: this.searchQuery,
      type: this.searchType,
      offset: 0,
    });
  }

  loadMore(event: Event) {
    event.stopPropagation(); // Keep dropdown open
    if (this.isSearching || !this.canLoadMore) return;

    this.currentOffset += this.pageSize;
    this.searchSubject.next({
      q: this.searchQuery,
      type: this.searchType,
      offset: this.currentOffset,
    });
  }

  selectResult(result: any) {
    this.showResults = false;
    this.searchQuery = '';
    // Navigate to Job detail for both types as per your tracker setup
    this.router.navigate(['/jobs', result.id]);
  }

  closeSearch() {
    // Delay to let click events process
    setTimeout(() => (this.showResults = false), 200);
  }

  ngOnDestroy() {
    this.searchSubscription?.unsubscribe();
    this.userSubscription?.unsubscribe();
  }

  get initials(): string {
    if (!this.currentUser?.fullName) {
      return 'NA';
    }

    return this.currentUser.fullName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((name: string) => name[0].toUpperCase())
      .join('');
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
