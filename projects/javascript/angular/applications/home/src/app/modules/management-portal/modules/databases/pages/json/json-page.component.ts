import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { Database, DatabaseService } from '@tenlastic/ng-http';

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
export class DatabasesJsonPageComponent implements OnInit {
  public breadcrumbs: BreadcrumbsComponentBreadcrumb[] = [];
  public data: Database;
  public errors: string[] = [];
  public form: FormGroup;

  constructor(
    private activatedRoute: ActivatedRoute,
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

      this.breadcrumbs = [
        { label: 'Databases', link: '../../' },
        { label: _id === 'new' ? 'Create Database' : 'Edit Database', link: '../' },
        { label: _id === 'new' ? 'Create Database as JSON' : 'Edit Database as JSON' },
      ];

      if (_id !== 'new') {
        this.data = await this.databaseService.findOne(_id);
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
    const values = JSON.parse(json) as Database;

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
    this.data ??= new Database({ name: '' });

    const keys = ['name'];
    const data = Object.keys(this.data)
      .filter((key) => keys.includes(key))
      .sort()
      .reduce((a, b) => Object.assign(a, { [b]: this.data[b] }), {});

    this.form = this.formBuilder.group({
      json: [JSON.stringify(data, null, 4), [Validators.required, jsonValidator]],
    });

    this.form.valueChanges.subscribe(() => (this.errors = []));
  }

  private async upsert(data: Partial<Database>) {
    let result: Database;

    if (this.data._id) {
      data._id = this.data._id;
      result = await this.databaseService.update(data);
    } else {
      result = await this.databaseService.create(data);
    }

    this.matSnackBar.open('Database saved successfully.');
    this.router.navigate([`../../${result._id}`], { relativeTo: this.activatedRoute });
  }
}
