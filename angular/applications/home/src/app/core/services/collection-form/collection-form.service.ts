import { Injectable } from '@angular/core';
import { UntypedFormBuilder, Validators } from '@angular/forms';
import { ICollection } from '@tenlastic/http';

export interface CriterionFormGroup {
  field?: string;
  operator?: string;
  reference?: string;
  type?: string;
  value?: CriterionValueFormGroup;
}

export interface CriterionValueFormGroup {
  boolean?: string;
  number?: string;
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
  arrayType?: string;
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

@Injectable({
  providedIn: 'root',
})
export class CollectionFormService {
  constructor(private formBuilder: UntypedFormBuilder) {}

  public getDefaultCriterionFormGroup() {
    return this.formBuilder.group({
      field: [null, Validators.required],
      operator: '$eq',
      reference: null,
      type: 'reference',
      value: this.formBuilder.group({
        boolean: false,
        number: '0',
        string: '',
      }),
    });
  }

  public getDefaultPropertyFormGroup() {
    return this.formBuilder.group({
      arrayType: 'boolean',
      default: false,
      key: ['', [Validators.required, Validators.pattern(/^[0-9A-Za-z\-]{2,40}$/)]],
      required: false,
      type: 'boolean',
    });
  }

  public getDefaultRoleFormGroup() {
    return this.formBuilder.group({
      criteria: this.formBuilder.array([]),
      key: ['', Validators.required],
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

  public getFormGroupFromCriterion(criterion: any) {
    const field = Object.keys(criterion)[0];
    const operator = Object.keys(criterion[field])[0];
    const value = criterion[field][operator];

    const options = { field, operator } as any;

    if (value.$ref) {
      options.reference = value.$ref;
      options.type = 'reference';
    } else {
      const boolean = typeof value === 'boolean' ? value : false;
      const number = typeof value === 'number' ? value.toString() : '0';
      const string = typeof value === 'string' ? value : '';

      options.type = 'value';
      options.value = this.formBuilder.group({ boolean, number, string });
    }

    return this.formBuilder.group(options);
  }

  public getFormGroupFromPermissions(
    permissions: ICollection.Permissions,
    role: ICollection.RolePermissions,
  ) {
    const { name } = role;

    const findCriteria = [];
    if (
      permissions.find &&
      permissions.find[name] &&
      Object.keys(permissions.find[name]).length > 0
    ) {
      const operator = '$and' in permissions.find[name] ? '$and' : '$or';

      permissions.find[name][operator].forEach((criterion) => {
        const formGroup = this.getFormGroupFromCriterion(criterion);
        findCriteria.push(formGroup);
      });
    }

    return this.formBuilder.group({
      create: [permissions.create && permissions.create ? permissions.create[name] : null],
      delete: permissions.delete && permissions.delete ? permissions.delete[name] : false,
      find: this.formBuilder.array(findCriteria),
      read: [permissions.read && permissions.read ? permissions.read[name] : null],
      update: [permissions.update && permissions.update ? permissions.update[name] : null],
    });
  }

  public getFormGroupFromProperty(
    key: string,
    property: ICollection.JsonSchemaProperty,
    required = false,
  ) {
    const type = property.type;

    let arrayType = 'boolean';
    if (type === 'array') {
      arrayType = property.items.type;
    }

    const options = {
      arrayType: this.formBuilder.control(arrayType),
      default: this.formBuilder.control(property.default),
      key: this.formBuilder.control(key),
      required: this.formBuilder.control(required),
      type: this.formBuilder.control(type),
    };

    return this.formBuilder.group(options);
  }

  public getFormGroupFromRole(
    permissions: ICollection.Permissions,
    role: ICollection.RolePermissions,
  ) {
    const options = { key: this.formBuilder.control(role.name) } as any;

    if (Object.keys(role.query).length > 0) {
      const operator = '$and' in role.query ? '$and' : '$or';
      const criteria = role.query[operator].map((criterion) =>
        this.getFormGroupFromCriterion(criterion),
      );

      options.criteria = this.formBuilder.array(criteria);
      options.operator = this.formBuilder.control(operator);
    }

    if (permissions) {
      options.permissions = this.getFormGroupFromPermissions(permissions, role);
    }

    return this.formBuilder.group(options);
  }

  public getJsonFromCriterion(criterion: CriterionFormGroup, properties: PropertyFormGroup[]) {
    let value = { $ref: criterion.reference } as any;

    if (criterion.type === 'value') {
      const propertyType = this.getPropertyType(criterion.field, properties);

      switch (propertyType) {
        case 'boolean':
          value = criterion.value.boolean;
          break;

        case 'number':
          value = parseFloat(criterion.value.number || '0');
          break;

        case 'string':
          value = criterion.value.string;
          break;
      }
    }

    return { [criterion.field]: { [criterion.operator]: value } };
  }

  public getJsonFromProperty(property: PropertyFormGroup): ICollection.JsonSchemaProperty {
    const o = { type: property.type } as any;

    if (o.type === 'array') {
      o.items = { type: property.arrayType };
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

  public getJsonFromRole(
    role: RoleFormGroup,
    properties: PropertyFormGroup[],
  ): ICollection.RolePermissions {
    const criteria = role.criteria.map((c) => this.getJsonFromCriterion(c, properties));
    return { name: role.key, query: { [role.operator]: criteria } };
  }

  public getPermissionsJsonFromRoles(properties: PropertyFormGroup[], roles: RoleFormGroup[]) {
    return roles.reduce(
      (accumulator, role) => {
        accumulator.create[role.key] = role.permissions.create;
        accumulator.delete[role.key] = role.permissions.delete;
        accumulator.read[role.key] = role.permissions.read;
        accumulator.update[role.key] = role.permissions.update;

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

  public getPropertyType(key: string, properties: PropertyFormGroup[]) {
    const property = properties.find((v) => `properties.${v.key}` === key);
    return property ? property.type : 'string';
  }
}
