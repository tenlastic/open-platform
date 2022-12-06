import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthorizationQuery, IAuthorization, UserModel, UserService } from '@tenlastic/http';

import { FormService, IdentityService } from '../../../../../../core/services';

@Component({
  templateUrl: 'form-page.component.html',
  styleUrls: ['./form-page.component.scss'],
})
export class UsersFormPageComponent implements OnInit {
  public data: UserModel;
  public errors: string[] = [];
  public form: FormGroup;
  public hasWriteAuthorization: boolean;

  constructor(
    private activatedRoute: ActivatedRoute,
    private authorizationQuery: AuthorizationQuery,
    private formBuilder: FormBuilder,
    private formService: FormService,
    private identityService: IdentityService,
    private matSnackBar: MatSnackBar,
    private router: Router,
    private userService: UserService,
  ) {}

  public ngOnInit() {
    this.activatedRoute.params.subscribe(async (params) => {
      const roles = [IAuthorization.Role.UsersReadWrite];
      const userId = this.identityService.user?._id;
      this.hasWriteAuthorization =
        this.authorizationQuery.hasRoles(null, roles, userId) || params.userId === userId;

      if (params.userId !== 'new') {
        this.data = await this.userService.findOne(params.userId);
      }

      this.setupForm();
    });
  }

  public navigateToJson() {
    this.formService.navigateToJson(this.form);
  }

  public async save() {
    this.errors = [];

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const values: Partial<UserModel> = {
      _id: this.data._id,
      email: this.form.get('email').value,
      username: this.form.get('username').value,
    };

    try {
      this.data = await this.upsert(values);
    } catch (e) {
      this.errors = this.formService.handleHttpError(e, {
        email: 'Email Address',
        username: 'Username',
      });
    }
  }

  private setupForm(): void {
    this.data = this.data || new UserModel();

    this.form = this.formBuilder.group({
      email: [this.data.email, Validators.email],
      username: [
        this.data.username,
        [Validators.required, Validators.pattern(/^[A-Za-z0-9]+$/), Validators.maxLength(20)],
      ],
    });

    if (!this.hasWriteAuthorization) {
      this.form.disable({ emitEvent: false });
    }

    this.form.valueChanges.subscribe(() => (this.errors = []));
  }

  private async upsert(values: Partial<UserModel>) {
    const result = values._id
      ? await this.userService.update(values._id, values)
      : await this.userService.create(values);

    this.matSnackBar.open(`User saved successfully.`);
    this.router.navigate(['../', result._id], { relativeTo: this.activatedRoute });

    return result;
  }
}
