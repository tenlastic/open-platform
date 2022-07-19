import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Params } from '@angular/router';
import { Collection, CollectionService } from '@tenlastic/ng-http';

import { FormService, TextareaService } from '../../../../../../core/services';
import { jsonValidator } from '../../../../../../shared/validators';

@Component({
  templateUrl: 'json-page.component.html',
  styleUrls: ['./json-page.component.scss'],
})
export class CollectionsJsonPageComponent implements OnInit {
  public data: Collection;
  public errors: string[] = [];
  public form: FormGroup;

  private params: Params;

  constructor(
    private activatedRoute: ActivatedRoute,
    private collectionService: CollectionService,
    private formBuilder: FormBuilder,
    private formService: FormService,
    private textareaService: TextareaService,
  ) {}

  public ngOnInit() {
    this.activatedRoute.params.subscribe(async (params) => {
      this.params = params;

      if (params.buildId !== 'new') {
        this.data = await this.collectionService.findOne(params.buildId);
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
    const values = JSON.parse(json) as Collection;

    values._id = this.data._id;
    values.namespaceId = this.params.namespaceId;

    try {
      this.data = await this.formService.upsert(this.collectionService, values);
    } catch (e) {
      this.errors = this.formService.handleHttpError(e);
    }
  }

  private setupForm(): void {
    this.data ??= new Collection({
      jsonSchema: { properties: {}, type: 'object' },
      name: '',
      permissions: [
        {
          create: { default: [] },
          delete: { default: false },
          find: { default: null },
          read: { default: [] },
          roles: [{ name: 'default', query: { $and: [] } }],
          update: { default: [] },
        },
      ],
    });

    const keys = ['indexes', 'jsonSchema', 'name', 'permissions'];
    const data = Object.keys(this.data)
      .filter((key) => keys.includes(key))
      .sort()
      .reduce((a, b) => Object.assign(a, { [b]: this.data[b] }), {});

    this.form = this.formBuilder.group({
      json: [JSON.stringify(data, null, 4), [Validators.required, jsonValidator]],
    });

    this.form.valueChanges.subscribe(() => (this.errors = []));
  }
}
