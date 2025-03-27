import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';

import {
  ExecutableService,
  IdentityService,
  UpdateService,
  UpdateServiceState,
  UpdateServiceStatus,
} from '../../../../../../core/services';
import { FilesizePipe } from '../../../../../../shared/pipes';
import { AuthorizationQuery, IAuthorization, StorefrontQuery } from '@tenlastic/http';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-status',
  styleUrls: ['./status.component.scss'],
  templateUrl: './status.component.html',
})
export class StatusComponent implements OnDestroy, OnInit {
  public $showGameServers: Observable<boolean>;
  public $showQueues: Observable<boolean>;
  public get buttonAction() {
    switch (this.status.state) {
      case UpdateServiceState.NotAuthorized:
        return () => this.updateService.requestAuthorization(this.namespaceId);

      case UpdateServiceState.NotInstalled:
        return () => this.updateService.checkForUpdates(this.namespaceId, true, true, true);

      case UpdateServiceState.NotUpdated:
        return () => this.updateService.checkForUpdates(this.namespaceId, true, true, true);

      case UpdateServiceState.Ready:
        return async () => {
          if (this.isRunning) {
            this.executableService.stop(this.namespaceId);
          } else {
            await this.updateService.checkForUpdates(this.namespaceId, true, true, true);
            await this.executableService.start(this.status.build.entrypoint, this.namespaceId);
          }
        };

      default:
        return null;
    }
  }
  public get buttonIcon() {
    switch (this.status.state) {
      case UpdateServiceState.NotInstalled:
      case UpdateServiceState.NotUpdated:
        return 'save_alt';

      case UpdateServiceState.Ready:
        return this.isRunning ? 'stop' : 'play_arrow';

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

      case UpdateServiceState.Installing:
        return 'Installing...';

      case UpdateServiceState.NotAuthorized:
        return 'Request Authorization';

      case UpdateServiceState.NotAvailable:
        return 'Not Available';

      case UpdateServiceState.NotInstalled:
        return 'Install';

      case UpdateServiceState.NotUpdated:
        return 'Update';

      case UpdateServiceState.PendingAuthorization:
        return 'Pending Authorization';

      case UpdateServiceState.Ready:
        return this.isRunning ? 'Stop' : 'Play';

      case UpdateServiceState.Updating:
        return 'Updating...';
    }
  }
  public get hasProgress() {
    return Boolean(this.status?.progress);
  }
  public IAuthorization = IAuthorization;
  public get isButtonVisible() {
    switch (this.status.state) {
      case UpdateServiceState.AuthorizationRequestDenied:
      case UpdateServiceState.AuthorizationRequested:
      case UpdateServiceState.Banned:
      case UpdateServiceState.NotAuthorized:
      case UpdateServiceState.NotInstalled:
      case UpdateServiceState.NotUpdated:
      case UpdateServiceState.PendingAuthorization:
      case UpdateServiceState.Ready:
        return true;

      default:
        return false;
    }
  }
  public get namespaceId() {
    return this.params.namespaceId;
  }
  public get progressPercentage() {
    if (!this.status.progress) {
      return null;
    }

    switch (this.status.state) {
      case UpdateServiceState.Checking:
      case UpdateServiceState.Deleting:
      case UpdateServiceState.Installing:
      case UpdateServiceState.Updating:
        return this.status.progress.current / this.status.progress.total;

      default:
        return null;
    }
  }
  public get progressText() {
    if (!this.status.progress) {
      return null;
    }

    switch (this.status.state) {
      case UpdateServiceState.Checking:
        return `${this.status.progress.current} / ${this.status.progress.total} Files`;

      case UpdateServiceState.Installing:
      case UpdateServiceState.Updating:
        const pipe = new FilesizePipe();
        const current = pipe.transform(this.status.progress.current);
        const speed = pipe.transform(this.status.progress.speed);
        const total = pipe.transform(this.status.progress.total);
        return `${current} / ${total} (${speed} / s)`;

      default:
        return null;
    }
  }
  public status: UpdateServiceStatus;
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
  public UpdateServiceState = UpdateServiceState;

  private get isRunning() {
    return this.executableService.isRunning(this.namespaceId);
  }
  private interval: NodeJS.Timer;
  private params: Params;

  constructor(
    private activatedRoute: ActivatedRoute,
    private authorizationQuery: AuthorizationQuery,
    private changeDetectorRef: ChangeDetectorRef,
    private executableService: ExecutableService,
    private identityService: IdentityService,
    private storefrontQuery: StorefrontQuery,
    private updateService: UpdateService,
  ) {}

  public ngOnInit() {
    this.activatedRoute.params.subscribe((params) => {
      this.params = params;

      this.status = this.updateService.getStatus(this.namespaceId);
      this.updateService.checkForUpdates(this.namespaceId, true, false, true);

      const $storefront = this.storefrontQuery.selectEntity(this.namespaceId);
      this.$showGameServers = $storefront.pipe(map((s) => s?.showGameServers));
      this.$showQueues = $storefront.pipe(map((s) => s?.showQueues));
    });

    const { changeDetectorRef } = this;
    this.interval = setInterval(() => changeDetectorRef.detectChanges(), 250);
  }

  public ngOnDestroy() {
    clearInterval(this.interval);
  }

  public $hasPermission(roles: IAuthorization.Role[]) {
    const userId = this.identityService.user?._id;

    return combineLatest([
      this.authorizationQuery.selectHasRoles(null, roles, userId),
      this.authorizationQuery.selectHasRoles(this.namespaceId, roles, userId),
    ]).pipe(map(([a, b]) => a || b));
  }

  public delete() {
    return this.updateService.delete(this.namespaceId);
  }

  public showInExplorer() {
    this.updateService.showInExplorer(this.namespaceId);
  }

  public sync() {
    this.updateService.checkForUpdates(this.namespaceId, true, true, false);
  }
}
