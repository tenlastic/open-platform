import { TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { Chance } from 'chance';

import { HttpModule } from '../../../../../../http.module';
import { MaterialModule } from '../../../../../../material.module';
import { CollectionsFormPageComponent } from './form-page.component';

const chance = new Chance();
const context = describe;

describe('CollectionsFormPageComponent', () => {
  let service: CollectionsFormPageComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [FormsModule, HttpModule, MaterialModule, ReactiveFormsModule, RouterTestingModule],
      providers: [CollectionsFormPageComponent],
    });

    service = TestBed.inject(CollectionsFormPageComponent);
  });

  describe('getDefaultCriterionFormGroup()', () => {
    it('returns an initialized FormGroup', () => {
      const formGroup = service['getDefaultCriterionFormGroup']();

      expect(formGroup.get('field')).toBeTruthy();
      expect(formGroup.get('operator')).toBeTruthy();
      expect(formGroup.get('reference')).toBeTruthy();
      expect(formGroup.get('type')).toBeTruthy();
      expect(formGroup.get('value.boolean')).toBeTruthy();
      expect(formGroup.get('value.number')).toBeTruthy();
      expect(formGroup.get('value.string')).toBeTruthy();
    });
  });

  describe('getDefaultPropertyFormGroup()', () => {
    it('returns an initialized FormGroup', () => {
      const formGroup = service['getDefaultPropertyFormGroup']();

      expect(formGroup.get('array')).toBeTruthy();
      expect(formGroup.get('default')).toBeTruthy();
      expect(formGroup.get('key')).toBeTruthy();
      expect(formGroup.get('required')).toBeTruthy();
      expect(formGroup.get('type')).toBeTruthy();
    });
  });

  describe('getDefaultRoleFormGroup()', () => {
    it('returns an initialized FormGroup', () => {
      const formGroup = service['getDefaultRoleFormGroup']();

      expect(formGroup.get('criteria')).toBeTruthy();
      expect(formGroup.get('key')).toBeTruthy();
      expect(formGroup.get('operator')).toBeTruthy();
      expect(formGroup.get('permissions.create')).toBeTruthy();
      expect(formGroup.get('permissions.delete')).toBeTruthy();
      expect(formGroup.get('permissions.find')).toBeTruthy();
      expect(formGroup.get('permissions.read')).toBeTruthy();
      expect(formGroup.get('permissions.update')).toBeTruthy();
    });
  });

  describe('getFormGroupFromCriterion()', () => {
    context('when using a reference', () => {
      it('returns an initialized FormGroup', () => {
        const criterion = { username: { $eq: { $ref: 'user.username' } } };
        const formGroup = service['getFormGroupFromCriterion'](criterion);

        expect(formGroup.get('field').value).toEqual('username');
        expect(formGroup.get('operator').value).toEqual('$eq');
        expect(formGroup.get('reference').value).toEqual('user.username');
        expect(formGroup.get('type').value).toEqual('reference');
      });
    });

    context('when using a value', () => {
      it('returns an initialized FormGroup', () => {
        const criterion = { username: { $eq: 'test' } };
        const formGroup = service['getFormGroupFromCriterion'](criterion);

        expect(formGroup.get('field').value).toEqual('username');
        expect(formGroup.get('operator').value).toEqual('$eq');
        expect(formGroup.get('type').value).toEqual('value');
        expect(formGroup.get('value.boolean').value).toEqual(false);
        expect(formGroup.get('value.number').value).toEqual(0);
        expect(formGroup.get('value.string').value).toEqual('test');
      });
    });
  });

  describe('getFormGroupFromPermissions()', () => {
    context('when find permissions exist', () => {
      it('returns an initialized FormGroup', () => {
        const permissions = {
          create: { default: [chance.hash()] },
          delete: { default: true },
          find: { default: { $and: [{ name: { $eq: 'test' } }] } },
          read: { default: [chance.hash()] },
          update: { default: [chance.hash()] },
        };

        const formGroup = service['getFormGroupFromPermissions'](permissions, 'default');

        expect(formGroup.get('create').value).toEqual(permissions.create.default);
        expect(formGroup.get('delete').value).toEqual(permissions.delete.default);
        expect(formGroup.get('find.0.field').value).toEqual('name');
        expect(formGroup.get('find.0.operator').value).toEqual('$eq');
        expect(formGroup.get('find.0.type').value).toEqual('value');
        expect(formGroup.get('find.0.value.string').value).toEqual('test');
        expect(formGroup.get('read').value).toEqual(permissions.read.default);
        expect(formGroup.get('update').value).toEqual(permissions.update.default);
      });
    });

    context('when find permissions do not exist', () => {
      it('returns an initialized FormGroup', () => {
        const permissions = {
          create: { default: [chance.hash()] },
          delete: { default: true },
          read: { default: [chance.hash()] },
          update: { default: [chance.hash()] },
        };

        const formGroup = service['getFormGroupFromPermissions'](permissions, 'default');

        expect(formGroup.get('create').value).toEqual(permissions.create.default);
        expect(formGroup.get('delete').value).toEqual(permissions.delete.default);
        expect(formGroup.get('find').value).toEqual([]);
        expect(formGroup.get('read').value).toEqual(permissions.read.default);
        expect(formGroup.get('update').value).toEqual(permissions.update.default);
      });
    });
  });

  describe('getFormGroupFromProperty()', () => {
    context('when the type is an array', () => {
      it('returns an initialized FormGroup', () => {
        const property = { items: { type: 'number' }, type: 'array' };
        const formGroup = service['getFormGroupFromProperty']('key', property, false);

        expect(formGroup.get('array').value).toEqual('number');
        expect(formGroup.get('default').value).toBeFalsy();
        expect(formGroup.get('key').value).toEqual('key');
        expect(formGroup.get('required').value).toEqual(false);
        expect(formGroup.get('type').value).toEqual('array');
      });
    });

    context('when the type is not an array', () => {
      it('returns an initialized FormGroup', () => {
        const property = { default: 'default', type: 'string' };
        const formGroup = service['getFormGroupFromProperty']('key', property, true);

        expect(formGroup.get('default').value).toEqual('default');
        expect(formGroup.get('key').value).toEqual('key');
        expect(formGroup.get('required').value).toEqual(true);
        expect(formGroup.get('type').value).toEqual('string');
      });
    });
  });

  describe('getFormGroupFromRole()', () => {
    context('when the query is defined', () => {
      it('returns an initialized FormGroup', () => {
        const name = 'default';
        const permissions = null;
        const query = {
          $and: [{ email: { $eq: 'test@example.com' } }, { username: { $eq: 'test' } }],
        };

        const formGroup = service['getFormGroupFromRole'](name, permissions, query);

        expect(formGroup.get('criteria.0.field').value).toEqual('email');
        expect(formGroup.get('criteria.0.operator').value).toEqual('$eq');
        expect(formGroup.get('criteria.1.field').value).toEqual('username');
        expect(formGroup.get('criteria.1.operator').value).toEqual('$eq');
        expect(formGroup.get('key').value).toEqual('default');
        expect(formGroup.get('operator').value).toEqual('$and');
      });
    });

    context('when the query is not defined', () => {
      it('returns an initialized FormGroup', () => {
        const name = 'default';
        const permissions = null;
        const query = {};

        const formGroup = service['getFormGroupFromRole'](name, permissions, query);

        expect(formGroup.get('key').value).toEqual('default');
      });
    });
  });

  describe('getJsonFromCriteria()', () => {
    context('when using a reference', () => {
      it('returns valid JSON', () => {
        const criterion = service['getDefaultCriterionFormGroup']();
        const property = service['getDefaultPropertyFormGroup']();

        criterion.patchValue({ field: 'username', operator: '$eq', reference: 'user.username' });

        const json = service['getJsonFromCriterion'](criterion.value, [property.value]);

        expect(json.username).toEqual({ $eq: { $ref: 'user.username' } });
      });
    });

    context('when using a value', () => {
      context('when the value is a boolean', () => {
        it('returns valid JSON', () => {
          const criterion = service['getDefaultCriterionFormGroup']();
          const property = service['getDefaultPropertyFormGroup']();

          criterion.patchValue({
            field: 'properties.name',
            operator: '$eq',
            type: 'value',
            value: {
              boolean: true,
              number: 0,
              string: '',
            },
          });
          property.patchValue({ key: 'name', type: 'boolean' });

          const json = service['getJsonFromCriterion'](criterion.value, [property.value]);

          expect(json['properties.name']).toEqual({ $eq: true });
        });
      });

      context('when the value is a number', () => {
        it('returns valid JSON', () => {
          const criterion = service['getDefaultCriterionFormGroup']();
          const property = service['getDefaultPropertyFormGroup']();

          criterion.patchValue({
            field: 'properties.age',
            operator: '$eq',
            type: 'value',
            value: {
              boolean: false,
              number: 6,
              string: '',
            },
          });
          property.patchValue({ key: 'age', type: 'number' });

          const json = service['getJsonFromCriterion'](criterion.value, [property.value]);

          expect(json['properties.age']).toEqual({ $eq: 6 });
        });
      });

      context('when the value is a string', () => {
        it('returns valid JSON', () => {
          const criterion = service['getDefaultCriterionFormGroup']();
          const property = service['getDefaultPropertyFormGroup']();

          criterion.patchValue({
            field: 'properties.name',
            operator: '$eq',
            type: 'value',
            value: {
              boolean: false,
              number: 0,
              string: 'test',
            },
          });
          property.patchValue({ key: 'name', type: 'string' });

          const json = service['getJsonFromCriterion'](criterion.value, [property.value]);

          expect(json['properties.name']).toEqual({ $eq: 'test' });
        });
      });
    });
  });

  describe('getJsonFromProperty()', () => {
    context('when the type is an array', () => {
      it('returns valid JSON', () => {
        const property = service['getDefaultPropertyFormGroup']();
        property.patchValue({ array: 'boolean', default: true, key: 'age', type: 'array' });

        const json = service['getJsonFromProperty'](property.value);

        expect(json.default).toBeFalsy();
        expect(json.items.type).toEqual('boolean');
        expect(json.type).toEqual('array');
      });
    });

    context('when the type is a boolean', () => {
      it('returns valid JSON', () => {
        const property = service['getDefaultPropertyFormGroup']();
        property.patchValue({ default: true, key: 'age', type: 'boolean' });

        const json = service['getJsonFromProperty'](property.value);

        expect(json.default).toEqual(true);
        expect(json.type).toEqual('boolean');
      });
    });

    context('when the type is a number', () => {
      it('returns valid JSON', () => {
        const property = service['getDefaultPropertyFormGroup']();
        property.patchValue({ default: 5, key: 'age', type: 'number' });

        const json = service['getJsonFromProperty'](property.value);

        expect(json.default).toEqual(5);
        expect(json.type).toEqual('number');
      });
    });

    context('when the type is a string', () => {
      it('returns valid JSON', () => {
        const property = service['getDefaultPropertyFormGroup']();
        property.patchValue({ default: 'test', key: 'name', type: 'string' });

        const json = service['getJsonFromProperty'](property.value);

        expect(json.default).toEqual('test');
        expect(json.type).toEqual('string');
      });
    });
  });

  describe('getQueryFromRole()', () => {
    it('returns valid JSON', () => {
      const role = { criteria: [], key: 'name', operator: '$and' };

      const json = service['getQueryFromRole'](null, role);

      expect(json).toEqual({ $and: [] });
    });
  });

  describe('getJsonFromRoles()', () => {
    it('returns valid JSON', () => {
      const property = { key: 'name', type: 'string' };
      const role = {
        key: 'default',
        permissions: {
          create: [chance.hash()],
          delete: chance.bool(),
          find: [
            {
              field: 'username',
              operator: '$eq',
              reference: 'user.username',
              type: 'reference',
            },
          ],
          read: [chance.hash()],
          update: [chance.hash()],
        },
      };

      const json = service['getJsonFromRoles']([property], [role]) as any;

      expect(json.create.default).toEqual(role.permissions.create);
      expect(json.delete.default).toEqual(role.permissions.delete);
      expect(json.find.default).toEqual({
        $and: [{ username: { $eq: { $ref: 'user.username' } } }],
      });
      expect(json.read.default).toEqual(role.permissions.read);
      expect(json.update.default).toEqual(role.permissions.update);
    });
  });

  describe('getPropertyType()', () => {
    context('when a matching property is found', () => {
      it('returns the property type', () => {
        const property = service['getDefaultPropertyFormGroup']();
        property.patchValue({ key: 'name', type: 'boolean' });

        const type = service['getPropertyType']('properties.name', [property.value]);

        expect(type).toEqual('boolean');
      });
    });

    context('when a matching property is not found', () => {
      it('returns string', () => {
        const property = service['getDefaultPropertyFormGroup']();
        property.patchValue({ key: 'name', type: 'boolean' });

        const type = service['getPropertyType']('properties.age', [property.value]);

        expect(type).toEqual('string');
      });
    });
  });
});
