import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validator } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface TextAreaDialogComponentData {
  error: string;
  label?: string;
  title?: string;
  type?: string;
  validators?: Validator[];
  value?: string;
  width?: number;
}

export interface TextAreaDialogComponentOption {
  label: string;
  value: any;
}

@Component({
  selector: 'app-text-area-dialog',
  templateUrl: 'text-area-dialog.component.html',
  styleUrls: ['./text-area-dialog.component.scss'],
})
export class TextAreaDialogComponent implements OnInit {
  public form: FormGroup;
  public options: TextAreaDialogComponentOption[] = [];

  constructor(
    public dialogRef: MatDialogRef<TextAreaDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: TextAreaDialogComponentData,
    private formBuilder: FormBuilder,
  ) {}

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

  private setupForm() {
    this.form = this.formBuilder.group({
      input: [this.data.value || '', this.data.validators || []],
    });
  }
}
