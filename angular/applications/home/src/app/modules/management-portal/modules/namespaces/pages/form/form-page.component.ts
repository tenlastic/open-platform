import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import {
  AuthorizationQuery,
  IAuthorization,
  INamespace,
  NamespaceModel,
  NamespaceQuery,
  NamespaceService,
} from '@tenlastic/http';
import { Subscription } from 'rxjs';

import { FormService, IdentityService } from '../../../../../../core/services';
import { PromptComponent } from '../../../../../../shared/components';

@Component({
  templateUrl: 'form-page.component.html',
  styleUrls: ['./form-page.component.scss'],
})
export class NamespacesFormPageComponent implements OnDestroy, OnInit {
  public data: NamespaceModel;
  public errors: string[] = [];
  public form: FormGroup;
  public hasWriteAuthorization: boolean;
  public hasWriteAuthorizationForNamespace: boolean;
  public isSaving: boolean;

  private updateNamespace$ = new Subscription();

  constructor(
    private activatedRoute: ActivatedRoute,
    private authorizationQuery: AuthorizationQuery,
    private formBuilder: FormBuilder,
    private formService: FormService,
    private identityService: IdentityService,
    private matDialog: MatDialog,
    private matSnackBar: MatSnackBar,
    private namespaceQuery: NamespaceQuery,
    private namespaceService: NamespaceService,
    private router: Router,
  ) {}

  public ngOnInit() {
    this.activatedRoute.params.subscribe(async (params) => {
      const roles = [IAuthorization.Role.NamespacesWrite];
      const userId = this.identityService.user?._id;
      this.hasWriteAuthorization = this.authorizationQuery.hasRoles(null, roles, userId);
      this.hasWriteAuthorizationForNamespace = this.authorizationQuery.hasRoles(
        params.namespaceId,
        roles,
        userId,
      );

      if (params.namespaceId !== 'new') {
        this.data = await this.namespaceService.findOne(params.namespaceId);
      }

      this.setupForm();
    });
  }

  public ngOnDestroy() {
    this.updateNamespace$.unsubscribe();
  }

  public getComponentValue(component: INamespace.StatusComponent) {
    if (!component.total) {
      return component.phase;
    }

    return `${component.phase} (${component.current} / ${component.total})`;
  }

  public navigateToJson() {
    this.formService.navigateToJson(this.form);
  }

  public async save() {
    this.errors = [];
    this.isSaving = true;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.isSaving = false;
      return;
    }

    const limits = this.form.get('limits');

    const values: Partial<NamespaceModel> = {
      _id: this.data._id,
      limits: {
        bandwidth: limits.get('bandwidth').value * 1000 * 1000 * 1000,
        cpu: limits.get('cpu').value,
        defaultAuthorization: limits.get('defaultAuthorization').value,
        memory: limits.get('memory').value * 1000 * 1000 * 1000,
        nonPreemptible: limits.get('nonPreemptible').value,
        storage: limits.get('storage').value * 1000 * 1000 * 1000,
      },
      name: this.form.get('name').value,
    };

    const dirtyFields = this.getDirtyFields();
    if (this.data._id && NamespaceModel.isRestartRequired(dirtyFields)) {
      const dialogRef = this.matDialog.open(PromptComponent, {
        data: {
          buttons: [
            { color: 'primary', label: 'No' },
            { color: 'accent', label: 'Yes' },
          ],
          message: `These changes require the Namespace to be restarted. Is this OK?`,
        },
      });

      dialogRef.afterClosed().subscribe(async (result: string) => {
        if (result === 'Yes') {
          try {
            this.data = await this.upsert(values);
          } catch (e) {
            this.errors = this.formService.handleHttpError(e, { name: 'Name' });
          }

          this.isSaving = false;
        }
      });
    } else {
      try {
        this.data = await this.upsert(values);
      } catch (e) {
        this.errors = this.formService.handleHttpError(e, { name: 'Name' });
      }

      this.isSaving = false;
    }
  }

  private getDirtyFields() {
    return Object.keys(this.form.controls).filter((key) => this.form.get(key).dirty);
  }

  private setupForm() {
    this.data ??= new NamespaceModel({
      limits: {
        bandwidth: 0,
        cpu: 0,
        defaultAuthorization: false,
        memory: 0,
        nonPreemptible: false,
        storage: 0,
      },
    });

    this.form = this.formBuilder.group({
      limits: this.formBuilder.group({
        bandwidth: [this.data.limits.bandwidth / (1000 * 1000 * 1000), Validators.required],
        cpu: [this.data.limits.cpu, Validators.required],
        defaultAuthorization: this.data.limits.defaultAuthorization,
        memory: [this.data.limits.memory / (1000 * 1000 * 1000), Validators.required],
        nonPreemptible: this.data.limits.nonPreemptible,
        storage: [this.data.limits.storage / (1000 * 1000 * 1000), Validators.required],
      }),
      name: [this.data.name, Validators.required],
    });

    if (!this.hasWriteAuthorization && !this.hasWriteAuthorizationForNamespace) {
      this.form.disable({ emitEvent: false });
    } else if (!this.hasWriteAuthorization) {
      this.form.get('limits').disable({ emitEvent: false });
    }

    this.form.valueChanges.subscribe(() => (this.errors = []));

    if (this.data._id) {
      this.updateNamespace$ = this.namespaceQuery
        .selectAll({ filterBy: (q) => q._id === this.data._id })
        .subscribe((namespaces) => (this.data = namespaces[0]));
    }
  }

  private async upsert(values: Partial<NamespaceModel>) {
    const result = values._id
      ? await this.namespaceService.update(values._id, values)
      : await this.namespaceService.create(values);

    this.matSnackBar.open(`Namespace saved successfully.`);
    this.router.navigate(['../', result._id], { relativeTo: this.activatedRoute });

    return result;
  }
}
