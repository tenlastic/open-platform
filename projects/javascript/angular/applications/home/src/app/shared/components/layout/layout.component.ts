import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Game, GameQuery, GameService, Namespace, NamespaceService } from '@tenlastic/ng-http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  ElectronService,
  IdentityService,
  SocketService,
  UpdateStatus,
  VersionService,
} from '../../../core/services';
import { PromptComponent } from '../prompt/prompt.component';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
})
export class LayoutComponent implements OnInit {
  public $games: Observable<Game[]>;
  public namespaces: Namespace[] = [];
  public get socket() {
    return this.socketService.sockets[environment.apiBaseUrl];
  }
  public UpdateStatus = UpdateStatus;

  constructor(
    public electronService: ElectronService,
    public gameQuery: GameQuery,
    public gameService: GameService,
    public identityService: IdentityService,
    private matDialog: MatDialog,
    private namespaceService: NamespaceService,
    private socketService: SocketService,
    public versionService: VersionService,
  ) {}

  public async ngOnInit() {
    this.namespaces = await this.namespaceService.find({});

    this.$games = this.$games || this.gameQuery.selectAll();
    await this.gameService.find({});
  }

  public close() {
    let buttons = [];
    if (this.electronService.updateStatus === UpdateStatus.Downloaded) {
      buttons = [
        { color: 'accent', label: 'Minimize to Taskbar' },
        { color: 'primary', label: 'Update and Restart' },
        { color: 'accent', label: 'Close' },
      ];
    } else {
      buttons = [
        { color: 'accent', label: 'Minimize to Taskbar' },
        { color: 'primary', label: 'Close' },
      ];
    }

    const dialogRef = this.matDialog.open(PromptComponent, {
      data: {
        buttons,
        message: `Are you sure you want to close the launcher?`,
      },
    });

    dialogRef.afterClosed().subscribe(async result => {
      if (result === 'Minimize to Taskbar') {
        const window = this.electronService.remote.getCurrentWindow();
        window.close();
      } else if (result === 'Update and Restart') {
        const { ipcRenderer } = this.electronService;
        ipcRenderer.send('quitAndInstall');
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
}
