import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import {
  AuthorizationState,
  IAuthorization,
  SteamIntegrationModel,
  SteamIntegrationService,
  SteamIntegrationState,
} from '@tenlastic/http';
import { map, Subscription } from 'rxjs';

import { FormService, IdentityService } from '@home/app/core/services';

export interface SteamIntegrationForm {
  apiKey: FormControl<string>;
  applicationId: FormControl<number>;
  name: FormControl<string>;
  roles: FormGroup<{ [key: string]: FormControl<boolean> }>;
}

@Component({
  standalone: false,
  styleUrls: ['./form-page.component.scss'],
  templateUrl: 'form-page.component.html',
})
export class SteamIntegrationsFormPageComponent implements OnDestroy, OnInit {
  public data: SteamIntegrationModel;
  public errors: string[] = [];
  public form: FormGroup<SteamIntegrationForm>;
  public hasWriteAuthorization: boolean;
  public get isNew() {
    return this.steamIntegrationId === 'new';
  }
  public isSaving: boolean;

  private updateSteamIntegration$ = new Subscription();
  private namespaceId: string;
  private steamIntegrationId: string;

  constructor(
    private activatedRoute: ActivatedRoute,
    private authorizationState: AuthorizationState,
    private formBuilder: FormBuilder,
    private formService: FormService,
    private identityService: IdentityService,
    private matSnackBar: MatSnackBar,
    private router: Router,
    private steamIntegrationState: SteamIntegrationState,
    private steamIntegrationService: SteamIntegrationService,
  ) {}

  public ngOnInit() {
    this.activatedRoute.params.subscribe(async (params) => {
      this.namespaceId = params.namespaceId;
      this.steamIntegrationId = params.steamIntegrationId;

      const roles = [IAuthorization.Role.SteamIntegrationsWrite];
      const userId = this.identityService.user?._id;
      this.hasWriteAuthorization =
        this.authorizationState.hasRoles(null, roles, userId) ||
        this.authorizationState.hasRoles(params.namespaceId, roles, userId);

      if (params.steamIntegrationId !== 'new') {
        this.data = await this.steamIntegrationService.findOne(
          params.namespaceId,
          params.steamIntegrationId,
        );
      }

      this.setupForm();
    });
  }

  public ngOnDestroy() {
    this.updateSteamIntegration$.unsubscribe();
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

    const roles = Object.entries(this.form.get('roles').value).reduce((previous, [k, v]) => {
      if (v) {
        previous.push(k);
      }

      return previous;
    }, []);

    const values: Partial<SteamIntegrationModel> = {
      _id: this.data._id,
      apiKey: this.form.get('apiKey').value,
      applicationId: this.form.get('applicationId').value,
      name: this.form.get('name').value,
      namespaceId: this.namespaceId,
      roles,
    };

    try {
      this.data = await this.upsert(values);
    } catch (e) {
      this.errors = this.formService.handleHttpError(e, {
        apiKey: 'API Key',
        applicationId: 'Application ID',
        namespaceId: 'Namespace',
      });
    }

    this.isSaving = false;
  }

  private setupForm() {
    this.data ??= new SteamIntegrationModel({ apiKey: '', applicationId: 0, name: '' });

    const roles = Object.values(IAuthorization.Role).reduce((previous, current) => {
      previous[current] = this.data.roles?.includes(current);
      return previous;
    }, {});

    this.form = this.formBuilder.group({
      apiKey: this.formBuilder.control(this.data.apiKey, Validators.required),
      applicationId: this.formBuilder.control(this.data.applicationId, Validators.required),
      name: this.formBuilder.control(this.data.name, Validators.required),
      roles: this.formBuilder.group(roles),
    });

    if (!this.isNew) {
      this.form.get('apiKey').disable({ emitEvent: false });
      this.form.get('applicationId').disable({ emitEvent: false });
    }

    if (!this.hasWriteAuthorization) {
      this.form.disable({ emitEvent: false });
    }

    this.form.valueChanges.subscribe(() => (this.errors = []));

    if (this.data._id) {
      this.updateSteamIntegration$ = this.steamIntegrationState
        .selectMany()
        .pipe(map((sis) => sis.filter((si) => si._id === this.data._id)))
        .subscribe((steamIntegrations) => (this.data = steamIntegrations[0]));
    }
  }

  private async upsert(values: Partial<SteamIntegrationModel>) {
    const result = values._id
      ? await this.steamIntegrationService.update(this.namespaceId, values._id, values)
      : await this.steamIntegrationService.create(this.namespaceId, values);

    this.matSnackBar.open(`Steam Integration saved successfully.`);
    this.router.navigate(['../', result._id], { relativeTo: this.activatedRoute });

    return result;
  }
}
