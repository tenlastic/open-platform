import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BuildService, StorefrontModel } from '@tenlastic/http';

import {
  UpdateService,
  UpdateServiceState,
  UpdateServiceStatus,
} from '../../../../../../core/services';

export enum State {
  AuthorizationRequestDenied,
  AuthorizationRequested,
  Banned,
  Checking,
  NotAuthorized,
  NotAvailable,
  NotChecked,
  NotInstalled,
  RequestingAuthorization,
}

@Component({
  selector: 'app-download',
  styleUrls: ['./download.component.scss'],
  templateUrl: './download.component.html',
})
export class DownloadComponent implements OnInit {
  @Input() private storefront: StorefrontModel;

  public get buttonAction() {
    switch (this.status.state) {
      case UpdateServiceState.NotAuthorized:
        return () => this.updateService.requestAuthorization(this.namespaceId);

      case UpdateServiceState.NotInstalled:
        return () => this.download();

      default:
        return null;
    }
  }
  public get buttonIcon() {
    switch (this.status.state) {
      case UpdateServiceState.NotInstalled:
        return 'save_alt';

      default:
        return null;
    }
  }
  public get buttonText() {
    switch (this.status.state) {
      case UpdateServiceState.AuthorizationRequestDenied:
        return 'Authorization Request Denied';

      case UpdateServiceState.AuthorizationRequested:
        return 'Authorization Requested';

      case UpdateServiceState.Banned:
        return 'Banned';

      case UpdateServiceState.Checking:
        return 'Verifying...';

      case UpdateServiceState.NotAuthorized:
        return 'Request Authorization';

      case UpdateServiceState.NotAvailable:
        return 'Not Available';

      case UpdateServiceState.NotInstalled:
        return 'Download';
    }
  }
  public get statusText() {
    switch (this.status.state) {
      case UpdateServiceState.Checking:
      case UpdateServiceState.Deleting:
      case UpdateServiceState.Installing:
      case UpdateServiceState.RequestingAuthorization:
      case UpdateServiceState.Updating:
        return this.status.text;

      default:
        return null;
    }
  }

  private namespaceId: string;
  private status: UpdateServiceStatus;

  constructor(
    private activatedRoute: ActivatedRoute,
    private buildService: BuildService,
    private updateService: UpdateService,
  ) {}

  public ngOnInit() {
    this.activatedRoute.params.subscribe(async (params) => {
      this.namespaceId = params.namespaceId;

      this.status = this.updateService.getStatus(this.namespaceId);
      this.updateService.checkForUpdates(this.namespaceId);
    });
  }

  public async download() {
    const response = await this.buildService.download(this.namespaceId, this.status.build._id);

    const blob = new Blob([response.data], { type: 'application/zip' });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    document.body.appendChild(a);
    a.download = this.storefront.subtitle
      ? `${this.storefront.title} - ${this.storefront.subtitle} (Build ${this.status.build._id}).zip`
      : `${this.storefront.title} (Build ${this.status.build._id}).zip`;
    a.href = url;
    a.style.display = 'none';
    a.click();

    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }
}
