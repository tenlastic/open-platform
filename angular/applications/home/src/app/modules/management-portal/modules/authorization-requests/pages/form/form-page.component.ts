import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Params, Router } from '@angular/router';
import {
  AuthorizationQuery,
  AuthorizationRequestModel,
  AuthorizationRequestService,
  IAuthorization,
  UserModel,
  UserService,
} from '@tenlastic/http';

import { FormService, IdentityService } from '../../../../../../core/services';

@Component({
  styleUrls: ['./form-page.component.scss'],
  templateUrl: 'form-page.component.html',
})
export class AuthorizationRequestsFormPageComponent implements OnInit {
  public AuthorizationRole = IAuthorization.Role;
  public data: AuthorizationRequestModel;
  public errors: string[] = [];
  public form: FormGroup;
  public hasWriteAuthorization: boolean;
  public isSaving: boolean;

  private params: Params;

  constructor(
    private activatedRoute: ActivatedRoute,
    private authorizationQuery: AuthorizationQuery,
    private authorizationRequestService: AuthorizationRequestService,
    private formBuilder: FormBuilder,
    private formService: FormService,
    private identityService: IdentityService,
    private matSnackBar: MatSnackBar,
    private router: Router,
    private userService: UserService,
  ) {}

  public async ngOnInit() {
    this.activatedRoute.params.subscribe(async (params) => {
      this.params = params;

      const roles = [IAuthorization.Role.AuthorizationsWrite];
      const userId = this.identityService.user?._id;
      this.hasWriteAuthorization = this.authorizationQuery.hasRoles(null, roles, userId);

      if (params.authorizationRequestId !== 'new') {
        this.data = await this.authorizationRequestService.findOne(
          params.namespaceId,
          params.authorizationRequestId,
        );
      }

      await this.setupForm();
    });
  }

  public async deny() {
    this.errors = [];
    this.isSaving = true;

    try {
      this.data = await this.authorizationRequestService.deny(
        this.params.namespaceId,
        this.data._id,
      );

      this.matSnackBar.open(`Authorization Request denied successfully.`);
      this.router.navigate(['../', this.data._id], { relativeTo: this.activatedRoute });
    } catch (e) {
      this.errors = this.formService.handleHttpError(e, {
        namespaceId: 'Namespace',
        userId: 'User',
      });
    }

    this.isSaving = false;
  }

  public async grant() {
    this.errors = [];
    this.isSaving = true;

    try {
      this.data = await this.authorizationRequestService.grant(
        this.params.namespaceId,
        this.data._id,
      );

      this.matSnackBar.open(`Authorization Request granted successfully.`);
      this.router.navigate(['../', this.data._id], { relativeTo: this.activatedRoute });
    } catch (e) {
      this.errors = this.formService.handleHttpError(e, {
        namespaceId: 'Namespace',
        userId: 'User',
      });
    }

    this.isSaving = false;
  }

  private async setupForm() {
    this.data ??= new AuthorizationRequestModel();
    this.form = null;

    const roles = Object.values(IAuthorization.Role).reduce((previous, current) => {
      previous[current] = this.data.roles.includes(current);
      return previous;
    }, {});

    let user: UserModel = null;
    if (this.data.userId) {
      user = await this.userService.findOne(this.data.userId);
    }

    this.form = this.formBuilder.group({
      roles: this.formBuilder.group(roles),
      user: [user, [Validators.required]],
    });

    this.form.get('roles').disable({ emitEvent: false });
    this.form.get('user').disable({ emitEvent: false });

    if (!this.hasWriteAuthorization) {
      this.form.disable({ emitEvent: false });
    }
  }
}
