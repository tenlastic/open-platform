import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormArray,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Params, Router } from '@angular/router';
import {
  AuthorizationQuery,
  CollectionModel,
  CollectionService,
  IAuthorization,
  ICollection,
} from '@tenlastic/http';

import { FormService, IdentityService } from '../../../../../../core/services';

export interface CriterionFormGroup {
  field?: string;
  operator?: string;
  reference?: string;
  type?: string;
  value?: CriterionValueFormGroup;
}

export interface CriterionValueFormGroup {
  boolean?: boolean;
  number?: number;
  string?: string;
}

export interface PermissionsFormGroup {
  create?: string[];
  delete?: boolean;
  find?: any;
  read?: string[];
  update?: string[];
}

export interface PropertyFormGroup {
  array?: string;
  default?: any;
  key?: string;
  required?: boolean;
  type?: string;
}

export interface RoleFormGroup {
  criteria?: CriterionFormGroup[];
  key?: string;
  operator?: string;
  permissions?: PermissionsFormGroup;
}

@Component({
  templateUrl: 'form-page.component.html',
  styleUrls: ['./form-page.component.scss'],
})
export class CollectionsFormPageComponent implements OnInit {
  public data: CollectionModel;
  public errors: string[] = [];
  public form: FormGroup;
  public hasWriteAuthorization: boolean;
  public isSaving: boolean;
  public get properties() {
    return this.form.get('properties') as FormArray;
  }
  public get roles() {
    return this.form.get('roles') as FormArray;
  }

  private params: Params;

  constructor(
    private activatedRoute: ActivatedRoute,
    private authorizationQuery: AuthorizationQuery,
    private collectionService: CollectionService,
    private formBuilder: FormBuilder,
    private formService: FormService,
    private identityService: IdentityService,
    private matSnackBar: MatSnackBar,
    private router: Router,
  ) {}

