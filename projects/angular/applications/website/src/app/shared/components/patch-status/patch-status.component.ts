import { Component, ViewEncapsulation } from '@angular/core';

import { PatchService, UnityService } from '@app/core/services';

@Component({
  encapsulation: ViewEncapsulation.None,
  selector: 'app-patch-status',
  styleUrls: ['patch-status.component.scss'],
  templateUrl: 'patch-status.component.html'
})
export class PatchStatusComponent {

  constructor(public patchService: PatchService,
              public unityService: UnityService) {}

}
