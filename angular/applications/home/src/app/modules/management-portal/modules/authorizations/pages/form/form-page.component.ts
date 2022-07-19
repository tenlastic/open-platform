import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Params } from '@angular/router';
import {
  Authorization,
  AuthorizationQuery,
  AuthorizationService,
  IAuthorization,
  User,
  UserService,
} from '@tenlastic/ng-http';

import { FormService, IdentityService } from '../../../../../../core/services';
import {
  ApiKeyDialogComponent,
  ApiKeyDialogComponentData,
} from '../../../../../../shared/components';

export enum AuthorizationType {
  ApiKey = 'API Key',
  Default = 'Default',
  User = 'User',
}

@Component({
  styleUrls: ['./form-page.component.scss'],
  templateUrl: 'form-page.component.html',
})
export class AuthorizationsFormPageComponent implements OnInit {
  public AuthorizationRole = IAuthorization.AuthorizationRole;
  public AuthorizationType = AuthorizationType;
  public data: Authorization;
  public errors: string[] = [];
  public form: FormGroup;
  public hasWriteAuthorization: boolean;
  public get type() {
    return this.form.get('type').value;
  }

  private params: Params;

  constructor(
    private activatedRoute: ActivatedRoute,
    private authorizationQuery: AuthorizationQuery,
    private authorizationService: AuthorizationService,
    private formBuilder: FormBuilder,
    private formService: FormService,
    private identityService: IdentityService,
    private matDialog: MatDialog,
    private userService: UserService,
  ) {}

  public async ngOnInit() {
    this.activatedRoute.params.subscribe(async (params) => {
      this.params = params;

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
      _id: this.data._id,
      namespaceId: this.params.namespaceId,
      roles,
    };

    if (this.type === AuthorizationType.ApiKey) {
      values.apiKey = this.form.get('apiKey').value;
      values.name = this.form.get('name').value;
    } else if (this.type === AuthorizationType.User) {
      values.userId = this.form.get('user').value._id;
    }

    try {
      this.data = await this.formService.upsert(this.authorizationService, values);
      this.openApiKeyDialog(values.apiKey);
    } catch (e) {
      this.errors = this.formService.handleHttpError(e, {
        namespaceId: 'Namespace',
        userId: 'User',
      });
    }
  }

  private getRandomCharacter() {
    return Math.random().toString(36).charAt(2);
  }

  private openApiKeyDialog(apiKey: string) {
    if (!apiKey) {
      return;
    }

    this.matDialog.open<ApiKeyDialogComponent, ApiKeyDialogComponentData>(ApiKeyDialogComponent, {
      autoFocus: false,
      data: { apiKey },
    });
  }

  private async setupForm() {
    this.data = this.data || new Authorization();
    this.form = null;

    let user: User = null;
    if (this.data.userId) {
      user = await this.userService.findOne(this.data.userId);
    }

    const apiKey = Array(64).fill(0).map(this.getRandomCharacter).join('');
    let type = AuthorizationType.Default;
    if (this.data.name && this.params.namespaceId) {
      type = AuthorizationType.ApiKey;
    } else if (this.data.userId || !this.params.namespaceId) {
      type = AuthorizationType.User;
    }

    this.form = this.formBuilder.group({
      apiKey: [this.data._id ? undefined : apiKey],
      name: [this.data.name, type === AuthorizationType.ApiKey ? [Validators.required] : []],
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
        webSockets: this.data.roles?.find((r) => r.startsWith('WebSockets')),
        workflows: this.data.roles?.find((r) => r.startsWith('Workflows')),
      }),
      type: { disabled: this.data._id || !this.params.namespaceId, value: type },
      user: [
        { disabled: this.data._id, value: user },
        type === AuthorizationType.User ? [Validators.required] : [],
      ],
    });

    this.form.get('type').valueChanges.subscribe((t) => {
      if (t === AuthorizationType.ApiKey) {
        this.form.get('name').setValidators([Validators.required]);
        this.form.get('user').setValidators([]);
      } else if (t === AuthorizationType.User) {
        this.form.get('name').setValidators([]);
        this.form.get('user').setValidators([Validators.required]);
      }

      this.form.get('name').updateValueAndValidity({ emitEvent: false });
      this.form.get('user').updateValueAndValidity({ emitEvent: false });
    });

    if (!this.hasWriteAuthorization) {
      this.form.disable({ emitEvent: false });
    }

    this.form.valueChanges.subscribe(() => (this.errors = []));
  }
}
