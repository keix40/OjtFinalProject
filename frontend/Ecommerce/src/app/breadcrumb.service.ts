import { Injectable } from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { filter } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class BreadcrumbService {
  private _breadcrumbs$ = new BehaviorSubject<{ label: string, link?: string }[]>([]);
  breadcrumbs$ = this._breadcrumbs$.asObservable();

  constructor(private router: Router, private route: ActivatedRoute) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      let breadcrumbs = this.buildBreadcrumbs(this.route.root);
      // Always prepend Home as the root
      breadcrumbs = [{ label: 'Home', link: '/home' }, ...breadcrumbs];
      this._breadcrumbs$.next(breadcrumbs);
    });
  }

  private buildBreadcrumbs(route: ActivatedRoute, url: string = '', breadcrumbs: any[] = []): any[] {
    const children: ActivatedRoute[] = route.children;
    if (children.length === 0) {
      return breadcrumbs;
    }

    for (const child of children) {
      const routeURL: string = child.snapshot.url.map(segment => segment.path).join('/');
      let nextUrl = url;
      if (routeURL !== '') {
        nextUrl += `/${routeURL}`;
      }
      if (child.snapshot.data['breadcrumb']) {
        breadcrumbs.push({
          label: child.snapshot.data['breadcrumb'],
          link: nextUrl
        });
      }
      // Continue traversing deeper (do not return early)
      this.buildBreadcrumbs(child, nextUrl, breadcrumbs);
    }
    return breadcrumbs;
  }
} 