import { Component } from '@angular/core';

import { SideMenuService } from '../../../core/services';

@Component({
  selector: 'app-side-menu-overlay',
  standalone: false,
  styleUrls: ['./side-menu-overlay.component.scss'],
  templateUrl: './side-menu-overlay.component.html',
})
export class SideMenuOverlayComponent {
  public get $visible() {
    return this.sideMenuService.$visible;
  }

  constructor(private sideMenuService: SideMenuService) {}

  public hide() {
    this.sideMenuService.hide();
  }
}
