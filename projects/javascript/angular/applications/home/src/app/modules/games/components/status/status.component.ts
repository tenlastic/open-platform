import {
  ChangeDetectorRef,
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { Game, GameAuthorizationService } from '@tenlastic/ng-http';

import {
  IdentityService,
  UpdateService,
  UpdateServiceState,
  UpdateServiceStatus,
} from '../../../../core/services';
import { FilesizePipe } from '../../../../shared/pipes';

@Component({
  selector: 'app-status',
  styleUrls: ['./status.component.scss'],
  templateUrl: './status.component.html',
})
export class StatusComponent implements OnChanges, OnDestroy, OnInit {
  @Input() public game: Game;

  public get buttonIcon() {
    switch (this.status.state) {
      case UpdateServiceState.NotInstalled:
      case UpdateServiceState.NotUpdated:
        return 'file_download';

      case UpdateServiceState.Ready:
        return this.status.childProcess ? 'stop' : 'play_arrow';

      default:
        return null;
    }
  }
  public get buttonText() {
    switch (this.status.state) {
      case UpdateServiceState.Banned:
        return 'Banned';

      case UpdateServiceState.Checking:
        return 'Verifying...';

      case UpdateServiceState.Downloading:
      case UpdateServiceState.Installing:
        return this.status.isInstalled ? 'Updating...' : 'Installing...';

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
        return this.status.childProcess ? 'Stop' : 'Play';
    }
  }
  public get isButtonDisabled() {
    switch (this.status.state) {
      case UpdateServiceState.Banned:
      case UpdateServiceState.Checking:
      case UpdateServiceState.Downloading:
      case UpdateServiceState.Installing:
      case UpdateServiceState.NotAvailable:
      case UpdateServiceState.PendingAuthorization:
        return true;

      default:
        return false;
    }
  }
  public get isButtonVisible() {
    switch (this.status.state) {
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
  public get progress() {
    if (!this.status.progress) {
      return null;
    }

    switch (this.status.state) {
      case UpdateServiceState.Checking:
        return (this.status.progress.current / this.status.progress.total) * 100;

      case UpdateServiceState.Downloading:
        return (this.status.progress.current / this.status.progress.total) * 100;

      case UpdateServiceState.Installing:
        return (this.status.progress.current / this.status.progress.total) * 100;

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

      case UpdateServiceState.Downloading:
        const pipe = new FilesizePipe();
        const current = pipe.transform(this.status.progress.current);
        const speed = pipe.transform(this.status.progress.speed);
        const total = pipe.transform(this.status.progress.total);
        return `${current} / ${total} (${speed} / s)`;

      case UpdateServiceState.Installing:
        return `${this.status.progress.current} / ${this.status.progress.total} Files`;

      default:
        return null;
    }
  }
  public status: UpdateServiceStatus;
  public get statusText() {
    switch (this.status.state) {
      case UpdateServiceState.Checking:
      case UpdateServiceState.Downloading:
      case UpdateServiceState.Installing:
        return this.status.text;

      default:
        return null;
    }
  }
  public UpdateServiceState = UpdateServiceState;

  private interval: NodeJS.Timer;

  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private gameAuthorizationService: GameAuthorizationService,
    private identityService: IdentityService,
    private updateService: UpdateService,
  ) {}

  public ngOnInit() {
    if (this.updateService) {
      this.status = this.updateService.getStatus(this.game._id);
      this.updateService.checkForUpdates(this.game._id);
    }

    const { changeDetectorRef } = this;
    this.interval = setInterval(() => changeDetectorRef.detectChanges(), 250);
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (
      changes.game.previousValue &&
      changes.game.previousValue._id === changes.game.currentValue._id
    ) {
      return;
    }

    if (this.updateService) {
      this.status = this.updateService.getStatus(this.game._id);
      this.updateService.checkForUpdates(this.game._id);
    }
  }

  public ngOnDestroy() {
    clearInterval(this.interval);
  }

  public click() {
    if (this.status.state === UpdateServiceState.Ready && this.status.childProcess) {
      this.updateService.stop(this.game._id);
    } else if (this.status.state === UpdateServiceState.Ready && !this.status.childProcess) {
      this.updateService.play(this.game._id);
    } else if (this.status.state === UpdateServiceState.NotAuthorized) {
      this.gameAuthorizationService.create({
        gameId: this.game._id,
        namespaceId: this.game.namespaceId,
        userId: this.identityService.user._id,
      });
    } else if (this.status.state === UpdateServiceState.NotInstalled) {
      this.updateService.install(this.game._id);
    }
  }
}
