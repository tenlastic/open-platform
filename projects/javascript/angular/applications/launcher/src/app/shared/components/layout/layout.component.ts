import { DOCUMENT } from '@angular/common';
import { ChangeDetectorRef, Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material';
import { Router } from '@angular/router';
import { EnvironmentService, IdentityService } from '@tenlastic/ng-authentication';
import { ElectronService } from '@tenlastic/ng-electron';
import { ConnectionQuery, Game, GameQuery, GameService, GameStore } from '@tenlastic/ng-http';
import { Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';

import { BackgroundService, UpdateService, UpdateServiceState } from '../../../core/services';
import { environment } from '../../../../environments/environment';
import { PromptComponent } from '../prompt/prompt.component';

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
  private selectActiveGame$ = new Subscription();
  private setBackground$ = new Subscription();
  public launcherUrl = environment.launcherUrl;
  public message: string;

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private backgroundService: BackgroundService,
    private changeDetectorRef: ChangeDetectorRef,
    private connectionQuery: ConnectionQuery,
    public electronService: ElectronService,
    public environmentService: EnvironmentService,
    private gameQuery: GameQuery,
    private gameService: GameService,
    private gameStore: GameStore,
    public identityService: IdentityService,
    private matDialog: MatDialog,
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

  public $getConnection(userId: string) {
    return this.connectionQuery
      .selectAll({ filterBy: c => c.userId === userId })
      .pipe(map(connections => connections[0]));
  }

  public close() {
    const dialogRef = this.matDialog.open(PromptComponent, {
      data: {
        buttons: [
          { color: 'accent', label: 'Minimize to Taskbar' },
          { color: 'primary', label: 'Close' },
        ],
        message: `Are you sure you want to close the launcher?`,
      },
    });

    dialogRef.afterClosed().subscribe(async result => {
      if (result === 'Minimize to Taskbar') {
        const window = this.electronService.remote.getCurrentWindow();
        window.close();
      } else if (result === 'Close') {
        this.electronService.remote.app.quit();
      }
    });
  }

  public maximize() {
    const window = this.electronService.remote.getCurrentWindow();
    if (!window.isMaximized()) {
      window.maximize();
    } else {
      window.unmaximize();
    }
  }

  public minimize() {
    const window = this.electronService.remote.getCurrentWindow();
    window.minimize();
  }

  public navigateToLogin() {
    if (this.electronService.isElectron) {
      this.router.navigateByUrl('/authentication/log-in');
    } else {
      this.document.location.href = environment.loginUrl;
    }
  }

  public navigateToLogout() {
    if (this.electronService.isElectron) {
      this.router.navigateByUrl('/authentication/log-out');
    } else {
      this.document.location.href = environment.logoutUrl;
    }
  }

  private async fetchGames() {
    this.$games = this.gameQuery.selectAll();

    this.selectActiveGame$ = this.$games.subscribe(games => {
      if (games.length === 0 || this.gameQuery.getActiveId()) {
        return;
      }

      const previousGameSlug = localStorage.getItem('previousGameSlug');
      const game = previousGameSlug
        ? games.find(g => g.slug === previousGameSlug) || games[0]
        : games[0];

      this.gameStore.setActive(game._id);
      this.router.navigate(['/games', game.slug]);
    });

    return this.gameService.find({});
  }
}
