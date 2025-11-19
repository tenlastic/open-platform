import { Component, Inject } from '@angular/core';

import { MatSnackBar } from '@angular/material/snack-bar';
import { OVERLAY_DATA, OVERLAY_REFERENCE, OverlayReference } from '../../../core/services';

export interface DeletionOverlayComponentData {
  delete: () => Promise<unknown>;
  name: string;
}

@Component({
  standalone: false,
  styleUrls: ['./deletion-overlay.component.scss'],
  templateUrl: 'deletion-overlay.component.html',
})
export class DeletionOverlayComponent {
  public get name() {
    return this.data.name;
  }

  constructor(
    @Inject(OVERLAY_DATA) private data: DeletionOverlayComponentData,
    private matSnackBar: MatSnackBar,
    @Inject(OVERLAY_REFERENCE) private overlay: OverlayReference<string>,
  ) {}

  public no() {
    this.overlay.close();
  }

  public async yes() {
    this.overlay.close();

    this.data.delete();
    this.matSnackBar.open(`${this.data.name} deleted successfully.`);
  }
}
