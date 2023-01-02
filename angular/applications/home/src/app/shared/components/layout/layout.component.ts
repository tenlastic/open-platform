import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { NavigationEnd, Router } from '@angular/router';
import {
  AuthorizationService,
  NamespaceModel,
  NamespaceQuery,
  NamespaceService,
  StorefrontModel,
  StorefrontQuery,
  StorefrontService,
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
  public get isHomeUrl() {
    const { url } = this.router;

    return (
      !url.startsWith('/account') &&
      !url.startsWith('/authentication') &&
      !url.startsWith('/management-portal') &&
      !url.startsWith('/store')
    );
  }
  public get socket() {
    return this.streamService.webSockets.get(environment.wssUrl);
  }
  public get user() {
    return this.identityService.user;
  }

  private previousUrl: string;
  private urls = new Map<string, string>();

  constructor(
    private authorizationService: AuthorizationService,
    private electronService: ElectronService,
    private identityService: IdentityService,
    private matDialog: MatDialog,
    private namespaceQuery: NamespaceQuery,
    private namespaceService: NamespaceService,
    private router: Router,
    private storefrontQuery: StorefrontQuery,
    private storefrontService: StorefrontService,
    private streamService: StreamService,
    private tokenService: TokenService,
  ) {}

  public async ngOnInit() {
    this.$namespaces = this.$namespaces || this.namespaceQuery.selectAll();
    this.$storefronts = this.$storefronts || this.storefrontQuery.selectAll();

    this.previousUrl = this.router.url;
    this.router.events.subscribe((e) => {
      if (e instanceof NavigationEnd) {
        const currentUrl = this.getUrl(e.url);
        const previousUrl = this.getUrl(this.previousUrl);

        // Don't affect authentication pages.
        if (currentUrl === 'authentication') {
          return;
        }

        if (currentUrl !== previousUrl) {
          this.urls.set(previousUrl, this.previousUrl);

          const url = this.urls.get(currentUrl);
          if (url) {
            this.router.navigateByUrl(url);
          }
        }

        this.previousUrl = e.url;
      }
    });

    this.tokenService.emitter.on('accessToken', async (accessToken) => {
      if (accessToken) {
        await this.find();
      } else {
        this.urls.clear();
      }
    });
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

  private getUrl(url: string) {
    const value = url.split('/')[1];

    switch (value) {
      case 'account':
        return 'account';

      case 'authentication':
        return 'authentication';

      case 'management-portal':
        return 'management-portal';

      case 'store':
        return 'store';
    }

    return 'home';
  }
}
