import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  styleUrls: ['./contact-us.component.scss'],
  templateUrl: 'contact-us.component.html',
})
export class ContactUsComponent implements OnInit {
  public form: FormGroup;
  public isSubmitted: boolean;

  constructor(private formBuilder: FormBuilder) {}

  public ngOnInit() {
    this.setupForm();
  }

  public async submit() {
    if (this.form.invalid) {
      this.form.get('email').markAsTouched();
      this.form.get('message').markAsTouched();
      this.form.get('name').markAsTouched();

      return;
    }

    this.isSubmitted = true;
  }

  private setupForm(): void {
    this.form = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      message: [''],
      name: ['', Validators.required],
    });
  }
}
