import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Game } from '@tenlastic/ng-http';

import { UpdateService, UpdateServiceState, UpdateServiceStatus } from '../../../../core/services';
import { FilesizePipe } from '../../../../shared/pipes';

@Component({
  selector: 'app-status',
  styleUrls: ['./status.component.scss'],
  templateUrl: './status.component.html',
})
export class StatusComponent implements OnChanges, OnInit {
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
        const total = pipe.transform(this.status.progress.total);
        return `${current} / ${total}`;

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

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private updateService: UpdateService,
  ) {}

  public ngOnInit() {
    if (this.updateService) {
      this.status = this.updateService.getStatus(this.game);
      this.updateService.checkForUpdates(this.game);
    }
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (this.updateService) {
      this.status = this.updateService.getStatus(this.game);
      this.updateService.checkForUpdates(this.game);
    }
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
