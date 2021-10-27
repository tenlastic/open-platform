import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { Collection, CollectionService, DatabaseService } from '@tenlastic/ng-http';

import {
  CollectionFormService,
  IdentityService,
  SelectedNamespaceService,
} from '../../../../../../core/services';
import { BreadcrumbsComponentBreadcrumb } from '../../../../../../shared/components';

@Component({
  templateUrl: 'form-page.component.html',
  styleUrls: ['./form-page.component.scss'],
})
export class CollectionsFormPageComponent implements OnInit {
  public breadcrumbs: BreadcrumbsComponentBreadcrumb[] = [];
  public data: Collection;
  public errors: string[] = [];
  public form: FormGroup;

  private databaseId: string;

  constructor(
    private activatedRoute: ActivatedRoute,
    private collectionService: CollectionService,
    private collectionFormService: CollectionFormService,
    private databaseService: DatabaseService,
    private formBuilder: FormBuilder,
    public identityService: IdentityService,
    private matSnackBar: MatSnackBar,
    private router: Router,
    private selectedNamespaceService: SelectedNamespaceService,
  ) {}

  public ngOnInit() {
    this.activatedRoute.paramMap.subscribe(async (params) => {
      const _id = params.get('_id');
      this.databaseId = params.get('databaseId');

      const database = await this.databaseService.findOne(this.databaseId);
      this.breadcrumbs = [
        { label: 'Databases', link: '../../../' },
        { label: database.name, link: '../../' },
        { label: 'Collections', link: '../' },
        { label: _id === 'new' ? 'Create Collection' : 'Edit Collection' },
      ];

      if (_id !== 'new') {
        this.data = await this.collectionService.findOne(this.databaseId, _id);
      }

      this.setupForm();
    });
  }

  public addProperty() {
    const property = this.collectionFormService.getDefaultPropertyFormGroup();
    const formArray = this.form.get('properties') as FormArray;

    formArray.push(property);
  }

  public addRole() {
    const role = this.collectionFormService.getDefaultRoleFormGroup();
    const formArray = this.form.get('roles') as FormArray;

    formArray.insert(formArray.length - 1, role);
  }

  public moveRoleDown(index: number) {
    const roles = this.form.get('roles') as FormArray;

    if (index >= roles.length - 2) {
      return;
    }

    const role = roles.at(index);

    roles.removeAt(index);
    roles.insert(index + 1, role);
  }

  public moveRoleUp(index: number) {
    if (index === 0) {
      return;
    }

    const roles = this.form.get('roles') as FormArray;
    const role = roles.at(index);

    roles.removeAt(index);
    roles.insert(index - 1, role);
  }

  public removeProperty(index: number) {
    const formArray = this.form.get('properties') as FormArray;
    formArray.removeAt(index);
  }

  public removeRole(index: number) {
    const formArray = this.form.get('roles') as FormArray;
    formArray.removeAt(index);
  }

  public async save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const jsonSchema = this.getJsonSchema();
    const permissions = this.getPermissions();

    const values: Partial<Collection> = {
      jsonSchema,
      name: this.form.get('name').value,
      namespaceId: this.selectedNamespaceService.namespaceId,
      permissions,
    };

    try {
      await this.upsert(values);
    } catch (e) {
      this.handleHttpError(e, { name: 'Name', namespaceId: 'Namespace' });
    }
  }

  private getJsonSchema() {
    const properties = this.form.get('properties').value.reduce((accumulator, property) => {
      accumulator[property.key] = this.collectionFormService.getJsonFromProperty(property);
      return accumulator;
    }, {});

    const required = this.form
      .get('properties')
      .value.filter((p) => p.required)
      .map((p) => p.key);

    const jsonSchema = { properties, type: 'object' } as any;
    if (required.length > 0) {
      jsonSchema.required = required;
    }

    return jsonSchema;
  }

  private getPermissions() {
    const permissions = this.collectionFormService.getPermissionsJsonFromRoles(
      this.form.get('properties').value,
      this.form.getRawValue().roles,
    );

    const roles = this.form.getRawValue().roles.map((role) => {
      return this.collectionFormService.getJsonFromRole(role, this.form.get('properties').value);
    });

    return { ...permissions, roles };
  }

  private async handleHttpError(err: HttpErrorResponse, pathMap: any) {
    this.errors = err.error.errors.map((e) => {
      if (e.name === 'UniquenessError') {
        const combination = e.paths.length > 1 ? 'combination ' : '';
        const paths = e.paths.map((p) => pathMap[p]);
        return `${paths.join(' / ')} ${combination}is not unique: ${e.values.join(' / ')}.`;
      } else {
        return e.message;
      }
    });
  }

  private setupForm(): void {
    this.data = this.data || new Collection();

    const properties = [];
    if (this.data.jsonSchema && this.data.jsonSchema.properties) {
      Object.entries(this.data.jsonSchema.properties).forEach(([key, property]) => {
        const required =
          this.data.jsonSchema.required && this.data.jsonSchema.required.includes(key);

        const formGroup = this.collectionFormService.getFormGroupFromProperty(
          key,
          property,
          required,
        );
        properties.push(formGroup);
      });
    }

    if (properties.length === 0) {
      properties.push(this.collectionFormService.getDefaultPropertyFormGroup());
    }

    const roles = [];
    if (
      this.data.permissions &&
      this.data.permissions.roles &&
      this.data.permissions.roles.length > 0
    ) {
      this.data.permissions.roles.forEach((role) => {
        const formGroup = this.collectionFormService.getFormGroupFromRole(
          this.data.permissions,
          role,
        );
        roles.push(formGroup);
      });
    }

    if (roles.length === 0) {
      const role = this.collectionFormService.getDefaultRoleFormGroup();
      role.patchValue({ key: 'default' });

      roles.push(role);
    }

    this.form = this.formBuilder.group({
      name: [this.data.name, Validators.required],
      properties: this.formBuilder.array(properties),
      roles: this.formBuilder.array(roles),
    });

    const formArray = this.form.get('roles') as FormArray;
    const defaultRole = formArray.at(formArray.length - 1);
    defaultRole.get('key').disable();

    this.form.valueChanges.subscribe(() => (this.errors = []));
  }

  private async upsert(data: Partial<Collection>) {
    if (this.data._id) {
      data._id = this.data._id;
      await this.collectionService.update(this.databaseId, data);
    } else {
      await this.collectionService.create(this.databaseId, data);
    }

    this.matSnackBar.open('Collection saved successfully.');
    this.router.navigate(['../'], { relativeTo: this.activatedRoute });
  }
}
