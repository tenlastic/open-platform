import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  Authorization,
  AuthorizationQuery,
  AuthorizationService,
  IAuthorization,
  User,
  UserService,
} from '@tenlastic/ng-http';

import { FormService, IdentityService } from '../../../../../../core/services';

@Component({
  styleUrls: ['./form-page.component.scss'],
  templateUrl: 'form-page.component.html',
})
export class AuthorizationsFormPageComponent implements OnInit {
  public AuthorizationRole = IAuthorization.AuthorizationRole;
  public data: Authorization;
  public errors: string[] = [];
  public form: FormGroup;
  public hasWriteAuthorization: boolean;

  constructor(
    private activatedRoute: ActivatedRoute,
    private authorizationQuery: AuthorizationQuery,
    private authorizationService: AuthorizationService,
    private formBuilder: FormBuilder,
    private formService: FormService,
    private identityService: IdentityService,
    private userService: UserService,
  ) {}

  public async ngOnInit() {
    this.activatedRoute.params.subscribe(async (params) => {
      const roles = [IAuthorization.AuthorizationRole.AuthorizationsReadWrite];
      const userId = this.identityService.user?._id;
      this.hasWriteAuthorization = this.authorizationQuery.hasRoles(null, roles, userId);

      if (params.authorizationId !== 'new') {
        this.data = await this.authorizationService.findOne(params.authorizationId);
      }

      await this.setupForm();
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

    const roles = Object.values<IAuthorization.AuthorizationRole>(
      this.form.get('roles').value,
    ).filter((v) => v);

    const values: Partial<Authorization> = {
      roles,
      userId: this.form.get('user').value._id,
    };

    try {
      this.data = await this.formService.upsert(this.authorizationService, values);
    } catch (e) {
      this.formService.handleHttpError(e, { namespaceId: 'Namespace', userId: 'User' });
    }
  }

  private async setupForm() {
    this.data = this.data || new Authorization();
    this.form = null;

    let user: User = null;
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
        games: this.data.roles?.find((r) => r.startsWith('Games')),
        namespaces: this.data.roles?.find((r) => r.startsWith('Namespaces')),
        queues: this.data.roles?.find((r) => r.startsWith('Queues')),
        users: this.data.roles?.find((r) => r.startsWith('Users')),
        workflows: this.data.roles?.find((r) => r.startsWith('Workflows')),
      }),
      user,
    });

    if (!this.hasWriteAuthorization) {
      this.form.disable({ emitEvent: false });
    }

    this.form.valueChanges.subscribe(() => (this.errors = []));
  }
}
