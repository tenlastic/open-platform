import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router } from '@angular/router';

import { UpdateService, UpdateServiceState } from '../../../../../../core/services';

@Injectable({ providedIn: 'root' })
export class StatusGuard implements CanActivate {
  constructor(private router: Router, private updateService: UpdateService) {}

  public async canActivate(activatedRouteSnapshot: ActivatedRouteSnapshot) {
    const namespaceId = activatedRouteSnapshot.paramMap.get('namespaceId');

    const status = this.updateService.getStatus(namespaceId);
    if (status.state !== UpdateServiceState.Ready) {
      this.router.navigate(['/', 'storefronts', namespaceId]);
      return false;
    }

    return true;
  }
}
