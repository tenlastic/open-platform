import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface MediaDialogComponentData {
  src: string;
  type: 'image' | 'video';
}

@Component({
  styleUrls: ['media-dialog.component.scss'],
  templateUrl: 'media-dialog.component.html',
})
export class MediaDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<MediaDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: MediaDialogComponentData,
  ) {
    dialogRef.addPanelClass('media-dialog-component');
  }
}
