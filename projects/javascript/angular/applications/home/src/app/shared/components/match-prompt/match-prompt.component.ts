import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface MatchPromptComponentData {
  buttons: Array<{ color?: string; label: string }>;
  message: string;
  title: string;
}

@Component({
  selector: 'app-match-prompt',
  styleUrls: ['./match-prompt.component.scss'],
  templateUrl: 'match-prompt.component.html',
})
export class MatchPromptComponent implements OnDestroy, OnInit {
  private timeout: any;

  constructor(
    public dialogRef: MatDialogRef<MatchPromptComponent>,
    @Inject(MAT_DIALOG_DATA) public data: MatchPromptComponentData,
  ) {}

  public ngOnInit() {
    this.timeout = setTimeout(() => this.dialogRef.close(), 30000);
  }

  public ngOnDestroy() {
    if (!this.timeout) {
      return;
    }

    clearTimeout(this.timeout);
  }
}
