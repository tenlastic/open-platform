import { Component, Inject } from '@angular/core';

import { OVERLAY_DATA, OVERLAY_REFERENCE, OverlayReference } from '../../../core/services';

export interface PromptOverlayComponentData {
  buttons: Array<{ color?: string; label: string }>;
  message: string;
  title?: string;
}

@Component({
  standalone: false,
  styleUrls: ['./prompt-overlay.component.scss'],
  templateUrl: 'prompt-overlay.component.html',
})
export class PromptOverlayComponent {
  constructor(
    @Inject(OVERLAY_DATA) public data: PromptOverlayComponentData,
    @Inject(OVERLAY_REFERENCE) public overlay: OverlayReference<string>,
  ) {}
}
