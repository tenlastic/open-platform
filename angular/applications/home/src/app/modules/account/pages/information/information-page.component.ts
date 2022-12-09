import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import { UserModel, UserService } from '@tenlastic/http';

import { IdentityService } from '../../../../core/services';

@Component({
  styleUrls: ['./information-page.component.scss'],
  templateUrl: 'information-page.component.html',
})
export class InformationPageComponent implements OnInit {
  public data: UserModel;
  public error: string;
  public form: FormGroup;
  public loadingMessage: string;

  constructor(
    private activatedRoute: ActivatedRoute,
    private formBuilder: FormBuilder,
    public identityService: IdentityService,
    private matSnackBar: MatSnackBar,
    private userService: UserService,
  ) {}

  public ngOnInit() {
    this.activatedRoute.paramMap.subscribe(async (params) => {
      this.loadingMessage = 'Loading User...';

      const _id = this.identityService.user._id;
      this.data = await this.userService.findOne(_id);

      this.setupForm();

      this.loadingMessage = null;
    });
  }

  public async save() {
    if (this.form.invalid) {
      this.form.get('email').markAsTouched();
      this.form.get('username').markAsTouched();

      return;
    }

    const values: Partial<UserModel> = {
      email: this.form.get('email').value,
      username: this.form.get('username').value,
    };

    if (this.data._id) {
      this.update(values);
    } else {
      this.create(values);
    }
  }

  private async create(data: Partial<UserModel>) {
    try {
      await this.userService.create(data);
      this.matSnackBar.open('User created successfully.');
    } catch (e) {
      this.error = 'That email is already taken.';
    }
  }

  private setupForm() {
    this.data ??= new UserModel();

    this.form = this.formBuilder.group({
      email: [this.data.email],
      username: [this.data.username, Validators.required],
    });

    this.form.valueChanges.subscribe(() => (this.error = null));
  }

  private async update(data: Partial<UserModel>) {
    data._id = this.data._id;

    try {
      await this.userService.update(data._id, data);
      this.matSnackBar.open('User updated successfully.');
    } catch (e) {
      this.error = 'That email is already taken.';
    }
  }
}
