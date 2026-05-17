import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import {
  AuthorizationState,
  IAuthorization,
  StorefrontModel,
  StorefrontService,
} from '@tenlastic/http';

import { FormService, IdentityService } from '@home/app/core/services';
import { MetadataForm, RolesForm } from '@home/app/shared/components';

export interface StorefrontForm {
  description: FormControl<string>;
  icon: FormControl<string>;
  metadata: FormArray<FormGroup<MetadataForm>>;
  roles: FormGroup<RolesForm>;
  showGameServers: FormControl<boolean>;
  showQueues: FormControl<boolean>;
  subtitle: FormControl<string>;
  title: FormControl<string>;
}

interface PropertyFormGroup {
  key?: string;
  type?: string;
  value?: any;
}

@Component({
  standalone: false,
  styleUrls: ['./form-page.component.scss'],
  templateUrl: 'form-page.component.html',
})
export class StorefrontsFormPageComponent implements OnInit {
  public data: StorefrontModel;
  public errors: string[] = [];
  public form: FormGroup<StorefrontForm>;
  public hasWriteAuthorization: boolean;
  public isSaving: boolean;

  private namespaceId: string;

  constructor(
    private activatedRoute: ActivatedRoute,
    private authorizationState: AuthorizationState,
    private formBuilder: FormBuilder,
    private formService: FormService,
    private identityService: IdentityService,
    private matSnackBar: MatSnackBar,
    private router: Router,
    private storefrontService: StorefrontService,
  ) {}

  public async ngOnInit() {
    this.activatedRoute.params.subscribe(async (params) => {
      this.namespaceId = params.namespaceId;

      const roles = [IAuthorization.Role.StorefrontsWrite];
      const userId = this.identityService.user?._id;
      this.hasWriteAuthorization =
        this.authorizationState.hasRoles(null, roles, userId) ||
        this.authorizationState.hasRoles(params.namespaceId, roles, userId);

      const storefronts = await this.storefrontService.find(params.namespaceId, {
        limit: 1,
        where: { namespaceId: params.namespaceId },
      });
      this.data = storefronts[0];

      this.setupForm();
    });
  }

  public addUser(formArray: FormArray) {
    formArray.push(this.formBuilder.control(null, [Validators.required]));
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

    const metadata = this.form.get('metadata').value.reduce((accumulator, property) => {
      accumulator[property.key] = this.getJsonFromProperty(property);
      return accumulator;
    }, {});
    const roles = Object.entries(this.form.get('roles').value).reduce((previous, [k, v]) => {
      if (v) {
        previous.push(k);
      }

      return previous;
    }, []);

    const values: Partial<StorefrontModel> = {
      _id: this.data._id,
      description: this.form.get('description').value,
      metadata,
      namespaceId: this.namespaceId,
      roles,
      showGameServers: this.form.get('showGameServers').value,
      showQueues: this.form.get('showQueues').value,
      subtitle: this.form.get('subtitle').value,
      title: this.form.get('title').value,
    };

    try {
      this.data = await this.upsert(values);
    } catch (e) {
      this.errors = this.formService.handleHttpError(e, {
        namespaceId: 'Namespace',
        subtitle: 'Subtitle',
        title: 'Title',
      });
    }

    this.isSaving = false;
  }

  private getJsonFromProperty(property: PropertyFormGroup) {
    switch (property.type) {
      case 'boolean':
        return property.value || false;

      case 'number':
        return isNaN(parseFloat(property.value)) ? 0 : parseFloat(property.value);

      default:
        return property.value || '';
    }
  }

  private setupForm() {
    this.data ??= new StorefrontModel();

    const metadata: FormGroup<MetadataForm>[] = [];
    if (this.data.metadata) {
      Object.entries(this.data.metadata).forEach(([key, property]) => {
        let type = 'boolean';
        if (typeof property === 'string' || property instanceof String) {
          type = 'string';
        } else if (typeof property === 'number') {
          type = 'number';
        }

        const formGroup = this.formBuilder.group({
          key: [key, [Validators.required, Validators.pattern(/^[0-9A-Za-z\-]{2,64}$/)]],
          type,
          value: [property, Validators.required],
        });
        metadata.push(formGroup);
      });
    }

    const roles = Object.values(IAuthorization.Role).reduce((previous, current) => {
      previous[current] = this.data.roles?.includes(current) ?? false;
      return previous;
    }, {});

    this.form = this.formBuilder.group({
      description: this.formBuilder.control(this.data.description),
      icon: this.formBuilder.control(this.data.icon),
      metadata: this.formBuilder.array(metadata),
      roles: this.formBuilder.group(roles),
      showGameServers: this.formBuilder.control(this.data.showGameServers || false),
      showQueues: this.formBuilder.control(this.data.showQueues || false),
      subtitle: this.formBuilder.control(this.data.subtitle),
      title: this.formBuilder.control(this.data.title, Validators.required),
    });

    if (!this.hasWriteAuthorization) {
      this.form.disable({ emitEvent: false });
    }

    this.form.valueChanges.subscribe(() => (this.errors = []));
  }

  private async upsert(values: Partial<StorefrontModel>) {
    const result = values._id
      ? await this.storefrontService.update(this.namespaceId, values._id, values)
      : await this.storefrontService.create(this.namespaceId, values);

    this.matSnackBar.open(`Storefront saved successfully.`);
    this.router.navigate(['../', 'storefront'], { relativeTo: this.activatedRoute });

    return result;
  }
}
