import { Component, Inject } from '@angular/core';
import { OVERLAY_DATA, OVERLAY_REFERENCE, OverlayReference } from '@home/app/core/services';

export interface MediaDialogComponentData {
  src: string;
  type: 'image' | 'video';
}

@Component({
  standalone: false,
  styleUrls: ['media-dialog.component.scss'],
  templateUrl: 'media-dialog.component.html',
})
export class MediaDialogComponent {
  constructor(
    @Inject(OVERLAY_DATA) public data: MediaDialogComponentData,
    @Inject(OVERLAY_REFERENCE) public overlay: OverlayReference<string>,
  ) {
    overlay.reference.addPanelClass('media-dialog-component');
  }
}
