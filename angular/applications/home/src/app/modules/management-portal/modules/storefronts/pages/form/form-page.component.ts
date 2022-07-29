import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Params, Router } from '@angular/router';
import {
  AuthorizationQuery,
  IAuthorization,
  IStorefront,
  Storefront,
  StorefrontService,
} from '@tenlastic/ng-http';

import { FormService, IdentityService } from '../../../../../../core/services';
import { MediaDialogComponent } from '../../components';

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
  public accesses = [
    { label: 'Private', value: 'private' },
    { label: 'Public w/ Authorization', value: 'private-public' },
    { label: 'Public', value: 'public' },
  ];
  public data: Storefront;
  public errors: string[] = [];
  public form: FormGroup;
  public hasWriteAuthorization: boolean;
  public pending = {
    background: [],
    icon: [],
    images: [],
    videos: [],
  };
  public uploadErrors = {
    background: [],
    icon: [],
    images: [],
    videos: [],
  };

  private params: Params;

  constructor(
    private activatedRoute: ActivatedRoute,
    private authorizationQuery: AuthorizationQuery,
    private formBuilder: FormBuilder,
    private formService: FormService,
    private identityService: IdentityService,
    private matDialog: MatDialog,
    private storefrontService: StorefrontService,
  ) {}

  public async ngOnInit() {
    this.activatedRoute.params.subscribe(async (params) => {
      this.params = params;

      const roles = [IAuthorization.AuthorizationRole.StorefrontsReadWrite];
      const userId = this.identityService.user?._id;
      this.hasWriteAuthorization =
        this.authorizationQuery.hasRoles(null, roles, userId) ||
        this.authorizationQuery.hasRoles(params.namespaceId, roles, userId);

      const storefronts = await this.storefrontService.find({
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
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const metadata = this.form.get('metadata').value.reduce((accumulator, property) => {
      accumulator[property.key] = this.getJsonFromProperty(property);
      return accumulator;
    }, {});

    const values: Partial<Storefront> = {
      _id: this.data._id,
      access: this.form.get('access').value,
      description: this.form.get('description').value,
      metadata,
      namespaceId: this.params.namespaceId,
      subtitle: this.form.get('subtitle').value,
      title: this.form.get('title').value,
    };

    try {
      this.data = await this.formService.upsert(this.storefrontService, values, {
        addIdToPath: false,
        path: './',
      });
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
    this.data = this.data || new Storefront();

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
      access: [this.data.access || IStorefront.Access.Private],
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
}
