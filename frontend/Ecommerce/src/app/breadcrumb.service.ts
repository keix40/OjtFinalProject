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
      const url = this.router.url.split('?')[0] || '/';
      if (this.isAdminRoute(url)) {
        const root = { label: 'Dashboard', link: '/dashboard' };
        breadcrumbs = breadcrumbs.filter((crumb, index, all) =>
          index === 0 || crumb.label !== all[index - 1]?.label
        );
        if (breadcrumbs.length && breadcrumbs[0].label === 'Dashboard') {
          breadcrumbs = [root, ...breadcrumbs.slice(1)];
        } else {
          breadcrumbs = [root, ...breadcrumbs];
        }
      } else {
        breadcrumbs = [{ label: 'Home', link: '/home' }, ...breadcrumbs];
      }
      this._breadcrumbs$.next(breadcrumbs);
    });
  }

  private isAdminRoute(url: string): boolean {
    const path = url.replace(/^\//, '');
    if (!path) {
      return false;
    }
    if (/^product\/[^/]+/.test(path) && !path.startsWith('productlist') && !path.startsWith('product-edit')) {
      return false;
    }
    const adminPrefixes = [
      'dashboard',
      'productlist',
      'product-edit',
      'categorylist',
      'brandlist',
      'addsubcategory',
      'orders',
      'return',
      'discount-',
      'createdeliveryservice',
      'deliveryservicelist',
      'users/',
      'revenue-target-admin',
      'admin/',
    ];
    if (path === 'product') {
      return true;
    }
    return adminPrefixes.some((prefix) => path === prefix.replace(/\/$/, '') || path.startsWith(prefix));
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