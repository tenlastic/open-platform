import {
  ChangeDetectorRef,
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Game } from '@tenlastic/ng-http';

import { UpdateService, UpdateServiceState, UpdateServiceStatus } from '../../../../core/services';
import { FilesizePipe } from '../../../../shared/pipes';

@Component({
  selector: 'app-status',
  styleUrls: ['./status.component.scss'],
  templateUrl: './status.component.html',
})
export class StatusComponent implements OnChanges, OnDestroy, OnInit {
  @Input() public game: Game;

  public get buttonText() {
    switch (this.status.state) {
      case UpdateServiceState.Checking:
        return 'Verifying...';

      case UpdateServiceState.Downloading:
      case UpdateServiceState.Installing:
        return this.status.isInstalled ? 'Updating...' : 'Installing...';

      case UpdateServiceState.NotAvailable:
      case UpdateServiceState.NotInvited:
        return 'Not Available';

      case UpdateServiceState.NotInstalled:
        return 'Install';

      case UpdateServiceState.NotUpdated:
        return 'Update';

      case UpdateServiceState.Ready:
        return this.status.childProcess ? 'Stop' : 'Play';
    }
  }
  public get isButtonDisabled() {
    switch (this.status.state) {
      case UpdateServiceState.NotAvailable:
      case UpdateServiceState.NotInvited:
        return true;

      default:
        return false;
    }
  }
  public get isButtonVisible() {
    switch (this.status.state) {
      case UpdateServiceState.NotAvailable:
      case UpdateServiceState.NotInvited:
      case UpdateServiceState.NotInstalled:
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

  private interval: NodeJS.Timer;

  constructor(
    private activatedRoute: ActivatedRoute,
    private changeDetectorRef: ChangeDetectorRef,
    private router: Router,
    private updateService: UpdateService,
  ) {}

  public ngOnInit() {
    if (this.updateService) {
      this.status = this.updateService.getStatus(this.game);
      this.updateService.checkForUpdates(this.game);
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
      this.status = this.updateService.getStatus(this.game);
      this.updateService.checkForUpdates(this.game);
    }
  }

  public ngOnDestroy() {
    clearInterval(this.interval);
  }

  public click() {
    if (this.status.state === UpdateServiceState.Ready && this.status.childProcess) {
      this.updateService.stop(this.game);
    } else if (this.status.state === UpdateServiceState.Ready && !this.status.childProcess) {
      this.router.navigate(['game-servers'], { relativeTo: this.activatedRoute });
    } else {
      this.updateService.update(this.game);
    }
  }
}
