import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { Database, DatabaseQuery, DatabaseService, IDatabase } from '@tenlastic/ng-http';
import { Subscription } from 'rxjs';

import { SelectedNamespaceService } from '../../../../../../core/services';
import {
  BreadcrumbsComponentBreadcrumb,
  PromptComponent,
} from '../../../../../../shared/components';

@Component({
  templateUrl: 'form-page.component.html',
  styleUrls: ['./form-page.component.scss'],
})
export class DatabasesFormPageComponent implements OnDestroy, OnInit {
  public breadcrumbs: BreadcrumbsComponentBreadcrumb[] = [];
  public components = {
    application: 'Application',
    mongodb: 'MongoDB',
    nats: 'NATS',
    sidecar: 'Sidecar',
  };
  public get cpus() {
    const limits = this.selectedNamespaceService.namespace.limits.databases;
    const limit = limits.cpu ? limits.cpu : Infinity;
    return limits.cpu ? IDatabase.Cpu.filter((r) => r.value <= limit) : IDatabase.Cpu;
  }
  public data: Database;
  public errors: string[] = [];
  public form: FormGroup;
  public get memories() {
    const limits = this.selectedNamespaceService.namespace.limits.databases;
    const limit = limits.memory ? limits.memory : Infinity;
    return limits.memory ? IDatabase.Memory.filter((r) => r.value <= limit) : IDatabase.Memory;
  }
  public get replicas() {
    const limits = this.selectedNamespaceService.namespace.limits.databases;
    const limit = limits.replicas ? limits.replicas : Infinity;
    return limits.replicas
      ? IDatabase.Replicas.filter((r) => r.value <= limit)
      : IDatabase.Replicas;
  }
  public get storages() {
    const limits = this.selectedNamespaceService.namespace.limits.databases;
    const limit = limits.storage ? limits.storage : Infinity;
    return this.data && this.data.storage
      ? IDatabase.Storage.filter((r) => r.value <= limit && r.value >= this.data.storage)
      : IDatabase.Storage;
  }

  private updateDatabase$ = new Subscription();

  constructor(
    private activatedRoute: ActivatedRoute,
    private databaseQuery: DatabaseQuery,
    private databaseService: DatabaseService,
    private formBuilder: FormBuilder,
    private matDialog: MatDialog,
    private matSnackBar: MatSnackBar,
    private router: Router,
    private selectedNamespaceService: SelectedNamespaceService,
  ) {}

  public ngOnInit() {
    this.activatedRoute.paramMap.subscribe(async (params) => {
      const _id = params.get('_id');

      this.breadcrumbs = [
        { label: 'Databases', link: '../' },
        { label: _id === 'new' ? 'Create Database' : 'Edit Database' },
      ];

      if (_id !== 'new') {
        this.data = await this.databaseService.findOne(_id);
      }

      this.setupForm();
    });
  }

  public ngOnDestroy() {
    this.updateDatabase$.unsubscribe();
  }

  public navigateToJson() {
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
          this.router.navigate([`json`], { relativeTo: this.activatedRoute });
        }
      });
    } else {
      this.router.navigate([`json`], { relativeTo: this.activatedRoute });
    }
  }

  public async save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const values: Partial<Database> = {
      cpu: this.form.get('cpu').value,
      gameId: this.form.get('gameId').value,
      memory: this.form.get('memory').value,
      name: this.form.get('name').value,
      namespaceId: this.form.get('namespaceId').value,
      preemptible: this.form.get('preemptible').value,
      replicas: this.form.get('replicas').value,
      storage: this.form.get('storage').value,
    };

    const dirtyFields = this.getDirtyFields();
    if (this.data._id && Database.isRestartRequired(dirtyFields)) {
      const dialogRef = this.matDialog.open(PromptComponent, {
        data: {
          buttons: [
            { color: 'primary', label: 'No' },
            { color: 'accent', label: 'Yes' },
          ],
          message: `These changes require the Database to be restarted. Is this OK?`,
        },
      });

      dialogRef.afterClosed().subscribe(async (result: string) => {
        if (result === 'Yes') {
          try {
            await this.upsert(values);
          } catch (e) {
            this.handleHttpError(e, { name: 'Name' });
          }
        }
      });
    } else {
      try {
        await this.upsert(values);
      } catch (e) {
        this.handleHttpError(e, { name: 'Name' });
      }
    }
  }

  private getDirtyFields() {
    return Object.keys(this.form.controls).filter((key) => this.form.get(key).dirty);
  }

  private async handleHttpError(err: HttpErrorResponse, pathMap: any) {
    this.errors = err.error.errors.map((e) => {
      if (e.name === 'UniquenessError') {
        const combination = e.paths.length > 1 ? 'combination ' : '';
        const paths = e.paths.map((p) => pathMap[p]);
        return `${paths.join(' / ')} ${combination}is not unique: ${e.values.join(' / ')}.`;
      } else {
        return e.message;
      }
    });
  }

  private setupForm(): void {
    this.data = this.data || new Database();

    this.form = this.formBuilder.group({
      cpu: [this.data.cpu || this.cpus[0].value, Validators.required],
      gameId: [this.data.gameId],
      memory: [this.data.memory || this.memories[0].value, Validators.required],
      name: [this.data.name, Validators.required],
      namespaceId: [this.selectedNamespaceService.namespaceId],
      preemptible: [this.data.preemptible === false ? false : true],
      replicas: [this.data.replicas || this.replicas[0].value, Validators.required],
      storage: [this.data.storage || this.storages[0].value, Validators.required],
    });

    this.form.valueChanges.subscribe(() => (this.errors = []));

    if (this.data._id) {
      this.updateDatabase$ = this.databaseQuery
        .selectAll({ filterBy: (q) => q._id === this.data._id })
        .subscribe((databases) => (this.data = databases[0]));
    }
  }

  private async upsert(data: Partial<Database>) {
    if (this.data._id) {
      data._id = this.data._id;
      await this.databaseService.update(data);
    } else {
      await this.databaseService.create(data);
    }

    this.matSnackBar.open('Database saved successfully.');
    this.router.navigate(['../'], { relativeTo: this.activatedRoute });
  }
}
