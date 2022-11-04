import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  AuthorizationService,
  BuildModel,
  BuildService,
  IAuthorization,
  IBuild,
  StorefrontModel,
} from '@tenlastic/http';

import { IdentityService } from '../../../../../../core/services';

export enum State {
  Banned,
  Checking,
  NotAuthorized,
  NotAvailable,
  NotChecked,
  NotInstalled,
  PendingAuthorization,
}

interface Status {
  isInstalled?: boolean;
  state?: State;
  text?: string;
}

@Component({
  selector: 'app-download',
  styleUrls: ['./download.component.scss'],
  templateUrl: './download.component.html',
})
export class DownloadComponent implements OnInit {
  @Input() private storefront: StorefrontModel;

  public get buttonIcon() {
    switch (this.status.state) {
      case State.NotInstalled:
        return 'save_alt';

      default:
        return null;
    }
  }
  public get buttonText() {
    switch (this.status.state) {
      case State.Banned:
        return 'Banned';

      case State.Checking:
        return 'Verifying...';

      case State.NotAuthorized:
        return 'Not Authorized';

      case State.NotAvailable:
        return 'Not Available';

      case State.NotInstalled:
        return 'Download';

      case State.PendingAuthorization:
        return 'Pending Authorization';
    }
  }
  public get isButtonDisabled() {
    switch (this.status.state) {
      case State.Banned:
      case State.Checking:
      case State.NotAvailable:
      case State.NotAuthorized:
      case State.PendingAuthorization:
        return true;

      default:
        return false;
    }
  }
  public get isButtonVisible() {
    switch (this.status.state) {
      case State.Banned:
      case State.NotAuthorized:
      case State.NotInstalled:
      case State.PendingAuthorization:
        return true;

      default:
        return false;
    }
  }
  public status: Status = {};
  public get statusText() {
    switch (this.status.state) {
      case State.Checking:
        return this.status.text;

      default:
        return null;
    }
  }
  public State = State;

  private build: BuildModel;
  private namespaceId: string;
  private get platform() {
    const platform: string = navigator['userAgentData']?.platform || navigator.platform;

    if (platform.startsWith('Win')) {
      return IBuild.Platform.Windows64;
    }

    return null;
  }

  constructor(
    private activatedRoute: ActivatedRoute,
    private authorizationService: AuthorizationService,
    private buildService: BuildService,
    private identityService: IdentityService,
  ) {}

  public ngOnInit() {
    this.activatedRoute.params.subscribe(async (params) => {
      this.namespaceId = params.namespaceId;

      this.status.state = State.Checking;

      // Check platform...
      if (!this.platform) {
        this.status.state = State.NotAvailable;
        return;
      }

      // Check Authorization...
      this.status.text = 'Checking authorization...';
      const authorization = await this.getAuthorization(this.namespaceId);
      const roles = [
        IAuthorization.Role.BuildsRead,
        IAuthorization.Role.BuildsReadPublished,
        IAuthorization.Role.BuildsReadWrite,
      ];
      if (!authorization || !authorization.roles.some((r) => roles.includes(r))) {
        this.status.state = State.NotAuthorized;
        return;
      }

      // Get the latest Build from the server.
      this.status.text = 'Retrieving latest build...';
      const builds = await this.buildService.find(this.namespaceId, {
        limit: 1,
        sort: '-publishedAt',
        where: {
          namespaceId: this.namespaceId,
          platform: this.platform,
          publishedAt: { $exists: true, $ne: null },
        },
      });
      if (builds.length === 0) {
        this.status.state = State.NotAvailable;
        return;
      }

      // Find Files associated with latest Build.
      this.status.text = 'Retrieving build files...';
      this.build = builds[0];
      if (builds[0].files.length === 0) {
        this.status.state = State.NotAvailable;
        return;
      }

      this.status.state = State.NotInstalled;
      this.status.text = 'Download';
    });
  }

  public async download() {
    const response = await this.buildService.download(this.namespaceId, this.build._id);

    const blob = new Blob([response.data], { type: 'application/zip' });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    document.body.appendChild(a);
    a.download = this.storefront.subtitle
      ? `${this.storefront.title} - ${this.storefront.subtitle} (Build ${this.build._id}).zip`
      : `${this.storefront.title} (Build ${this.build._id}).zip`;
    a.href = url;
    a.style.display = 'none';
    a.click();

    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  private async getAuthorization(namespaceId: string) {
    const authorizations = await this.authorizationService.findUserAuthorizations(
      namespaceId,
      this.identityService.user?._id,
    );

    return authorizations[0];
  }
}
