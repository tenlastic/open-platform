import { Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';
import { NamespaceService } from '@tenlastic/ng-http';

import { SelectedNamespaceService } from '../../services';

@Injectable({ providedIn: 'root' })
export class NamespaceGuard implements CanActivate {
  constructor(
    private namespaceService: NamespaceService,
    private selectedNamespaceService: SelectedNamespaceService,
  ) {}

  public async canActivate() {
    const { namespace, namespaceId } = this.selectedNamespaceService;

    if (namespaceId && !namespace) {
      try {
        this.selectedNamespaceService.namespace = await this.namespaceService.findOne(namespaceId);
      } catch {
        this.selectedNamespaceService.namespace = null;
      }
    }

    return true;
  }
}
