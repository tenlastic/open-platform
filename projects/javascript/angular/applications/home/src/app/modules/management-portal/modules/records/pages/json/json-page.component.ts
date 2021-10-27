import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import {
  Collection,
  CollectionService,
  DatabaseService,
  Record,
  RecordService,
} from '@tenlastic/ng-http';

import {
  IdentityService,
  SelectedNamespaceService,
  TextareaService,
} from '../../../../../../core/services';
import { BreadcrumbsComponentBreadcrumb } from '../../../../../../shared/components';
import { jsonValidator } from '../../../../../../shared/validators';

@Component({
  templateUrl: 'json-page.component.html',
  styleUrls: ['./json-page.component.scss'],
})
export class RecordsJsonPageComponent implements OnInit {
  public breadcrumbs: BreadcrumbsComponentBreadcrumb[] = [];
  public data: Record;
  public errors: string[] = [];
  public form: FormGroup;

  private collection: Collection;
  private collectionId: string;
  private databaseId: string;

  constructor(
    private activatedRoute: ActivatedRoute,
    private collectionService: CollectionService,
    private databaseService: DatabaseService,
    private formBuilder: FormBuilder,
    public identityService: IdentityService,
    private matSnackBar: MatSnackBar,
    private recordService: RecordService,
    private router: Router,
    private selectedNamespaceService: SelectedNamespaceService,
    private textareaService: TextareaService,
  ) {}

  public ngOnInit() {
    this.activatedRoute.paramMap.subscribe(async (params) => {
      const _id = params.get('_id');
      this.collectionId = params.get('collectionId');
      this.databaseId = params.get('databaseId');

      this.collection = await this.collectionService.findOne(this.databaseId, this.collectionId);
      const database = await this.databaseService.findOne(this.databaseId);
      this.breadcrumbs = [
        { label: 'Databases', link: '../../../../../../' },
        { label: database.name, link: '../../../../../' },
        { label: 'Collections', link: '../../../../' },
        { label: this.collection.name, link: '../../../' },
        { label: 'Records', link: '../../' },
        { label: _id === 'new' ? 'Create Record' : 'Edit Record', link: '../' },
        { label: _id === 'new' ? 'Create Record as JSON' : 'Edit Record as JSON' },
      ];

      if (_id !== 'new') {
        this.data = await this.recordService.findOne(this.databaseId, this.collectionId, _id);
      }

      this.setupForm();
    });
  }

  public onKeyDown(event: any) {
    this.textareaService.onKeyDown(event);
  }

  public onKeyUp(event: any) {
    this.textareaService.onKeyUp(event);
  }

  public async save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const json = this.form.get('json').value;
    const values = JSON.parse(json) as Record;

    values.namespaceId = this.selectedNamespaceService.namespaceId;

    try {
      await this.upsert(values);
    } catch (e) {
      this.handleHttpError(e);
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

  private async handleHttpError(err: HttpErrorResponse) {
    this.errors = err.error.errors.map((e) => {
      if (e.name === 'ValidatorError' && e.kind === 'required') {
        const path = e.path;
        return `${path} is required.`;
      } else if (e.name === 'UniquenessError') {
        const combination = e.paths.length > 1 ? 'combination ' : '';
        return `${e.paths.join(' / ')} ${combination}is not unique: ${e.values.join(' / ')}.`;
      } else {
        return e.message;
      }
    });
  }

  private setupForm(): void {
    const properties = {};
    if (this.collection.jsonSchema && this.collection.jsonSchema.properties) {
      Object.entries(this.collection.jsonSchema.properties).forEach(([key, property]) => {
        const { type } = property as any;
        const value = this.getValue(
          type,
          this.data?.properties && this.data.properties[key] ? this.data.properties[key] : null,
        );

        properties[key] = value;
      }, this);
    }

    this.data ??= new Record({ properties });

    const keys = ['properties'];
    const data = Object.keys(this.data)
      .filter((key) => keys.includes(key))
      .sort()
      .reduce((a, b) => Object.assign(a, { [b]: this.data[b] }), {});

    this.form = this.formBuilder.group({
      json: [JSON.stringify(data, null, 4), [Validators.required, jsonValidator]],
    });

    this.form.valueChanges.subscribe(() => (this.errors = []));
  }

  private async upsert(data: Partial<Record>) {
    let result: Record;

    if (this.data._id) {
      data._id = this.data._id;
      result = await this.recordService.update(this.databaseId, this.collectionId, data);
    } else {
      result = await this.recordService.create(this.databaseId, this.collectionId, data);
    }

    this.matSnackBar.open('Record saved successfully.');
    this.router.navigate([`../../${result._id}`], { relativeTo: this.activatedRoute });
  }
}