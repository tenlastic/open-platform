import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import { UserModel, UserService } from '@tenlastic/http';

import { FormService, IdentityService } from '../../../../core/services';

@Component({
  styleUrls: ['./information-page.component.scss'],
  templateUrl: 'information-page.component.html',
})
export class InformationPageComponent implements OnInit {
  public data: UserModel;
  public errors: string[] = [];
  public form: FormGroup;
  public loadingMessage: string;

  constructor(
    private activatedRoute: ActivatedRoute,
    private formBuilder: FormBuilder,
    private formService: FormService,
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
    this.errors = [];

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
      this.errors = this.formService.handleHttpError(e, {
        email: 'Email Address',
        username: 'Username',
      });
    }
  }

  private setupForm() {
    this.data ??= new UserModel();

    this.form = this.formBuilder.group({
      email: [this.data.email],
      steamId: [this.data.steamId],
      username: [this.data.username, this.data.steamId ? null : Validators.required],
    });

    this.form.get('steamId').disable({ emitEvent: false });

    this.form.valueChanges.subscribe(() => (this.errors = []));
  }

  private async update(data: Partial<UserModel>) {
    data._id = this.data._id;

    try {
      await this.userService.update(data._id, data);
      this.matSnackBar.open('User updated successfully.');
    } catch (e) {
      this.errors = this.formService.handleHttpError(e, {
        email: 'Email Address',
        username: 'Username',
      });
    }
  }
}
