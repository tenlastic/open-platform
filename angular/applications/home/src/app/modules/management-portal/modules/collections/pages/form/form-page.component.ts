import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Params, Router } from '@angular/router';
import {
  AuthorizationQuery,
  CollectionModel,
  CollectionService,
  IAuthorization,
} from '@tenlastic/ng-http';

import {
  CollectionFormService,
  FormService,
  IdentityService,
} from '../../../../../../core/services';

@Component({
  templateUrl: 'form-page.component.html',
  styleUrls: ['./form-page.component.scss'],
})
export class CollectionsFormPageComponent implements OnInit {
  public data: CollectionModel;
  public errors: string[] = [];
  public form: FormGroup;
  public hasWriteAuthorization: boolean;

  private params: Params;

  constructor(
    private activatedRoute: ActivatedRoute,
    private authorizationQuery: AuthorizationQuery,
    private collectionService: CollectionService,
    private collectionFormService: CollectionFormService,
    private formBuilder: FormBuilder,
    private formService: FormService,
    private identityService: IdentityService,
    private matSnackBar: MatSnackBar,
    private router: Router,
  ) {}

  public ngOnInit() {
    this.activatedRoute.params.subscribe(async (params) => {
      this.params = params;

      const roles = [IAuthorization.Role.CollectionsReadWrite];
      const userId = this.identityService.user?._id;
      this.hasWriteAuthorization =
        this.authorizationQuery.hasRoles(null, roles, userId) ||
        this.authorizationQuery.hasRoles(params.namespaceId, roles, userId);

      if (params.collectionId !== 'new') {
        this.data = await this.collectionService.findOne(params.namespaceId, params.collectionId);
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

  public navigateToJson() {
    this.formService.navigateToJson(this.form);
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

    const values: Partial<CollectionModel> = {
      _id: this.data._id,
      jsonSchema,
      name: this.form.get('name').value,
      namespaceId: this.params.namespaceId,
      permissions,
    };

    try {
      this.data = await this.upsert(values);
    } catch (e) {
      this.errors = this.formService.handleHttpError(e, { name: 'Name', namespaceId: 'Namespace' });
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

  private setupForm(): void {
    this.data = this.data || new CollectionModel();

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

    if (!this.hasWriteAuthorization) {
      this.form.disable({ emitEvent: false });
    }

    this.form.valueChanges.subscribe(() => (this.errors = []));

    const formArray = this.form.get('roles') as FormArray;
    const defaultRole = formArray.at(formArray.length - 1);
    defaultRole.get('key').disable();
  }

  private async upsert(values: Partial<CollectionModel>) {
    const result = values._id
      ? await this.collectionService.update(this.params.namespaceId, values._id, values)
      : await this.collectionService.create(this.params.namespaceId, values);

    this.matSnackBar.open(`Collection saved successfully.`);
    this.router.navigate(['../', result._id], { relativeTo: this.activatedRoute });

    return result;
  }
}
