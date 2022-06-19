import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { INamespace, Namespace, NamespaceService } from '@tenlastic/ng-http';

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
export class NamespacesJsonPageComponent implements OnInit {
  public breadcrumbs: BreadcrumbsComponentBreadcrumb[] = [];
  public data: Namespace;
  public errors: string[] = [];
  public form: FormGroup;

  constructor(
    private activatedRoute: ActivatedRoute,
    private formBuilder: FormBuilder,
    public identityService: IdentityService,
    private matDialog: MatDialog,
    private matSnackBar: MatSnackBar,
    private namespaceService: NamespaceService,
    private router: Router,
    private selectedNamespaceService: SelectedNamespaceService,
    private textareaService: TextareaService,
  ) {}

  public ngOnInit() {
    this.activatedRoute.paramMap.subscribe(async (params) => {
      const _id = params.get('_id');

      this.breadcrumbs = [
        { label: 'Namespaces', link: '../../' },
        { label: _id === 'new' ? 'Create Namespace' : 'Edit Namespace', link: '../' },
        { label: _id === 'new' ? 'Create Namespace as JSON' : 'Edit Namespace as JSON' },
      ];

      if (_id !== 'new') {
        this.data = await this.namespaceService.findOne(_id);
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
    const values = JSON.parse(json) as Namespace;

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
    this.data ??= new Namespace({
      keys: [],
      limits: {
        builds: {
          count: 0,
          size: 0,
        },
        databases: {
          cpu: 0,
          memory: 0,
          preemptible: false,
          replicas: 0,
          storage: 0,
        },
        gameServers: {
          cpu: 0,
          memory: 0,
          preemptible: false,
        },
        games: {
          count: 0,
          images: 0,
          public: 0,
          size: 0,
          videos: 0,
        },
        queues: {
          cpu: 0,
          memory: 0,
          preemptible: false,
          replicas: 0,
        },
        workflows: {
          count: 0,
          cpu: 0,
          memory: 0,
          parallelism: 0,
          preemptible: false,
          storage: 0,
        },
      },
      name: '',
      users: [{ _id: this.identityService.user._id, roles: [INamespace.Role.Namespaces] }],
    });

    const keys = ['keys', 'limits', 'name', 'users'];
    const data = Object.keys(this.data)
      .filter((key) => keys.includes(key))
      .sort()
      .reduce((a, b) => Object.assign(a, { [b]: this.data[b] }), {});

    this.form = this.formBuilder.group({
      json: [JSON.stringify(data, null, 4), [Validators.required, jsonValidator]],
    });

    this.form.valueChanges.subscribe(() => (this.errors = []));
  }

  private async upsert(data: Partial<Namespace>) {
    let result: Namespace;

    if (this.data._id) {
      data._id = this.data._id;
      result = await this.namespaceService.update(data);
    } else {
      result = await this.namespaceService.create(data);
    }

    this.matSnackBar.open('Namespace saved successfully.');
    this.router.navigate([`../../${result._id}`], { relativeTo: this.activatedRoute });
  }
}
