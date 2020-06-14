import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material';
import { Namespace, NamespaceService } from '@tenlastic/ng-http';

import { ElectronService, IdentityService } from '../../../core/services';
import { PromptComponent } from '../prompt/prompt.component';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
})
export class LayoutComponent implements OnInit {
  public namespaces: Namespace[] = [];

  constructor(
    public electronService: ElectronService,
    public identityService: IdentityService,
    private matDialog: MatDialog,
    private namespaceService: NamespaceService,
  ) {}

  public async ngOnInit() {
    this.namespaces = await this.namespaceService.find({});

    if (!this.electronService.isElectron) {
      return;
    }

    const { ipcRenderer } = this.electronService;
    ipcRenderer.on('message', (event, text) => {
      if (text.includes('Update available')) {
        console.log('Downloading update...');
      }

      if (text.includes('Update downloaded')) {
        console.log('Restart to install update.');
      }
    });
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
}
