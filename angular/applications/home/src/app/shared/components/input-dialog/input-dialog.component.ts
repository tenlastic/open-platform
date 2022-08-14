import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validator } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

export interface InputDialogComponentData {
  autocomplete?: (value: string) => Promise<any>;
  error: string;
  label: string;
  title?: string;
  type?: string;
  validators?: Validator[];
  value?: string;
  width?: number;
}

export interface InputDialogComponentOption {
  label: string;
  value: any;
}

@Component({
  selector: 'app-input-dialog',
  templateUrl: 'input-dialog.component.html',
  styleUrls: ['./input-dialog.component.scss'],
})
export class InputDialogComponent implements OnInit {
  public form: UntypedFormGroup;
  public options: InputDialogComponentOption[] = [];

  private subject: Subject<string> = new Subject();

  constructor(
    public dialogRef: MatDialogRef<InputDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: InputDialogComponentData,
    private formBuilder: UntypedFormBuilder,
  ) {}

  public ngOnInit() {
    if (this.data.width) {
      this.dialogRef.updateSize(`${this.data.width}px`);
    }

    this.setupForm();

    if (this.data.autocomplete) {
      this.form.get('input').valueChanges.subscribe(value => this.subject.next(value));
      this.subject.pipe(debounceTime(300)).subscribe(async value => {
        this.options = await this.data.autocomplete(value);
      });
    }
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
      input: [this.data.value || '', this.data.validators || []],
    });
  }
}
