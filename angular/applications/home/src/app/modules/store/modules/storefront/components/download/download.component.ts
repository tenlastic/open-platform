import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BuildService, StorefrontModel } from '@tenlastic/http';

import {
  IdentityService,
  UpdateService,
  UpdateServiceProgress,
  UpdateServiceState,
  UpdateServiceStatus,
} from '../../../../../../core/services';
import { FilesizePipe } from '../../../../../../shared/pipes';

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
    if (this.status.state === UpdateServiceState.NotAuthorized && this.identityService.user) {
      return () => this.updateService.requestAuthorization(this.namespaceId);
    }

    if (this.status.state === UpdateServiceState.NotInstalled && !this.progress) {
      return () => this.download();
    }

    return null;
  }
  public get buttonIcon() {
    if (this.status.state === UpdateServiceState.NotInstalled && !this.progress) {
      return 'save_alt';
    }

    return null;
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
        return this.identityService.user ? 'Request Authorization' : 'Not Authorized';

      case UpdateServiceState.NotAvailable:
        return 'Not Available';

      case UpdateServiceState.NotInstalled:
        return this.progress ? 'Downloading...' : 'Download';
    }
  }
  public get hasProgress() {
    return Boolean(this.progress);
  }
  public get progressPercentage() {
    if (!this.progress) {
      return null;
    }

    return this.progress.current / this.progress.total;
  }
  public get progressText() {
    if (!this.progress) {
      return null;
    }

    const pipe = new FilesizePipe();
    const current = pipe.transform(this.progress.current);
    const speed = pipe.transform(this.progress.speed);
    const total = pipe.transform(this.progress.total);

    return `${current} / ${total} (${speed} / s)`;
  }
  public get statusText() {
    if (this.progress) {
      return 'Downloading...';
    }

    if (
      this.status.state === UpdateServiceState.Checking ||
      this.status.state === UpdateServiceState.Deleting ||
      this.status.state === UpdateServiceState.Installing ||
      this.status.state === UpdateServiceState.RequestingAuthorization ||
      this.status.state === UpdateServiceState.Updating
    ) {
      return this.status.text;
    }

    return null;
  }

  private namespaceId: string;
  private progress: UpdateServiceProgress = null;
  private status: UpdateServiceStatus;

  constructor(
    private activatedRoute: ActivatedRoute,
    private buildService: BuildService,
    private identityService: IdentityService,
    private updateService: UpdateService,
  ) {}

  public ngOnInit() {
    this.activatedRoute.params.subscribe(async (params) => {
      this.namespaceId = params.namespaceId;

      this.status = this.updateService.getStatus(this.namespaceId);
      this.updateService.checkForUpdates(this.namespaceId, false, true);
    });
  }

  public async download() {
    const start = performance.now();
    const totalBytes = this.status.build.files.reduce(
      (previousValue, currentValue) => previousValue + currentValue.compressedBytes,
      0,
    );

    this.progress = { current: 0, speed: 0, total: totalBytes };
    const response = await this.buildService.download(this.namespaceId, this.status.build._id, {
      onDownloadProgress: (event: ProgressEvent) => {
        this.progress = {
          current: event.loaded > totalBytes ? totalBytes : event.loaded,
          speed: (event.loaded / (performance.now() - start)) * 1000,
          total: totalBytes,
        };
      },
      responseType: 'blob',
    });
    this.progress = null;

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
