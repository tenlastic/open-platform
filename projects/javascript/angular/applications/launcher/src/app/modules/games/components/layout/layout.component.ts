import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ElectronService } from '@tenlastic/ng-electron';
import { Game, GameQuery, GameService, GameStore } from '@tenlastic/ng-http';
import { Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';

import { BackgroundService, UpdateService, UpdateServiceState } from '../../../../core/services';

@Component({
  styleUrls: ['./layout.component.scss'],
  templateUrl: './layout.component.html',
})
export class LayoutComponent implements OnDestroy, OnInit {
  public get $activeGame() {
    return this.gameQuery.selectActive() as Observable<Game>;
  }
  public $games: Observable<Game[]>;
  public get $showStatusComponent() {
    return this.$activeGame.pipe(
      map(game => {
        if (!this.electronService.isElectron || !game) {
          return null;
        }

        const status = this.updateService.getStatus(game);
        if (!status) {
          return null;
        }

        return status.state === UpdateServiceState.Ready ? null : game;
      }),
    );
  }
  public games: Game[] = [];

  constructor(
    private backgroundService: BackgroundService,
    public electronService: ElectronService,
    private gameQuery: GameQuery,
    public updateService: UpdateService,
  ) {}

  public async ngOnInit() {
    this.$games = this.gameQuery.selectAll();
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
        return (status.progress.current / status.progress.total) * 100;

      case UpdateServiceState.Installing:
        return (status.progress.current / status.progress.total) * 100;

      default:
        return null;
    }
  }
}
