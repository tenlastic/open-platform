import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';

import { TITLE } from '../../shared/constants';

@Component({
  styleUrls: ['./contact-us.component.scss'],
  templateUrl: 'contact-us.component.html',
})
export class ContactUsComponent implements OnInit {
  public form: FormGroup;
  public isSubmitted: boolean;

  constructor(private formBuilder: FormBuilder, private titleService: Title) {}

  public ngOnInit() {
    this.titleService.setTitle(`${TITLE} | Contact Us`);

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
