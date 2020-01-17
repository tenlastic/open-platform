import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

export interface PromptComponentData {
  buttons: Array<{ background?: string, color?: string, label: string }>;
  message: string;
}

@Component({
  selector: 'app-prompt',
  templateUrl: 'prompt.component.html'
})
export class PromptComponent {
  constructor(public dialogRef: MatDialogRef<PromptComponent>,
              @Inject(MAT_DIALOG_DATA) public data: PromptComponentData) {}
}
