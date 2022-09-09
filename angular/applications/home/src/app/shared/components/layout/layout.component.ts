import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  AuthorizationModel,
  AuthorizationService,
  AuthorizationStore,
  NamespaceModel,
  NamespaceQuery,
  NamespaceService,
  NamespaceStore,
  StorefrontModel,
  StorefrontQuery,
  StorefrontService,
  StorefrontStore,
  StreamService,
  TokenService,
} from '@tenlastic/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { ElectronService, IdentityService, UpdateStatus } from '../../../core/services';
import { PromptComponent } from '../prompt/prompt.component';

@Component({
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
})
export class LayoutComponent implements OnInit {
  public get $authorization() {
    return this.identityService.$authorization;
  }
  public $namespaces: Observable<NamespaceModel[]>;
  public $storefronts: Observable<StorefrontModel[]>;
  public get isElectron() {
    return this.electronService.isElectron;
  }
  public get socket() {
    return this.streamService.webSockets.get(environment.wssUrl);
  }
  public get user() {
    return this.identityService.user;
  }

  constructor(
    private authorizationService: AuthorizationService,
    private electronService: ElectronService,
    private identityService: IdentityService,
    private matDialog: MatDialog,
    private namespaceQuery: NamespaceQuery,
    private namespaceService: NamespaceService,
    private storefrontQuery: StorefrontQuery,
    private storefrontService: StorefrontService,
    private streamService: StreamService,
    private tokenService: TokenService,
  ) {}

  public async ngOnInit() {
    this.$namespaces = this.$namespaces || this.namespaceQuery.selectAll();
    this.$storefronts = this.$storefronts || this.storefrontQuery.selectAll();

    this.tokenService.emitter.on('accessToken', () => this.find());
    await this.find();
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

  private find() {
    const promises: Promise<any>[] = [
      this.namespaceService.find({}),
      this.storefrontService.find(null, {}),
    ];

    if (this.user) {
      promises.push(this.authorizationService.findUserAuthorizations(null, this.user._id));
    }

    return Promise.all(promises);
  }
}
