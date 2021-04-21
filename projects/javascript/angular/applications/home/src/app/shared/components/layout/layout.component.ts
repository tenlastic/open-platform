import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  GameInvitation,
  GameInvitationQuery,
  GameInvitationService,
  Namespace,
  NamespaceService,
} from '@tenlastic/ng-http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { ElectronService, IdentityService, Socket, SocketService } from '../../../core/services';
import { PromptComponent } from '../prompt/prompt.component';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
})
export class LayoutComponent implements OnInit {
  public $gameInvitations: Observable<GameInvitation[]>;
  public namespaces: Namespace[] = [];
  public get socket() {
    return this.socketService.sockets[environment.apiBaseUrl];
  }

  private updateAvailable = false;

  constructor(
    public electronService: ElectronService,
    public gameInvitationQuery: GameInvitationQuery,
    public gameInvitationService: GameInvitationService,
    public identityService: IdentityService,
    private matDialog: MatDialog,
    private namespaceService: NamespaceService,
    private socketService: SocketService,
  ) {}

  public async ngOnInit() {
    this.namespaces = await this.namespaceService.find({});

    if (this.identityService.user) {
      this.$gameInvitations = this.gameInvitationQuery.selectAll({
        filterBy: gi => gi.userId === this.identityService.user._id,
      });
      this.gameInvitationService.find({ where: { userId: this.identityService.user._id } });
    }

    if (!this.electronService.isElectron) {
      return;
    }

    const { ipcRenderer } = this.electronService;
    ipcRenderer.on('message', (event, text) => {
      if (text.includes('Update available')) {
        console.log('Downloading update...');
      }

      if (text.includes('Update downloaded')) {
        this.updateAvailable = true;
      }
    });
  }

  public close() {
    let buttons = [];
    if (this.updateAvailable) {
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
