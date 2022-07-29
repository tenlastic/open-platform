import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  Namespace,
  NamespaceQuery,
  NamespaceService,
  Storefront,
  StorefrontQuery,
  StorefrontService,
} from '@tenlastic/ng-http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  ElectronService,
  IdentityService,
  SocketService,
  UpdateStatus,
} from '../../../core/services';
import { PromptComponent } from '../prompt/prompt.component';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
})
export class LayoutComponent implements OnInit {
  public get $activeStorefrontId() {
    return this.storefrontQuery.selectActiveId();
  }
  public $storefronts: Observable<Storefront[]>;
  public $namespaces: Observable<Namespace[]>;
  public get isElectron() {
    return this.electronService.isElectron;
  }
  public get socket() {
    return this.socketService.sockets[environment.apiBaseUrl];
  }
  public get user() {
    return this.identityService.user;
  }

  constructor(
    private electronService: ElectronService,
    private identityService: IdentityService,
    private matDialog: MatDialog,
    private namespaceQuery: NamespaceQuery,
    private namespaceService: NamespaceService,
    private socketService: SocketService,
    private storefrontQuery: StorefrontQuery,
    private storefrontService: StorefrontService,
  ) {}

  public async ngOnInit() {
    this.$storefronts = this.$storefronts || this.storefrontQuery.selectAll();
    this.$namespaces = this.$namespaces || this.namespaceQuery.selectAll();

    await Promise.all([this.storefrontService.find({}), this.namespaceService.find({})]);
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

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result === 'Minimize to Taskbar') {
        const window = this.electronService.remote.getCurrentWindow();
        setTimeout(window.close, 0);
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
