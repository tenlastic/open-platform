import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router } from '@angular/router';

import { UpdateService, UpdateServiceState } from '../../../../core/services';

@Injectable({ providedIn: 'root' })
export class StatusGuard implements CanActivate {
  constructor(private router: Router, private updateService: UpdateService) {}

  public async canActivate(activatedRouteSnapshot: ActivatedRouteSnapshot) {
    const _id = activatedRouteSnapshot.paramMap.get('_id');

    const status = this.updateService.getStatus(_id);
    if (status.state !== UpdateServiceState.Ready) {
      this.router.navigate(['/', 'storefronts', _id]);
      return false;
    }

    return true;
  }
}
