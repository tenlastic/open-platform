import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { CollectionService, RecordService } from '@app/core/http';
import { Collection, Record } from '@app/shared/models';

@Component({
  templateUrl: 'form-page.component.html',
  styleUrls: ['./form-page.component.scss'],
})
export class RecordsFormPageComponent implements OnInit {
  public collection: Collection;
  public error: string;
  public form: FormGroup;

  private data: Record;

  constructor(
    private activatedRouter: ActivatedRoute,
    private collectionService: CollectionService,
    private formBuilder: FormBuilder,
    private recordService: RecordService,
  ) {}

  public ngOnInit() {
    this.activatedRouter.paramMap.subscribe(async params => {
      const _id = params.get('_id');
      const collectionId = params.get('collectionId');
      const databaseId = params.get('databaseId');

      this.collection = await this.collectionService.findOne(databaseId, collectionId);

      if (_id !== 'new') {
        this.data = await this.recordService.findOne(databaseId, collectionId, _id);
      }

      this.setupForm();
    });
  }

  public async save() {
    if (this.form.invalid) {
      this.form.get('name').markAsTouched();

      return;
    }

    const properties = Object.entries(this.collection.jsonSchema.properties).reduce(
      (accumulator, [key, options]) => {
        const { type } = options as any;

        let value = this.form.get(key).value;
        switch (type) {
          case 'boolean':
            value = value ? value : false;
            break;

          case 'number':
            value = value ? parseFloat(value) : 0;
            break;

          case 'string':
            value = value ? value : '';
            break;
        }

        accumulator[key] = value;

        return accumulator;
      },
      {},
    ) as any;

    const values = {
      collectionId: this.collection._id,
      databaseId: this.collection.databaseId,
      properties,
    };

    if (this.data._id) {
      this.update(values);
    } else {
      this.create(values);
    }
  }

  private async create(data: Partial<Record>) {
    try {
      await this.recordService.create(data);
    } catch (e) {
      this.error = 'That name is already taken.';
    }
  }

  private setupForm(): void {
    this.data = this.data || new Record();

    const options = {};
    if (this.collection.jsonSchema && this.collection.jsonSchema.properties) {
      Object.entries(this.collection.jsonSchema.properties).forEach(([key, property]) => {
        const { properties } = this.data;
        const { type } = property as any;

        let value = null;
        switch (type) {
          case 'boolean':
            value = properties && properties[key] ? properties[key] : false;
            break;

          case 'number':
            value = properties && properties[key] ? properties[key].toString() : '0';
            break;

          case 'string':
            value = properties && properties[key] ? properties[key] : '';
            break;
        }

        options[key] = this.formBuilder.control(value);
      }, this);
    }

    this.form = this.formBuilder.group(options);

    this.form.valueChanges.subscribe(() => (this.error = null));
  }

  private async update(data: Partial<Record>) {
    data._id = this.data._id;

    try {
      await this.recordService.update(data);
    } catch (e) {
      this.error = 'That name is already taken.';
    }
  }
}
