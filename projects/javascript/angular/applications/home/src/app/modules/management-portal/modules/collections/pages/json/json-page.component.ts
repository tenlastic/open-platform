import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { Collection, CollectionService, DatabaseService } from '@tenlastic/ng-http';

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
export class CollectionsJsonPageComponent implements OnInit {
  public breadcrumbs: BreadcrumbsComponentBreadcrumb[] = [];
  public data: Collection;
  public errors: string[] = [];
  public form: FormGroup;

  private databaseId: string;

  constructor(
    private activatedRoute: ActivatedRoute,
    private collectionService: CollectionService,
    private databaseService: DatabaseService,
    private formBuilder: FormBuilder,
    public identityService: IdentityService,
    private matSnackBar: MatSnackBar,
    private router: Router,
    private selectedNamespaceService: SelectedNamespaceService,
    private textareaService: TextareaService,
  ) {}

  public ngOnInit() {
    this.activatedRoute.paramMap.subscribe(async (params) => {
      const _id = params.get('_id');
      this.databaseId = params.get('databaseId');

      const database = await this.databaseService.findOne(this.databaseId);
      this.breadcrumbs = [
        { label: 'Databases', link: '../../../../' },
        { label: database.name, link: '../../../' },
        { label: 'Collections', link: '../../' },
        { label: _id === 'new' ? 'Create Collection' : 'Edit Collection', link: '../' },
        { label: _id === 'new' ? 'Create Collection as JSON' : 'Edit Collection as JSON' },
      ];

      if (_id !== 'new') {
        this.data = await this.collectionService.findOne(this.databaseId, _id);
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
    const values = JSON.parse(json) as Collection;

    values.databaseId = this.databaseId;
    values.namespaceId = this.selectedNamespaceService.namespaceId;

    try {
      await this.upsert(values);
    } catch (e) {
      this.handleHttpError(e);
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

    const keys = ['jsonSchema', 'name', 'permissions'];
    const data = Object.keys(this.data)
      .filter((key) => keys.includes(key))
      .sort()
      .reduce((a, b) => Object.assign(a, { [b]: this.data[b] }), {});

    this.form = this.formBuilder.group({
      json: [JSON.stringify(data, null, 4), [Validators.required, jsonValidator]],
    });

    this.form.valueChanges.subscribe(() => (this.errors = []));
  }

  private async upsert(data: Partial<Collection>) {
    let result: Collection;

    if (this.data._id) {
      data._id = this.data._id;
      result = await this.collectionService.update(this.databaseId, data);
    } else {
      result = await this.collectionService.create(this.databaseId, data);
    }

    this.matSnackBar.open('Collection saved successfully.');
    this.router.navigate([`../../${result._id}`], { relativeTo: this.activatedRoute });
  }
}
