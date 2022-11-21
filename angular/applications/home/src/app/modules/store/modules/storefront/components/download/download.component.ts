import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  AuthorizationRequestModel,
  AuthorizationRequestService,
  AuthorizationService,
  BuildModel,
  BuildService,
  IAuthorization,
  IBuild,
  StorefrontModel,
} from '@tenlastic/http';

import { IdentityService } from '../../../../../../core/services';

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
    switch (this.state) {
      case State.NotAuthorized:
        return () => this.requestAuthorization();

      case State.NotInstalled:
        return () => this.download();

      default:
        return null;
    }
  }
  public get buttonIcon() {
    switch (this.state) {
      case State.NotInstalled:
        return 'save_alt';

      default:
        return null;
    }
  }
  public get buttonText() {
    switch (this.state) {
      case State.AuthorizationRequestDenied:
        return 'Authorization Request Denied';

      case State.AuthorizationRequested:
        return 'Authorization Requested';

      case State.Banned:
        return 'Banned';

      case State.Checking:
        return 'Verifying...';

      case State.NotAuthorized:
        return 'Request Authorization';

      case State.NotAvailable:
        return 'Not Available';

      case State.NotInstalled:
        return 'Download';
    }
  }
  public get isButtonDisabled() {
    switch (this.state) {
      case State.AuthorizationRequestDenied:
      case State.AuthorizationRequested:
      case State.Banned:
      case State.Checking:
      case State.NotAvailable:
        return true;

      default:
        return false;
    }
  }
  public get statusText() {
    switch (this.state) {
      case State.Checking:
      case State.RequestingAuthorization:
        return this.text;

      default:
        return null;
    }
  }

  private authorizationRequest: AuthorizationRequestModel;
  private build: BuildModel;
  private namespaceId: string;
  private get platform() {
    const platform: string = navigator['userAgentData']?.platform || navigator.platform;

    if (platform.startsWith('Win')) {
      return IBuild.Platform.Windows64;
    }

    return null;
  }
  private state: State;
  private text: string;

  constructor(
    private activatedRoute: ActivatedRoute,
    private authorizationService: AuthorizationService,
    private authorizationRequestService: AuthorizationRequestService,
    private buildService: BuildService,
    private identityService: IdentityService,
  ) {}

  public ngOnInit() {
    this.activatedRoute.params.subscribe(async (params) => {
      this.namespaceId = params.namespaceId;

      this.state = State.Checking;

      // Check platform...
      if (!this.platform) {
        this.state = State.NotAvailable;
        return;
      }

      // Check Authorization...
      this.text = 'Checking authorization...';
      const authorizations = await this.authorizationService.findUserAuthorizations(
        this.namespaceId,
        this.identityService.user?._id,
      );
      if (authorizations.some((a) => a.bannedAt)) {
        this.state = State.Banned;
        return;
      } else if (!authorizations.some((a) => a.hasRoles(IAuthorization.buildRoles))) {
        const [authorizationRequest] = await this.authorizationRequestService.find(
          this.namespaceId,
          { where: { userId: this.identityService.user?._id } },
        );

        this.authorizationRequest = authorizationRequest;
        if (this.authorizationRequest?.deniedAt) {
          this.state = State.AuthorizationRequestDenied;
        } else if (this.authorizationRequest?.hasRoles(IAuthorization.buildRoles)) {
          this.state = State.AuthorizationRequested;
        } else {
          this.state = State.NotAuthorized;
        }

        return;
      }

      // Get the latest Build from the server.
      this.text = 'Retrieving latest build...';
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
        this.state = State.NotAvailable;
        return;
      }

      // Find Files associated with latest Build.
      this.text = 'Retrieving build files...';
      this.build = builds[0];
      if (builds[0].files.length === 0) {
        this.state = State.NotAvailable;
        return;
      }

      this.state = State.NotInstalled;
      this.text = 'Download';
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

  private async requestAuthorization() {
    this.state = State.RequestingAuthorization;
    this.text = 'Requesting authorization...';

    const roles = [IAuthorization.Role.BuildsReadPublished];

    if (this.authorizationRequest) {
      await this.authorizationRequestService.update(
        this.namespaceId,
        this.authorizationRequest._id,
        {
          roles: [...this.authorizationRequest.roles, ...roles],
          userId: this.identityService.user?._id,
        },
      );
    } else {
      await this.authorizationRequestService.create(this.namespaceId, {
        roles,
        userId: this.identityService.user?._id,
      });
    }

    this.state = State.AuthorizationRequested;
  }
}
