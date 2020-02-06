import { Component, Input, OnInit } from '@angular/core';
import { Game } from '@tenlastic/ng-http';

import { UpdateService, UpdateServiceState, UpdateServiceStatus } from '../../../../core/services';
import { FilesizePipe } from '../../../../shared/pipes';

@Component({
  selector: 'app-status',
  styleUrls: ['./status.component.scss'],
  templateUrl: './status.component.html',
})
export class StatusComponent implements OnInit {
  @Input() public game: Game;

  public get buttonIcon() {
    switch (this.status.state) {
      case UpdateServiceState.NotInstalled:
        return 'get_app';

      case UpdateServiceState.NotUpdated:
        return 'get_app';

      case UpdateServiceState.Ready:
        return this.status.childProcess ? 'close' : 'play_arrow';

      default:
        return null;
    }
  }
  public get buttonText() {
    switch (this.status.state) {
      case UpdateServiceState.Checking:
        return 'Verifying...';

      case UpdateServiceState.Downloading:
      case UpdateServiceState.Installing:
        return this.status.isInstalled ? 'Updating...' : 'Installing...';

      case UpdateServiceState.NotAvailable:
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
      case UpdateServiceState.NotInstalled:
      case UpdateServiceState.NotUpdated:
      case UpdateServiceState.Ready:
        return false;

      default:
        return true;
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
        return (this.status.progress.current / this.status.progress.total) * 50;

      case UpdateServiceState.Installing:
        return (this.status.progress.current / this.status.progress.total) * 50 + 50;

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

  constructor(private updateService: UpdateService) {}

  public ngOnInit() {
    if (this.updateService) {
      this.status = this.updateService.getStatus(this.game);
    }
  }

  public click() {
    if (this.status.state === UpdateServiceState.Ready && this.status.childProcess) {
      this.updateService.stop(this.game);
    } else if (this.status.state === UpdateServiceState.Ready && !this.status.childProcess) {
      this.updateService.play(this.game);
    } else {
      this.updateService.update(this.game);
    }
  }
}
