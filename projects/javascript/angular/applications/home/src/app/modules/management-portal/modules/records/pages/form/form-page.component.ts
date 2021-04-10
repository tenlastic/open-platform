import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { MatSnackBar } from '@angular/material';
import { ActivatedRoute, Router } from '@angular/router';
import {
  Collection,
  CollectionService,
  DatabaseService,
  Record,
  RecordService,
} from '@tenlastic/ng-http';

import { environment } from '../../../../../../../environments/environment';
import { BreadcrumbsComponentBreadcrumb } from '../../../../../../shared/components';
import { CamelCaseToTitleCasePipe } from '../../../../../../shared/pipes';
import { Socket, SocketService } from '../../../../../../core/services';

@Component({
  templateUrl: 'form-page.component.html',
  styleUrls: ['./form-page.component.scss'],
})
export class RecordsFormPageComponent implements OnDestroy, OnInit {
  public breadcrumbs: BreadcrumbsComponentBreadcrumb[] = [];
  public collection: Collection;
  public data: Record;
  public errors: string[] = [];
  public form: FormGroup;

  private collectionId: string;
  private databaseId: string;
  private socket: Socket;

  constructor(
    private activatedRoute: ActivatedRoute,
    private collectionService: CollectionService,
    private databaseService: DatabaseService,
    private formBuilder: FormBuilder,
    private matSnackBar: MatSnackBar,
    private recordService: RecordService,
    private router: Router,
    private socketService: SocketService,
  ) {}

  public ngOnInit() {
    this.activatedRoute.paramMap.subscribe(async params => {
      const _id = params.get('_id');
      this.collectionId = params.get('collectionId');
      this.databaseId = params.get('databaseId');

      const url = `${environment.databaseApiBaseUrl}/${this.databaseId}/web-sockets`;
      this.socket = this.socketService.connect(url);
      this.socket.addEventListener('open', () => {
        this.socket.subscribe('collections', Collection, this.collectionService);
        this.socket.subscribe('records', Record, this.recordService, {
          collectionId: this.collectionId,
        });
      });

      this.collection = await this.collectionService.findOne(this.databaseId, this.collectionId);

      if (_id !== 'new') {
        this.data = await this.recordService.findOne(this.databaseId, this.collectionId, _id);
      }

      this.setupForm();

      const database = await this.databaseService.findOne(this.databaseId);
      this.breadcrumbs = [
        { label: 'Databases', link: '../../../../../' },
        { label: database.name, link: '../../../../' },
        { label: 'Collections', link: '../../../' },
        { label: this.collection.name, link: '../../' },
        { label: 'Records', link: '../' },
        { label: this.data._id ? 'Edit Record' : 'Create Record' },
      ];
    });
  }

  public ngOnDestroy() {
    this.socket.close();
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

  public removeArrayItem(key: string, index: number) {
    const formArray = this.form.controls[key] as FormArray;
    formArray.removeAt(index);
  }

  public async save() {
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

    const values = { properties };

    try {
      await this.upsert(values);
    } catch (e) {
      const camelCaseToTitleCasePipe = new CamelCaseToTitleCasePipe();
      const pathMap = Object.keys(this.collection.jsonSchema.properties).reduce(
        (previous, current) => {
          previous[current] = camelCaseToTitleCasePipe.transform(current);
          return previous;
        },
        {},
      );

      this.handleHttpError(e, pathMap);
    }
  }

  private async handleHttpError(err: HttpErrorResponse, pathMap: any) {
    this.errors = err.error.errors.map(e => {
      if (e.name === 'UniquenessError') {
        const combination = e.paths.length > 1 ? 'combination ' : '';
        const paths = e.paths.map(p => pathMap[p]);
        return `${paths.join(' / ')} ${combination}is not unique: ${e.values.join(' / ')}.`;
      } else {
        return e.message;
      }
    });
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
    this.data = this.data || new Record();

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

    Object.keys(arrays).forEach(key => (options[key] = arrays[key]));
    this.form = this.formBuilder.group(options);

    this.form.valueChanges.subscribe(() => (this.errors = []));
  }

  private async upsert(data: Partial<Record>) {
    if (this.data._id) {
      data._id = this.data._id;
      await this.recordService.update(this.databaseId, this.collectionId, data);
    } else {
      await this.recordService.create(this.databaseId, this.collectionId, data);
    }

    this.matSnackBar.open('Record saved successfully.');
    this.router.navigate(['../'], { relativeTo: this.activatedRoute });
  }
}
