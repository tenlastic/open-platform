import { Component, OnInit } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
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
  public form: UntypedFormGroup;
  public hasWriteAuthorization: boolean;
  public pending: { [key: string]: Pending[] } = {
    background: [],
    icon: [],
    logo: [],
  };
  public uploadErrors = {
    background: [],
  };

  private params: Params;

  constructor(
    private activatedRoute: ActivatedRoute,
    private authorizationQuery: AuthorizationQuery,
    private formBuilder: UntypedFormBuilder,
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

      const roles = [IAuthorization.Role.StorefrontsReadWrite];
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

  public addUser(formArray: UntypedFormArray) {
    formArray.push(this.formBuilder.control(null, [Validators.required]));
  }

  public getImage(field: string, index = 0) {
    if (this.data[field]) {
      return this.data[field];
    }

    if (this.pending[field] && this.pending[field][index]) {
      return this.pending[field][index].url;
    }

    return null;
  }

  public navigateToJson() {
    this.formService.navigateToJson(this.form);
  }

  public async onFieldChanged($event, field: string) {
    const files: Blob[] = Array.from($event.target.files);
    if (!files.length) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => this.pending[field].push({ file: files[0], url: e.target.result });
    reader.readAsDataURL(files[0]);

    $event.target.value = '';
  }

  public async remove(field: string, index = 0) {
    if (this.data[field]) {
    }

    if (this.pending[field] && this.pending[field][index]) {
      this.pending[field].splice(index);
    }
  }

  public async save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const metadata = this.form.get('metadata').value.reduce((accumulator, property) => {
      accumulator[property.key] = this.getJsonFromProperty(property);
      return accumulator;
    }, {});

    const values: Partial<StorefrontModel> = {
      _id: this.data._id,
      description: this.form.get('description').value,
      metadata,
      namespaceId: this.params.namespaceId,
      subtitle: this.form.get('subtitle').value,
      title: this.form.get('title').value,
    };

    try {
      await this.upsert(values);
    } catch (e) {
      this.errors = this.formService.handleHttpError(e, {
        namespaceId: 'Namespace',
        subtitle: 'Subtitle',
        title: 'Title',
      });
    }
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

  private setupForm(): void {
    this.data = this.data || new StorefrontModel();

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
          key: [key, [Validators.required, Validators.pattern(/^[0-9A-Za-z\-]{2,40}$/)]],
          value: [property, Validators.required],
          type,
        });
        metadata.push(formGroup);
      });
    }

    this.form = this.formBuilder.group({
      description: [this.data.description, Validators.required],
      icon: [this.data.icon],
      metadata: this.formBuilder.array(metadata),
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

    for (const background of this.pending.background) {
      const formData = new FormData();
      formData.append('background', background.file);

      this.data = await this.storefrontService.upload(
        this.params.namespaceId,
        this.data._id,
        'background',
        formData,
      );
    }

    this.matSnackBar.open(`Storefront saved successfully.`);
    this.router.navigate(['../', result._id], { relativeTo: this.activatedRoute });

    return result;
  }
}
