import { Component, inject } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter, map, startWith } from 'rxjs/operators';
import { TopbarComponent } from './topbar/topbar.component';
import { AsyncPipe, NgIf } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, TopbarComponent, AsyncPipe, NgIf],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  private router = inject(Router);

  title = 'recruiting-app';

  readonly showTopbar$ = this.router.events.pipe(
    filter((event): event is NavigationEnd => event instanceof NavigationEnd),
    map((event) => event.urlAfterRedirects),
    startWith(this.router.url),
    map((url) => {
      const isAuthPage =
        url.startsWith('/login') ||
        url.startsWith('/reset-password') ||
        url.startsWith('/change-password');
      return !isAuthPage;
    }),
  );
}
