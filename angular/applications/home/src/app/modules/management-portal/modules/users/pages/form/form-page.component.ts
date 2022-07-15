import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AuthorizationQuery, IAuthorization, User, UserService } from '@tenlastic/ng-http';

import { FormService, IdentityService } from '../../../../../../core/services';

@Component({
  templateUrl: 'form-page.component.html',
  styleUrls: ['./form-page.component.scss'],
})
export class UsersFormPageComponent implements OnInit {
  public data: User;
  public errors: string[] = [];
  public form: FormGroup;
  public hasWriteAuthorization: boolean;

  constructor(
    private activatedRoute: ActivatedRoute,
    private authorizationQuery: AuthorizationQuery,
    private formBuilder: FormBuilder,
    private formService: FormService,
    private identityService: IdentityService,
    private userService: UserService,
  ) {}

  public ngOnInit() {
    this.activatedRoute.params.subscribe(async (params) => {
      const roles = [IAuthorization.AuthorizationRole.UsersReadWrite];
      const userId = this.identityService.user?._id;
      this.hasWriteAuthorization = this.authorizationQuery.hasRoles(null, roles, userId);

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
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const values: Partial<User> = {
      _id: this.data._id,
      email: this.form.get('email').value,
      username: this.form.get('username').value,
    };

    try {
      this.data = await this.formService.upsert(this.userService, values);
    } catch (e) {
      this.formService.handleHttpError(e, { email: 'Email Address', username: 'Username' });
    }
  }

  private setupForm(): void {
    this.data = this.data || new User();

    this.form = this.formBuilder.group({
      email: [this.data.email, Validators.email],
      username: [
        this.data.username,
        [Validators.required, Validators.pattern(/^[A-Za-z0-9]+$/), Validators.maxLength(20)],
      ],
    });

    this.form.valueChanges.subscribe(() => (this.errors = []));
  }
}
