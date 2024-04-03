import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Params, Router } from '@angular/router';
import {
  AuthorizationQuery,
  IAuthorization,
  StorefrontModel,
  StorefrontService,
} from '@tenlastic/http';

import { FormService, IdentityService } from '../../../../../../core/services';
import { MediaDialogComponent } from '../../components';

interface Pending {
  file: Blob;
  url: string | ArrayBuffer;
}

interface PropertyFormGroup {
  key?: string;
  type?: string;
  value?: any;
}

@Component({
  templateUrl: 'form-page.component.html',
  styleUrls: ['./form-page.component.scss'],
})
export class StorefrontsFormPageComponent implements OnInit {
  public data: StorefrontModel;
  public errors: string[] = [];
  public form: FormGroup;
  public hasWriteAuthorization: boolean;
  public isSaving: boolean;

  private params: Params;

  constructor(
    private activatedRoute: ActivatedRoute,
    private authorizationQuery: AuthorizationQuery,
    private formBuilder: FormBuilder,
    private formService: FormService,
    private identityService: IdentityService,
    private matDialog: MatDialog,
    private matSnackBar: MatSnackBar,
    private router: Router,
    private storefrontService: StorefrontService,
  ) {}

  public async ngOnInit() {
    this.activatedRoute.params.subscribe(async (params) => {
      this.params = params;

      const roles = [IAuthorization.Role.StorefrontsWrite];
      const userId = this.identityService.user?._id;
      this.hasWriteAuthorization =
        this.authorizationQuery.hasRoles(null, roles, userId) ||
        this.authorizationQuery.hasRoles(params.namespaceId, roles, userId);

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
      namespaceId: this.params.namespaceId,
      roles,
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

  public view(src: string, type: string = 'image') {
    this.matDialog.open(MediaDialogComponent, { autoFocus: false, data: { src, type } });
  }

  private getJsonFromProperty(property: PropertyFormGroup): any {
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

    const metadata = [];
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
          value: [property, Validators.required],
          type,
        });
        metadata.push(formGroup);
      });
    }

    const roles = Object.values(IAuthorization.Role).reduce((previous, current) => {
      previous[current] = this.data.roles?.includes(current) ?? false;
      return previous;
    }, {});

    this.form = this.formBuilder.group({
      description: [this.data.description],
      icon: [this.data.icon],
      metadata: this.formBuilder.array(metadata),
      roles: this.formBuilder.group(roles),
      subtitle: [this.data.subtitle],
      title: [this.data.title, Validators.required],
    });

    if (!this.hasWriteAuthorization) {
      this.form.disable({ emitEvent: false });
    }

    this.form.valueChanges.subscribe(() => (this.errors = []));
  }

  private async upsert(values: Partial<StorefrontModel>) {
    const result = values._id
      ? await this.storefrontService.update(this.params.namespaceId, values._id, values)
      : await this.storefrontService.create(this.params.namespaceId, values);

    this.matSnackBar.open(`Storefront saved successfully.`);
    this.router.navigate(['../', 'storefront'], { relativeTo: this.activatedRoute });

    return result;
  }
}
