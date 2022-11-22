import { Component } from '@angular/core';

import { environment } from '../../../../../environments/environment';
import { ElectronService } from '../../../../core/services';

@Component({
  styleUrls: ['./layout.component.scss'],
  templateUrl: './layout.component.html',
})
export class LayoutComponent {
  public get isElectron() {
    return this.electronService.isElectron;
  }
  public launcherUrl = environment.launcherUrl;

  constructor(private electronService: ElectronService) {}
}
