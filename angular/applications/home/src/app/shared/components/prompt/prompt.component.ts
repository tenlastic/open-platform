import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface PromptComponentData {
  buttons: Array<{ color?: string; label: string }>;
  message: string;
  title: string;
}

@Component({
  selector: 'app-prompt',
  standalone: false,
  styleUrls: ['./prompt.component.scss'],
  templateUrl: 'prompt.component.html',
})
export class PromptComponent {
  constructor(
    public dialogRef: MatDialogRef<PromptComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PromptComponentData,
  ) {}
}
