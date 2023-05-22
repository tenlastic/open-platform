import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';

import {
  ExecutableService,
  UpdateService,
  UpdateServiceState,
  UpdateServiceStatus,
} from '../../../../../../core/services';
import { FilesizePipe } from '../../../../../../shared/pipes';

@Component({
  selector: 'app-status',
  styleUrls: ['./status.component.scss'],
  templateUrl: './status.component.html',
})
export class StatusComponent implements OnDestroy, OnInit {
  public get buttonAction() {
    switch (this.status.state) {
      case UpdateServiceState.NotAuthorized:
        return () => this.updateService.requestAuthorization(this.namespaceId);

      case UpdateServiceState.NotInstalled:
        return () => this.updateService.install(this.namespaceId);

      case UpdateServiceState.NotUpdated:
        return () => this.updateService.update(this.namespaceId);

      case UpdateServiceState.Ready:
        return this.isRunning
          ? () => this.executableService.stop(this.namespaceId)
          : () => this.executableService.start(this.status.build.entrypoint, this.namespaceId);

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
    private changeDetectorRef: ChangeDetectorRef,
    private executableService: ExecutableService,
    private updateService: UpdateService,
  ) {}

  public ngOnInit() {
    this.activatedRoute.params.subscribe((params) => {
      this.params = params;

      this.status = this.updateService.getStatus(this.namespaceId);
      this.updateService.checkForUpdates(this.namespaceId, false, true);
    });

    const { changeDetectorRef } = this;
    this.interval = setInterval(() => changeDetectorRef.detectChanges(), 250);
  }

  public ngOnDestroy() {
    clearInterval(this.interval);
  }

  public click() {
    if (this.status.state === UpdateServiceState.Ready && this.isRunning) {
      this.executableService.stop(this.namespaceId);
    } else if (this.status.state === UpdateServiceState.Ready && !this.isRunning) {
      this.executableService.start(this.status.build.entrypoint, this.namespaceId);
    } else if (this.status.state === UpdateServiceState.NotInstalled) {
      this.updateService.install(this.namespaceId);
    }
  }

  public delete() {
    return this.updateService.delete(this.namespaceId);
  }

  public showInExplorer() {
    this.updateService.showInExplorer(this.namespaceId);
  }

  public sync() {
    this.updateService.checkForUpdates(this.namespaceId);
  }
}
