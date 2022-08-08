import { Title } from '@angular/platform-browser';
import { Component, HostListener, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { resetStores } from '@datorama/akita';
import {
  AuthorizationQuery,
  LoginService,
  QueueMemberQuery,
  StreamService,
  UserQuery,
  UserService,
  WebSocketQuery,
  TokenService,
} from '@tenlastic/http';

import { environment } from '../environments/environment';
import { ElectronService } from './core/services';
import { TITLE } from './shared/constants';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit {
  @HostListener('window:focus', ['$event'])
  private onFocus(event: any) {
    this.connectSocket();
  }

  constructor(
    private authorizationQuery: AuthorizationQuery,
    private electronService: ElectronService,
    private loginService: LoginService,
    private queueMemberQuery: QueueMemberQuery,
    private router: Router,
    private streamService: StreamService,
    private titleService: Title,
    private tokenService: TokenService,
    private userQuery: UserQuery,
    private userService: UserService,
    private webSocketQuery: WebSocketQuery,
  ) {}

  public async ngOnInit() {
    this.titleService.setTitle(`${TITLE}`);

    // Navigate to login page on logout.
    this.loginService.emitter.on('logout', () => this.navigateToLogin());

    // Handle websockets when logging in and out.
    this.loginService.emitter.on('login', () => this.connectSocket());
    this.loginService.emitter.on('logout', () => this.streamService.close(environment.wssUrl));

    // Handle websockets when access token is set.
    this.tokenService.emitter.on('accessToken', (accessToken) => {
      if (accessToken) {
        this.connectSocket();
      }
    });

    // Connect to websockets.
    try {
      await this.connectSocket();
    } catch {}

    // Load previous url if set.
    const url = localStorage.getItem('url');
    if (url && this.electronService.isElectron) {
      this.router.navigateByUrl(url);
    }

    // Remember url when changing pages.
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        localStorage.setItem('url', event.url);
      }
    });

    // Clear stores on logout.
    this.loginService.emitter.on('logout', () => resetStores());

    this.fetchMissingRecords();
  }

  public fetchMissingRecords() {
    this.authorizationQuery.selectAll().subscribe((records) => {
      const ids = records.map((r) => r.userId).filter((ui) => !this.userQuery.hasEntity(ui));
      return ids.length > 0 ? this.userService.find({ where: { _id: { $in: ids } } }) : null;
    });
    this.queueMemberQuery.selectAll().subscribe((records) => {
      const ids = records.map((r) => r.userId).filter((ui) => !this.userQuery.hasEntity(ui));
      return ids.length > 0 ? this.userService.find({ where: { _id: { $in: ids } } }) : null;
    });
    this.webSocketQuery.selectAll().subscribe((records) => {
      const ids = records.map((r) => r.userId).filter((ui) => !this.userQuery.hasEntity(ui));
      return ids.length > 0 ? this.userService.find({ where: { _id: { $in: ids } } }) : null;
    });
  }

  public navigateToLogin() {
    this.router.navigateByUrl('/authentication/log-in');
  }

  private async connectSocket() {
    return this.streamService.connect(environment.wssUrl);
  }
}
