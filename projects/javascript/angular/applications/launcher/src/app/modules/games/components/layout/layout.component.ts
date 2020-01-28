import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ElectronService } from '@tenlastic/ng-electron';
import { Game, GameService } from '@tenlastic/ng-http';

import { BackgroundService, UpdateService, UpdateServiceState } from '../../../../core/services';

@Component({
  styleUrls: ['./layout.component.scss'],
  templateUrl: './layout.component.html',
})
export class LayoutComponent implements OnDestroy, OnInit {
  public games: Game[] = [];

  constructor(
    private backgroundService: BackgroundService,
    public electronService: ElectronService,
    private gameService: GameService,
    private router: Router,
    public updateService: UpdateService,
  ) {}

  public async ngOnInit() {
    this.games = await this.gameService.find({});
    this.router.navigate(['/games', this.games[0].slug]);
  }

  public ngOnDestroy() {
    this.backgroundService.subject.next('/assets/images/background.jpg');
  }

  public getProgress(game: Game) {
    const status = this.updateService.getStatus(game);

    if (!status.progress) {
      return null;
    }

    switch (status.state) {
      case UpdateServiceState.Checking:
        return (status.progress.current / status.progress.total) * 100;

      case UpdateServiceState.Downloading:
        return (status.progress.current / status.progress.total) * 50;

      case UpdateServiceState.Installing:
        return (status.progress.current / status.progress.total) * 50 + 50;

      default:
        return null;
    }
  }
}
