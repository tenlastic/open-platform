import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Params, Router } from '@angular/router';
import {
  AuthorizationQuery,
  CollectionModel,
  CollectionService,
  IAuthorization,
  RecordModel,
  RecordService,
} from '@tenlastic/http';

import { FormService, IdentityService } from '../../../../../../core/services';
import { CamelCaseToTitleCasePipe } from '../../../../../../shared/pipes';

@Component({
  templateUrl: 'form-page.component.html',
  styleUrls: ['./form-page.component.scss'],
})
export class RecordsFormPageComponent implements OnInit {
  public collection: CollectionModel;
  public data: RecordModel;
  public errors: string[] = [];
  public form: FormGroup;
  public hasWriteAuthorization: boolean;

  private params: Params;

  constructor(
    private activatedRoute: ActivatedRoute,
    private authorizationQuery: AuthorizationQuery,
    private collectionService: CollectionService,
    private formBuilder: FormBuilder,
    private formService: FormService,
    private identityService: IdentityService,
    private matSnackBar: MatSnackBar,
    private recordService: RecordService,
    private router: Router,
  ) {}

  public ngOnInit() {
    this.activatedRoute.params.subscribe(async (params) => {
      this.params = params;

      const roles = [IAuthorization.Role.RecordsReadWrite];
      const userId = this.identityService.user?._id;
      this.hasWriteAuthorization =
        this.authorizationQuery.hasRoles(null, roles, userId) ||
        this.authorizationQuery.hasRoles(params.namespaceId, roles, userId);

      this.collection = await this.collectionService.findOne(
        params.namespaceId,
        params.collectionId,
      );

      if (params.recordId !== 'new') {
        this.data = await this.recordService.findOne(
          params.namespaceId,
          params.collectionId,
          params.recordId,
        );
      }

      this.setupForm();
    });
  }

  public addArrayItem(key: string) {
    const formArray = this.form.controls[key] as FormArray;

    switch (this.collection.jsonSchema.properties[key].items.type) {
      case 'boolean':
        formArray.push(this.formBuilder.control(false));
        break;

      case 'number':
        formArray.push(this.formBuilder.control(0));
        break;

      case 'string':
        formArray.push(this.formBuilder.control(''));
        break;
    }
  }

  public navigateToJson() {
    this.formService.navigateToJson(this.form);
  }

  public removeArrayItem(key: string, index: number) {
    const formArray = this.form.controls[key] as FormArray;
    formArray.removeAt(index);
  }

  public async save() {
    this.errors = [];

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const properties = Object.entries(this.collection.jsonSchema.properties).reduce(
      (accumulator, [key, options]) => {
        const { type } = options as any;
        accumulator[key] = this.getValue(type, this.form.get(key).value);

        return accumulator;
      },
      {},
    );

    const values = { _id: this.data._id, properties };

    try {
      await this.upsert(values);
    } catch (e) {
      const camelCaseToTitleCasePipe = new CamelCaseToTitleCasePipe();
      const pathMap = Object.keys(this.collection.jsonSchema.properties).reduce(
        (previous, current) => {
          previous[`properties.${current}`] = camelCaseToTitleCasePipe.transform(current);
          return previous;
        },
        {},
      );

      this.errors = this.formService.handleHttpError(e, { ...pathMap, userId: 'User ID' });
    }
  }

  private getValue(type: string, value: any) {
    switch (type) {
      case 'array':
        return value ? value : [];

      case 'boolean':
        return value ? value : false;

      case 'number':
        return value ? value : 0;

      case 'string':
        return value ? value : '';
    }
  }

  private setupForm(): void {
    this.data = this.data || new RecordModel();

    const arrays = {};
    const options = {};

    if (this.collection.jsonSchema && this.collection.jsonSchema.properties) {
      Object.entries(this.collection.jsonSchema.properties).forEach(([key, property]) => {
        const { required } = this.collection.jsonSchema;
        const { properties } = this.data;
        const { type } = property as any;

        const value = this.getValue(type, properties && properties[key] ? properties[key] : null);

        const validators = [];
        if (required && required.includes(key)) {
          validators.push(Validators.required);
        }

        if (property.type === 'array') {
          arrays[key] = this.formBuilder.array(
            properties && properties[key] ? properties[key] : [],
          );
        } else {
          options[key] = this.formBuilder.control(value, validators);
        }
      }, this);
    }

    Object.keys(arrays).forEach((key) => (options[key] = arrays[key]));
    this.form = this.formBuilder.group(options);

    if (!this.hasWriteAuthorization) {
      this.form.disable({ emitEvent: false });
    }

    this.form.valueChanges.subscribe(() => (this.errors = []));
  }

  private async upsert(values: Partial<RecordModel>) {
    const { collectionId, namespaceId } = this.params;
    const result = values._id
      ? await this.recordService.update(namespaceId, collectionId, values._id, values)
      : await this.recordService.create(namespaceId, collectionId, values);

    this.matSnackBar.open('Record saved successfully.');
    this.router.navigate(['../', result._id], { relativeTo: this.activatedRoute });
  }
}
