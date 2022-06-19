import { Component } from '@angular/core';

import { environment } from '../../../../../environments/environment';
import { ElectronService } from '../../../../core/services';

@Component({
  styleUrls: ['./layout.component.scss'],
  templateUrl: './layout.component.html',
})
export class LayoutComponent {
  public launcherUrl = environment.launcherUrl;

  constructor(public electronService: ElectronService) {}
}
