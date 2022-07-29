import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router } from '@angular/router';
import { StorefrontQuery, StorefrontService, StorefrontStore } from '@tenlastic/ng-http';

@Injectable({ providedIn: 'root' })
export class StorefrontGuard implements CanActivate {
  constructor(
    private router: Router,
    private storefrontQuery: StorefrontQuery,
    private storefrontService: StorefrontService,
    private storefrontStore: StorefrontStore,
  ) {}

  public async canActivate(activatedRouteSnapshot: ActivatedRouteSnapshot) {
    const _id = activatedRouteSnapshot.paramMap.get('_id');
    const activeStorefront = this.storefrontQuery.getActive();
    if (activeStorefront) {
      return true;
    }

    try {
      const storefront = await this.storefrontService.findOne(_id);
      this.storefrontStore.setActive(storefront._id);
    } catch {
      this.router.navigateByUrl('/storefronts');
      return false;
    }

    return true;
  }
}
