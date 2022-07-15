import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { ClipboardService } from '../../../core/services';

export interface ApiKeyDialogComponentData {
  apiKey: string;
}

@Component({
  selector: 'app-api-key-dialog',
  styleUrls: ['api-key-dialog.component.scss'],
  templateUrl: 'api-key-dialog.component.html',
})
export class ApiKeyDialogComponent {
  constructor(
    private clipboardService: ClipboardService,
    public dialogRef: MatDialogRef<ApiKeyDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ApiKeyDialogComponentData,
    private snackBar: MatSnackBar,
  ) {}

  public copyToClipboard() {
    this.clipboardService.copy(this.data.apiKey);
    this.snackBar.open('API Key copied to clipboard.');
  }
}
