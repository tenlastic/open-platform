import { DOCUMENT } from '@angular/common';
import { ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { EnvironmentService, IdentityService } from '@tenlastic/ng-authentication';
import { ElectronService } from '@tenlastic/ng-electron';
import { ConnectionQuery } from '@tenlastic/ng-http';
import { map } from 'rxjs/operators';

import { BackgroundService } from '../../../core/services';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
})
export class LayoutComponent implements OnInit {
  public launcherUrl = environment.launcherUrl;
  public message: string;

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private backgroundService: BackgroundService,
    private changeDetectorRef: ChangeDetectorRef,
    private connectionQuery: ConnectionQuery,
    public electronService: ElectronService,
    public environmentService: EnvironmentService,
    public identityService: IdentityService,
    public router: Router,
  ) {}

  public ngOnInit() {
    this.backgroundService.subject.subscribe(value => {
      this.document.body.style.backgroundImage = `url('${value}')`;
    });

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

  public $getConnection(userId: string) {
    return this.connectionQuery
      .selectAll({ filterBy: c => c.userId === userId })
      .pipe(map(connections => connections[0]));
  }

  public close() {
    const window = this.electronService.remote.getCurrentWindow();
    window.close();
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
}
