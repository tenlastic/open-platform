import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { Authorization, AuthorizationService, IAuthorization } from '@tenlastic/ng-http';

import {
  IdentityService,
  SelectedNamespaceService,
  TextareaService,
} from '../../../../../../core/services';
import {
  BreadcrumbsComponentBreadcrumb,
  PromptComponent,
} from '../../../../../../shared/components';
import { jsonValidator } from '../../../../../../shared/validators';

@Component({
  templateUrl: 'json-page.component.html',
  styleUrls: ['./json-page.component.scss'],
})
export class AuthorizationsJsonPageComponent implements OnInit {
  public breadcrumbs: BreadcrumbsComponentBreadcrumb[] = [];
  public data: Authorization;
  public errors: string[] = [];
  public form: FormGroup;

  constructor(
    private activatedRoute: ActivatedRoute,
    private authorizationService: AuthorizationService,
    private formBuilder: FormBuilder,
    public identityService: IdentityService,
    private matDialog: MatDialog,
    private matSnackBar: MatSnackBar,
    private router: Router,
    private selectedNamespaceService: SelectedNamespaceService,
    private textareaService: TextareaService,
  ) {}

  public ngOnInit() {
    this.activatedRoute.paramMap.subscribe(async (params) => {
      const _id = params.get('_id');

      this.breadcrumbs = [
        { label: 'Authorizations', link: '../../' },
        {
          label: _id === 'new' ? 'Create Authorization' : 'Edit Authorization',
          link: '../',
        },
        {
          label: _id === 'new' ? 'Create Authorization as JSON' : 'Edit Authorization as JSON',
        },
      ];

      if (_id !== 'new') {
        this.data = await this.authorizationService.findOne(_id);
      }

      this.setupForm();
    });
  }

  public navigateToForm() {
    if (this.form.dirty) {
      const dialogRef = this.matDialog.open(PromptComponent, {
        data: {
          buttons: [
            { color: 'primary', label: 'No' },
            { color: 'accent', label: 'Yes' },
          ],
          message: 'Changes will not be saved. Is this OK?',
        },
      });

      dialogRef.afterClosed().subscribe(async (result) => {
        if (result === 'Yes') {
          this.router.navigate([`../`], { relativeTo: this.activatedRoute });
        }
      });
    } else {
      this.router.navigate([`../`], { relativeTo: this.activatedRoute });
    }
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
    const values = JSON.parse(json) as Authorization;

    values.namespaceId = this.selectedNamespaceService.namespaceId;

    try {
      await this.upsert(values);
    } catch (e) {
      this.handleHttpError(e);
    }
  }

  private async handleHttpError(err: HttpErrorResponse) {
    this.errors = err.error.errors.map((e) => {
      if (e.name === 'CastError' || e.name === 'ValidatorError') {
        return `(${e.path}) ${e.message}`;
      } else if (e.name === 'UniqueError') {
        const combination = e.paths.length > 1 ? 'combination ' : '';
        return `${e.paths.join(' / ')} ${combination}is not unique: ${e.values.join(' / ')}.`;
      } else {
        return e.message;
      }
    });
  }

  private setupForm(): void {
    this.data ??= new Authorization({
      status: IAuthorization.AuthorizationStatus.Granted,
      userId: '',
    });

    const keys = ['status', 'userId'];
    const data = Object.keys(this.data)
      .filter((key) => keys.includes(key))
      .sort()
      .reduce((a, b) => Object.assign(a, { [b]: this.data[b] }), {});

    this.form = this.formBuilder.group({
      json: [JSON.stringify(data, null, 4), [Validators.required, jsonValidator]],
    });

    this.form.valueChanges.subscribe(() => (this.errors = []));
  }

  private async upsert(data: Partial<Authorization>) {
    let result: Authorization;

    if (this.data._id) {
      data._id = this.data._id;
      result = await this.authorizationService.update(data);
    } else {
      result = await this.authorizationService.create(data);
    }

    this.matSnackBar.open('Authorization saved successfully.');
    this.router.navigate([`../../${result._id}`], { relativeTo: this.activatedRoute });
  }
}
