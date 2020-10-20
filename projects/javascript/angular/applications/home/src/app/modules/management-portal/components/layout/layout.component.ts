import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { environment } from '../../../../../environments/environment';
import {
  ElectronService,
  IdentityService,
  SelectedNamespaceService,
} from '../../../../core/services';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
})
export class LayoutComponent {
  public launcherUrl = environment.launcherUrl;
  public showInfrastructureButtons = true;
  public showLauncherButtons = true;

  constructor(
    public electronService: ElectronService,
    public identityService: IdentityService,
    public router: Router,
    public selectedNamespaceService: SelectedNamespaceService,
  ) {}
}
