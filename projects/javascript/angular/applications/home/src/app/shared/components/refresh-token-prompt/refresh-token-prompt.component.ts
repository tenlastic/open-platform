import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

export interface RefreshTokenPromptComponentData {
  token: string;
}

@Component({
  selector: 'app-refresh-token-prompt',
  styleUrls: ['refresh-token-prompt.component.scss'],
  templateUrl: 'refresh-token-prompt.component.html',
})
export class RefreshTokenPromptComponent {
  constructor(
    public dialogRef: MatDialogRef<RefreshTokenPromptComponent>,
    @Inject(MAT_DIALOG_DATA) public data: RefreshTokenPromptComponentData,
    private snackBar: MatSnackBar,
  ) {}

  public copyToClipboard() {
    // Create dummy element to copy.
    const selBox = document.createElement('textarea');
    selBox.style.position = 'fixed';
    selBox.style.left = '0';
    selBox.style.opacity = '0';
    selBox.style.top = '0';
    selBox.value = this.data.token;

    // Copy contents of created element.
    document.body.appendChild(selBox);
    selBox.focus();
    selBox.select();
    document.execCommand('copy');
    document.body.removeChild(selBox);

    // Let the user know the copy was successful.
    this.snackBar.open('Refresh token copied to clipboard.');
  }
}
