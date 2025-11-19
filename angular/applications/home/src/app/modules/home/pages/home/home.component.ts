import { Component } from '@angular/core';

import { environment } from '../../../../../environments/environment';
import { ElectronService } from '../../../../core/services';

@Component({
  standalone: false,
  styleUrls: ['./home.component.scss'],
  templateUrl: 'home.component.html',
})
export class HomeComponent {
  public get isElectron() {
    return this.electronService.isElectron;
  }
  public launcherUrl = environment.launcherUrl;

  constructor(private electronService: ElectronService) {}
}
