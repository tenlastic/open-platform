import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Params, Router } from '@angular/router';
import {
  AuthorizationQuery,
  IAuthorization,
  SteamApiKeyModel,
  SteamApiKeyQuery,
  SteamApiKeyService,
  UserQuery,
  UserService,
} from '@tenlastic/http';
import { Subscription } from 'rxjs';

import { FormService, IdentityService } from '../../../../../../core/services';

@Component({
  templateUrl: 'form-page.component.html',
  styleUrls: ['./form-page.component.scss'],
})
export class SteamApiKeysFormPageComponent implements OnDestroy, OnInit {
  public data: SteamApiKeyModel;
  public errors: string[] = [];
  public form: FormGroup;
  public hasWriteAuthorization: boolean;
  public get isNew() {
    return this.params.steamApiKeyId === 'new';
  }
  public isSaving: boolean;

  private updateSteamApiKey$ = new Subscription();
  private params: Params;

  constructor(
    private activatedRoute: ActivatedRoute,
    private authorizationQuery: AuthorizationQuery,
    private formBuilder: FormBuilder,
    private formService: FormService,
    private identityService: IdentityService,
    private matSnackBar: MatSnackBar,
    private router: Router,
    private steamApiKeyQuery: SteamApiKeyQuery,
    private steamApiKeyService: SteamApiKeyService,
    private userQuery: UserQuery,
  ) {}

  public ngOnInit() {
    this.activatedRoute.params.subscribe(async (params) => {
      this.params = params;

      const roles = [IAuthorization.Role.SteamApiKeysWrite];
      const userId = this.identityService.user?._id;
      this.hasWriteAuthorization =
        this.authorizationQuery.hasRoles(null, roles, userId) ||
        this.authorizationQuery.hasRoles(params.namespaceId, roles, userId);

      if (params.steamApiKeyId !== 'new') {
        this.data = await this.steamApiKeyService.findOne(params.namespaceId, params.steamApiKeyId);
      }

      this.setupForm();
    });
  }

  public ngOnDestroy() {
    this.updateSteamApiKey$.unsubscribe();
  }

  public navigateToJson() {
    this.formService.navigateToJson(this.form);
  }

  public async save() {
    this.errors = [];
    this.isSaving = true;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.isSaving = false;
      return;
    }

    const values: Partial<SteamApiKeyModel> = {
      _id: this.data._id,
      appId: this.form.get('appId').value,
      name: this.form.get('name').value,
      namespaceId: this.params.namespaceId,
      value: this.form.get('value').value,
    };

    try {
      this.data = await this.upsert(values);
    } catch (e) {
      this.errors = this.formService.handleHttpError(e, {
        appId: 'App ID',
        namespaceId: 'Namespace',
        value: 'Value',
      });
    }

    this.isSaving = false;
  }

  private setupForm() {
    this.data ??= new SteamApiKeyModel({ appId: 0, name: '', value: '' });

    this.form = this.formBuilder.group({
      appId: [this.data.appId, Validators.required],
      name: [this.data.name, Validators.required],
      value: [this.data.value, Validators.required],
    });

    if (!this.isNew) {
      this.form.get('appId').disable({ emitEvent: false });
      this.form.get('value').disable({ emitEvent: false });
    }

    if (!this.hasWriteAuthorization) {
      this.form.disable({ emitEvent: false });
    }

    this.form.valueChanges.subscribe(() => (this.errors = []));

    if (this.data._id) {
      this.updateSteamApiKey$ = this.steamApiKeyQuery
        .selectAll({ filterBy: (q) => q._id === this.data._id })
        .subscribe((steamApiKeys) => (this.data = steamApiKeys[0]));
    }
  }

  private async upsert(values: Partial<SteamApiKeyModel>) {
    const result = values._id
      ? await this.steamApiKeyService.update(this.params.namespaceId, values._id, values)
      : await this.steamApiKeyService.create(this.params.namespaceId, values);

    this.matSnackBar.open(`Steam API Key saved successfully.`);
    this.router.navigate(['../', result._id], { relativeTo: this.activatedRoute });

    return result;
  }
}
