import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validator } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

export interface InputPromptComponentData {
  error: string;
  label: string;
  type?: string;
  validators?: Validator[];
  value?: string;
  width?: number;
}

@Component({
  selector: 'app-input-prompt',
  templateUrl: 'input-prompt.component.html',
  styleUrls: ['./input-prompt.component.scss']
})
export class InputPromptComponent implements OnInit {
  public form: FormGroup;

  constructor(public dialogRef: MatDialogRef<InputPromptComponent>,
              @Inject(MAT_DIALOG_DATA) public data: InputPromptComponentData,
              private formBuilder: FormBuilder) {}

  public ngOnInit() {
    if (this.data.width) {
      this.dialogRef.updateSize(`${this.data.width}px`);
    }

    this.setupForm();
  }

  public submit() {
    if (this.form.invalid) {
      this.form.get('input').markAsTouched();

      return;
    }

    this.dialogRef.close(this.form.get('input').value);
  }

  private setupForm(): void {
    this.form = this.formBuilder.group({
      input: [this.data.value || '', this.data.validators || []]
    });
  }
}
