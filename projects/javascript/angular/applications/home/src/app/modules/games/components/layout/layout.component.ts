import { DOCUMENT } from '@angular/common';
import { ChangeDetectorRef, Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Game, GameQuery, GameService, GameStore } from '@tenlastic/ng-http';
import { Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';

import {
  BackgroundService,
  ElectronService,
  IdentityService,
  UpdateService,
  UpdateServiceState,
} from '../../../../core/services';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
})
export class LayoutComponent implements OnDestroy, OnInit {
  public get $activeGame() {
    return this.gameQuery.selectActive() as Observable<Game>;
  }
  public $games: Observable<Game[]>;
  public get $isReady() {
    return this.$activeGame.pipe(
      map(game => {
        const status = this.updateService.getStatus(game);
        return status.state === UpdateServiceState.Ready;
      }),
    );
  }
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
  public launcherUrl = environment.launcherUrl;
  public message: string;
  public showSidenav = false;

  private selectActiveGame$ = new Subscription();
  private setBackground$ = new Subscription();

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private backgroundService: BackgroundService,
    private changeDetectorRef: ChangeDetectorRef,
    public electronService: ElectronService,
    private gameQuery: GameQuery,
    private gameService: GameService,
    private gameStore: GameStore,
    public identityService: IdentityService,
    public router: Router,
    private updateService: UpdateService,
  ) {}

  public async ngOnInit() {
    this.setBackground$ = this.backgroundService.subject.subscribe(value => {
      this.document.body.style.backgroundImage = `url('${value}')`;
    });

    await this.fetchGames();

    if (!this.electronService.isElectron) {
      return;
    }

    const { ipcRenderer } = this.electronService;
    ipcRenderer.on('message', (event, text) => {
      if (text.includes('Update available')) {
        this.message = 'Downloading update...';
      }

      if (text.includes('Update downloaded')) {
        this.message = 'Restart to install update.';
      }

      this.changeDetectorRef.detectChanges();
    });
  }

  public ngOnDestroy() {
    this.selectActiveGame$.unsubscribe();
    this.setBackground$.unsubscribe();
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

  private async fetchGames() {
    this.$games = this.gameQuery.selectAll();

    this.selectActiveGame$ = this.$games.subscribe(games => {
      if (games.length === 0 || this.gameQuery.getActiveId()) {
        return;
      }

      const previousGameId = localStorage.getItem('previousGameId');
      const game = previousGameId
        ? games.find(g => g._id === previousGameId) || games[0]
        : games[0];

      this.gameStore.setActive(game._id);
      this.router.navigate(['/games', game._id]);
    });

    return this.gameService.find({});
  }
}
