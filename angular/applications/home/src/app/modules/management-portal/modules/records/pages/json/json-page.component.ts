import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { CollectionModel, CollectionService, RecordModel, RecordService } from '@tenlastic/ng-http';

import { FormService, TextareaService } from '../../../../../../core/services';
import { jsonValidator } from '../../../../../../shared/validators';

@Component({
  templateUrl: 'json-page.component.html',
  styleUrls: ['./json-page.component.scss'],
})
export class RecordsJsonPageComponent implements OnInit {
  public data: RecordModel;
  public errors: string[] = [];
  public form: FormGroup;

  private collection: CollectionModel;
  private params: Params;

  constructor(
    private activatedRoute: ActivatedRoute,
    private collectionService: CollectionService,
    private formBuilder: FormBuilder,
    private formService: FormService,
    private matSnackBar: MatSnackBar,
    private recordService: RecordService,
    private router: Router,
    private textareaService: TextareaService,
  ) {}

  public ngOnInit() {
    this.activatedRoute.params.subscribe(async (params) => {
      this.params = params;

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

  public navigateToForm() {
    this.formService.navigateToForm(this.form);
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
    const values = JSON.parse(json) as RecordModel;

    values.namespaceId = this.params.namespaceId;

    try {
      await this.upsert(values);
    } catch (e) {
      this.errors = this.formService.handleHttpError(e);
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

    this.data ??= new RecordModel({ properties });

    const keys = ['properties', 'userId'];
    const data = Object.keys(this.data)
      .filter((key) => keys.includes(key))
      .sort()
      .reduce((a, b) => Object.assign(a, { [b]: this.data[b] }), {});

    this.form = this.formBuilder.group({
      json: [JSON.stringify(data, null, 4), [Validators.required, jsonValidator]],
    });

    this.form.valueChanges.subscribe(() => (this.errors = []));
  }

  private async upsert(data: Partial<RecordModel>) {
    let result: RecordModel;

    if (this.data._id) {
      data._id = this.data._id;
      result = await this.recordService.update(
        this.params.namespaceId,
        this.params.collectionId,
        this.data._id,
        data,
      );
    } else {
      result = await this.recordService.create(
        this.params.namespaceId,
        this.params.collectionId,
        data,
      );
    }

    this.matSnackBar.open('Record saved successfully.');
    this.router.navigate(['../../', result._id], { relativeTo: this.activatedRoute });
  }
}
