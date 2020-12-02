import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material';
import { ActivatedRoute, Router } from '@angular/router';
import { Build, BuildTask, BuildService, BuildTaskService, File } from '@tenlastic/ng-http';

import {
  IdentityService,
  SelectedNamespaceService,
  SocketService,
} from '../../../../../../core/services';

@Component({
  templateUrl: 'form-page.component.html',
  styleUrls: ['./form-page.component.scss'],
})
export class BuildsFormPageComponent implements OnDestroy, OnInit {
  public data: Build;
  public errors: string[] = [];
  public form: FormGroup;
  public tasks: BuildTask[];
  public platforms = [
    { label: 'Windows Client (x64)', value: 'windows64' },
    { label: 'Linux Server (x64)', value: 'server64' },
  ];

  private buildTaskSubscriptionId: string;

  constructor(
    private activatedRoute: ActivatedRoute,
    private buildTaskService: BuildTaskService,
    private formBuilder: FormBuilder,
    public identityService: IdentityService,
    private matSnackBar: MatSnackBar,
    private buildService: BuildService,
    private router: Router,
    private selectedNamespaceService: SelectedNamespaceService,
    private socketService: SocketService,
  ) {}

  public ngOnInit() {
    this.activatedRoute.paramMap.subscribe(async params => {
      const _id = params.get('_id');
      if (_id !== 'new') {
        this.data = await this.buildService.findOne(_id);
      }

      this.buildTaskSubscriptionId = this.socketService.subscribe(
        'build-tasks',
        BuildTask,
        this.buildTaskService,
        { buildId: { $eq: _id } },
      );

      this.setupForm();
    });
  }

  public ngOnDestroy() {
    this.socketService.unsubscribe(this.buildTaskSubscriptionId);
  }

  public async save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const values: Partial<Build> = {
      namespaceId: this.form.get('namespaceId').value,
      version: this.form.get('version').value,
    };

    try {
      await this.upsert(values);
    } catch (e) {
      this.handleHttpError(e, { namespaceId: 'Namespace', version: 'Version' });
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

  private setupForm(): void {
    this.data = this.data || new Build();

    this.form = this.formBuilder.group({
      namespaceId: [this.selectedNamespaceService.namespaceId, Validators.required],
      version: [this.data.version, Validators.required],
    });

    this.form.valueChanges.subscribe(() => (this.errors = []));
  }

  private async upsert(data: Partial<Build>) {
    if (this.data._id) {
      data._id = this.data._id;
      await this.buildService.update(data);
    } else {
      const result = await this.buildService.create(data);
      this.router.navigate(['../', result._id], { relativeTo: this.activatedRoute });
    }

    this.matSnackBar.open('Build saved successfully.');
  }
}