  public ngOnInit() {
    this.activatedRoute.params.subscribe(async (params) => {
      this.params = params;

      const roles = [IAuthorization.Role.CollectionsWrite];
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
    const property = this.getDefaultPropertyFormGroup();
    const formArray = this.form.get('properties') as FormArray;

    formArray.push(property);
  }

  public addRole() {
    const role = this.getDefaultRoleFormGroup();
    const formArray = this.form.get('roles') as FormArray;

    formArray.push(role);
  }

  public moveRoleDown(index: number) {
    const roles = this.form.get('roles') as FormArray;

    if (index >= roles.length - 1) {
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
    this.errors = [];
    this.isSaving = true;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.isSaving = false;
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

    this.isSaving = false;
  }

  private alphabeticalKeysValidator(control: AbstractControl): ValidationErrors {
    const regex = /^[A-Za-z]+$/;
    const valid = regex.test(control.value);

    return valid ? null : { alphabeticalKeys: { value: control.value } };
  }

  private excludeKeysValidator(control: AbstractControl): ValidationErrors {
    const keys = ['default', 'namespace-read', 'namespace-write', 'user-read', 'user-write'];
    const invalid = keys.includes(control.value);

    return invalid ? { excludeKeys: { value: control.value } } : null;
  }

  /**
   * Used for test mocks.
   */
  private getDefaultCriterionFormGroup() {
    const form = this.formBuilder.group({
      field: [null as string, Validators.required],
      operator: '$eq',
      reference: null as string,
      type: 'reference',
      value: this.formBuilder.group({ boolean: false, number: 0, string: '' }),
    });

    form.get('type').valueChanges.subscribe((value) => {
      const reference = form.get('reference');

      if (value === 'reference') {
        reference.addValidators([Validators.required]);
      } else {
        reference.removeValidators([Validators.required]);
      }

      reference.updateValueAndValidity({ emitEvent: false });
    });

    return form;
  }

  private getDefaultPropertyFormGroup() {
    return this.formBuilder.group({
      array: 'boolean',
      default: false as any,
      key: ['', [Validators.required, Validators.pattern(/^[0-9A-Za-z\-]{2,64}$/)]],
      required: false,
      type: 'boolean',
    });
  }

  private getDefaultRoleFormGroup() {
    return this.formBuilder.group({
      criteria: this.formBuilder.array([]),
      key: ['', [this.alphabeticalKeysValidator, this.excludeKeysValidator, Validators.required]],
      operator: '$and',
      permissions: this.formBuilder.group({
        create: [[]],
        delete: false,
        find: this.formBuilder.array([]),
        read: [[]],
        update: [[]],
      }),
    });
  }

  private getFormGroupFromCriterion(criterion: any) {
    const field = Object.keys(criterion)[0];
    const operator = Object.keys(criterion[field])[0];
    const value = criterion[field][operator];

    const options = { field, operator } as any;

    if (value.$ref) {
      options.reference = value.$ref;
      options.type = 'reference';
      options.value = this.formBuilder.group({ boolean: false, number: 0, string: '' });
    } else {
      const boolean = typeof value === 'boolean' ? value : false;
      const number = typeof value === 'number' ? value : 0;
      const string = typeof value === 'string' ? value : '';

      options.reference = null;
      options.type = 'value';
      options.value = this.formBuilder.group({ boolean, number, string });
    }

    const form = this.formBuilder.group(options);

    form.get('type').valueChanges.subscribe((value) => {
      const reference = form.get('reference');

      if (value === 'reference') {
        reference.addValidators([Validators.required]);
      } else {
        reference.removeValidators([Validators.required]);
      }

      reference.updateValueAndValidity({ emitEvent: false });
    });

    return form;
  }

  private getFormGroupFromPermissions(permissions: ICollection.Permissions, role: string) {
    const findCriteria = [];
    if (
      permissions.find &&
      permissions.find[role] &&
      Object.keys(permissions.find[role]).length > 0
    ) {
      const operator = '$and' in permissions.find[role] ? '$and' : '$or';

      permissions.find[role][operator].forEach((criterion) => {
        const formGroup = this.getFormGroupFromCriterion(criterion);
        findCriteria.push(formGroup);
      });
    }

    return this.formBuilder.group({
      create: [permissions.create && permissions.create ? permissions.create[role] : null],
      delete: permissions.delete && permissions.delete ? permissions.delete[role] : false,
      find: this.formBuilder.array(findCriteria),
      read: [permissions.read && permissions.read ? permissions.read[role] : null],
      update: [permissions.update && permissions.update ? permissions.update[role] : null],
    });
  }

  private getFormGroupFromProperty(
    key: string,
    property: ICollection.JsonSchemaProperty,
    required = false,
  ) {
    const type = property.type;

    let array = 'boolean';
    if (type === 'array') {
      array = property.items.type;
    }

    const options = {
      array: this.formBuilder.control(array),
      default: this.formBuilder.control(property.default),
      key: this.formBuilder.control(key),
      required: this.formBuilder.control(required),
      type: this.formBuilder.control(type),
    };

    return this.formBuilder.group(options);
  }

  private getFormGroupFromRole(name: string, permissions: ICollection.Permissions, query: any) {
    const options = {
      key: this.formBuilder.control(name, [
        this.alphabeticalKeysValidator,
        this.excludeKeysValidator,
        Validators.required,
      ]),
    } as any;

    if (Object.keys(query).length > 0) {
      const operator = '$and' in query ? '$and' : '$or';
      const criteria = query[operator].map((criterion) =>
        this.getFormGroupFromCriterion(criterion),
      );

      options.criteria = this.formBuilder.array(criteria);
      options.operator = this.formBuilder.control(operator);
    }

    if (permissions) {
      options.permissions = this.getFormGroupFromPermissions(permissions, name);
    }

    return this.formBuilder.group(options);
  }

  private getJsonFromCriterion(criterion: CriterionFormGroup, properties: PropertyFormGroup[]) {
    let value = { $ref: criterion.reference } as any;

    if (criterion.type === 'value') {
      const propertyType = this.getPropertyType(criterion.field, properties);

      switch (propertyType) {
        case 'boolean':
          value = criterion.value.boolean;
          break;

        case 'number':
          value = criterion.value.number || 0;
          break;

        case 'string':
          value = criterion.value.string;
          break;
      }
    }

    return { [criterion.field]: { [criterion.operator]: value } };
  }

  private getJsonFromProperty(property: PropertyFormGroup): ICollection.JsonSchemaProperty {
    const o = { type: property.type } as any;

    if (o.type === 'array') {
      o.items = { type: property.array };
    }

    switch (property.type) {
      case 'boolean':
        o.default = property.default || false;
        break;

      case 'number':
        o.default = isNaN(parseFloat(property.default)) ? 0 : parseFloat(property.default);
        break;

      case 'string':
        o.default = property.default || '';
        break;
    }

    return o;
  }

  private getJsonFromRoles(properties: PropertyFormGroup[], roles: RoleFormGroup[]) {
    return roles.reduce(
      (accumulator, role) => {
        accumulator.create[role.key] = role.permissions.create || [];
        accumulator.delete[role.key] = role.permissions.delete || false;
        accumulator.read[role.key] = role.permissions.read || [];
        accumulator.update[role.key] = role.permissions.update || [];

        if (role.permissions.find) {
          const criteria = role.permissions.find.map((criterion) => {
            return this.getJsonFromCriterion(criterion, properties);
          });

          accumulator.find[role.key] = criteria.length > 0 ? { $and: criteria } : {};
        }

        return accumulator;
      },
      { create: {}, delete: {}, find: {}, read: {}, update: {} },
    );
  }

  private getJsonSchema() {
    const properties = this.form.get('properties').value.reduce((accumulator, property) => {
      accumulator[property.key] = this.getJsonFromProperty(property);
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
    const permissions = this.getJsonFromRoles(
      this.form.get('properties').value,
      this.form.getRawValue().roles,
    );

    const properties = this.form.get('properties').value;
    const roles = this.form.get('roles').value.reduce((previous, current: RoleFormGroup) => {
      previous[current.key] = this.getQueryFromRole(properties, current);
      return previous;
    }, {});

    return { ...permissions, roles };
  }

  private getPropertyType(key: string, properties: PropertyFormGroup[]) {
    const property = properties.find((v) => `properties.${v.key}` === key);
    return property ? property.type : 'string';
  }

  private getQueryFromRole(properties: PropertyFormGroup[], role: RoleFormGroup) {
    const criteria = role.criteria.map((c) => this.getJsonFromCriterion(c, properties));
    return { [role.operator]: criteria };
  }

  private setupForm() {
    this.data ??= new CollectionModel();

    const properties = [];
    if (this.data.jsonSchema && this.data.jsonSchema.properties) {
      Object.entries(this.data.jsonSchema.properties).forEach(([key, property]) => {
        const required = this.data.jsonSchema.required?.includes(key);

        const formGroup = this.getFormGroupFromProperty(key, property, required);
        properties.push(formGroup);
      });
    }

    if (properties.length === 0) {
      properties.push(this.getDefaultPropertyFormGroup());
    }

    const roles = [];
    if (this.data.permissions?.roles) {
      const { permissions } = this.data;
      Object.entries(this.data.permissions.roles).forEach(([name, query]) => {
        const formGroup = this.getFormGroupFromRole(name, permissions, query);
        roles.push(formGroup);
      });
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
