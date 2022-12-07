import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Params, Router } from '@angular/router';
import {
  AuthorizationQuery,
  AuthorizationRequestModel,
  AuthorizationRequestService,
  AuthorizationService,
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

  private params: Params;

  constructor(
    private activatedRoute: ActivatedRoute,
    private authorizationQuery: AuthorizationQuery,
    private authorizationService: AuthorizationService,
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

      const roles = [IAuthorization.Role.AuthorizationsReadWrite];
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

  public async grant() {
    this.errors = [];

    const { namespaceId } = this.params;
    const values: Partial<AuthorizationRequestModel> = { grantedAt: new Date() };

    try {
      this.data = await this.authorizationRequestService.update(namespaceId, this.data._id, values);

      this.matSnackBar.open(`Authorization Request granted successfully.`);
      this.router.navigate(['../', this.data._id], { relativeTo: this.activatedRoute });
    } catch (e) {
      this.errors = this.formService.handleHttpError(e, {
        namespaceId: 'Namespace',
        userId: 'User',
      });
    }
  }

  public async deny() {
    this.errors = [];

    const { namespaceId } = this.params;
    const values: Partial<AuthorizationRequestModel> = { deniedAt: new Date() };

    try {
      this.data = await this.authorizationRequestService.update(namespaceId, this.data._id, values);

      this.matSnackBar.open(`Authorization Request denied successfully.`);
      this.router.navigate(['../', this.data._id], { relativeTo: this.activatedRoute });
    } catch (e) {
      this.errors = this.formService.handleHttpError(e, {
        namespaceId: 'Namespace',
        userId: 'User',
      });
    }
  }

  private async setupForm() {
    this.data = this.data || new AuthorizationRequestModel();
    this.form = null;

    let user: UserModel = null;
    if (this.data.userId) {
      user = await this.userService.findOne(this.data.userId);
    }

    this.form = this.formBuilder.group({
      roles: this.formBuilder.group({
        articles: this.data.roles?.find((r) => r.startsWith('Articles')),
        authorizations: this.data.roles?.find((r) => r.startsWith('Authorizations')),
        builds: this.data.roles?.find((r) => r.startsWith('Builds')),
        collections: this.data.roles?.find((r) => r.startsWith('Collections')),
        gameServers: this.data.roles?.find((r) => r.startsWith('GameServers')),
        matches: this.data.roles?.find((r) => r.startsWith('Matches')),
        namespaces: this.data.roles?.find((r) => r.startsWith('Namespaces')),
        queues: this.data.roles?.find((r) => r.startsWith('Queues')),
        records: this.data.roles?.find((r) => r.startsWith('Records')),
        storefronts: this.data.roles?.find((r) => r.startsWith('Storefronts')),
        users: this.data.roles?.find((r) => r.startsWith('Users')),
        webSockets: this.data.roles?.find((r) => r.startsWith('WebSockets')),
        workflows: this.data.roles?.find((r) => r.startsWith('Workflows')),
      }),
      user: [user, [Validators.required]],
    });

    this.form.get('roles').disable({ emitEvent: false });
    this.form.get('user').disable({ emitEvent: false });

    if (!this.hasWriteAuthorization) {
      this.form.disable({ emitEvent: false });
    }
  }
}
