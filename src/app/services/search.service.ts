import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SearchService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  globalSearch(
    q: string,
    type: string,
    limit: number = 10,
    offset: number = 0,
  ): Observable<any[]> {
    const params = new HttpParams()
      .set('q', q)
      .set('search_type', type)
      .set('limit', limit)
      .set('offset', offset);

    return this.http.get<any[]>(`${this.apiUrl}/search/global`, { params });
  }

  // If you ever need the scoped phone/email search specifically:
  scopedSearch(query: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/search-scoped`, { params: { query } });
  }
}
