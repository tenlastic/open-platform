import { AfterViewInit, Component, OnDestroy, TemplateRef, ViewChild } from '@angular/core';

import { environment } from '../../../../../environments/environment';
import { ElectronService, SideMenuService } from '../../../../core/services';

@Component({
  standalone: false,
  styleUrls: ['./layout.component.scss'],
  templateUrl: './layout.component.html',
})
export class LayoutComponent implements AfterViewInit, OnDestroy {
  @ViewChild('sideMenu') private sideMenuTemplate: TemplateRef<unknown>;

  public get $sideMenuIsVisible() {
    return this.sideMenuService.$visible;
  }
  public get isElectron() {
    return this.electronService.isElectron;
  }
  public launcherUrl = environment.launcherUrl;

  constructor(private electronService: ElectronService, private sideMenuService: SideMenuService) {}

  public ngAfterViewInit() {
    this.sideMenuService.add(this.sideMenuTemplate);
  }

  public ngOnDestroy() {
    this.sideMenuService.remove(this.sideMenuTemplate);
  }

  public toggleSideMenu() {
    if (this.sideMenuService.visible) {
      this.sideMenuService.hide();
    } else {
      this.sideMenuService.show();
    }
  }
}
