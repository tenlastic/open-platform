import { Component } from '@angular/core';

import { ElectronService } from '../../../../core/services';

@Component({
  styleUrls: ['./layout.component.scss'],
  templateUrl: './layout.component.html',
})
export class LayoutComponent {
  constructor(public electronService: ElectronService) {}
}
