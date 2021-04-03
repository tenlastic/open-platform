import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatSnackBar } from '@angular/material';
import { ActivatedRoute, Router } from '@angular/router';
import { Database, DatabaseQuery, DatabaseService, IDatabase } from '@tenlastic/ng-http';
import { Subscription } from 'rxjs';

import { IdentityService, SelectedNamespaceService } from '../../../../../../core/services';
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
  public cpus = IDatabase.Cpu;
  public data: Database;
  public errors: string[] = [];
  public form: FormGroup;
  public memories = IDatabase.Memory;
  public replicas = IDatabase.Replicas;
  public storages = IDatabase.Storage;

  private updateDatabase$ = new Subscription();

  constructor(
    private activatedRoute: ActivatedRoute,
    private databaseQuery: DatabaseQuery,
    private databaseService: DatabaseService,
    private formBuilder: FormBuilder,
    public identityService: IdentityService,
    private matDialog: MatDialog,
    private matSnackBar: MatSnackBar,
    private router: Router,
    public selectedNamespaceService: SelectedNamespaceService,
  ) {}

  public ngOnInit() {
    this.activatedRoute.paramMap.subscribe(async params => {
      const _id = params.get('_id');
      if (_id !== 'new') {
        this.data = await this.databaseService.findOne(_id);
      }

      this.setupForm();

      this.breadcrumbs = [
        { label: 'Databases', link: '../' },
        { label: this.data._id ? 'Edit Database' : 'Create Database' },
      ];
    });
  }

  public ngOnDestroy() {
    this.updateDatabase$.unsubscribe();
  }

  public async save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const values: Partial<Database> = {
      cpu: this.form.get('cpu').value,
      gameId: this.form.get('gameId').value,
      isPreemptible: this.form.get('isPreemptible').value,
      memory: this.form.get('memory').value,
      name: this.form.get('name').value,
      namespaceId: this.form.get('namespaceId').value,
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
    return Object.keys(this.form.controls).filter(key => this.form.get(key).dirty);
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
    this.data = this.data || new Database();

    this.form = this.formBuilder.group({
      cpu: [this.data.cpu || this.cpus[0].value, Validators.required],
      gameId: [this.data.gameId],
      isPreemptible: [this.data.isPreemptible === false ? false : true],
      memory: [this.data.memory || this.memories[0].value, Validators.required],
      name: [this.data.name, Validators.required],
      namespaceId: [this.selectedNamespaceService.namespaceId],
      replicas: [this.data.replicas || this.replicas[0].value, Validators.required],
      storage: [this.data.storage || this.storages[0].value, Validators.required],
    });

    this.form.valueChanges.subscribe(() => (this.errors = []));

    if (this.data._id) {
      this.form.get('cpu').disable({ emitEvent: false });
      this.form.get('isPreemptible').disable({ emitEvent: false });
      this.form.get('memory').disable({ emitEvent: false });
      this.form.get('replicas').disable({ emitEvent: false });
      this.form.get('storage').disable({ emitEvent: false });

      this.updateDatabase$ = this.databaseQuery
        .selectAll({ filterBy: q => q._id === this.data._id })
        .subscribe(databases => {
          const database = new Database(databases[0]);
          this.data.status = database.status;
        });
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
