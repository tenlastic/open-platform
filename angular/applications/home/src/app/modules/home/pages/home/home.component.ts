import { Component } from '@angular/core';

import { environment } from '../../../../../environments/environment';
import { ElectronService } from '../../../../core/services';

@Component({
  templateUrl: 'home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent {
  public get isElectron() {
    return this.electronService.isElectron;
  }
  public launcherUrl = environment.launcherUrl;

  constructor(private electronService: ElectronService) {}
}
