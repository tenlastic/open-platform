import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import {
  AuthorizationQuery,
  IAuthorization,
  NamespaceModel,
  NamespaceQuery,
  NamespaceService,
} from '@tenlastic/http';
import { Subscription } from 'rxjs';

import { FormService, IdentityService } from '../../../../../../core/services';

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

  private updateNamespace$ = new Subscription();

  constructor(
    private activatedRoute: ActivatedRoute,
    private authorizationQuery: AuthorizationQuery,
    private formBuilder: FormBuilder,
    private formService: FormService,
    private identityService: IdentityService,
    private matSnackBar: MatSnackBar,
    private namespaceQuery: NamespaceQuery,
    private namespaceService: NamespaceService,
    private router: Router,
  ) {}

  public ngOnInit() {
    this.activatedRoute.params.subscribe(async (params) => {
      const roles = [IAuthorization.Role.NamespacesReadWrite];
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

  public navigateToJson() {
    this.formService.navigateToJson(this.form);
  }

  public async save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const values: Partial<NamespaceModel> = {
      _id: this.data._id,
      limits: {
        bandwidth: this.form.get('limits').get('bandwidth').value * 1000 * 1000 * 1000,
        cpu: this.form.get('limits').get('cpu').value,
        defaultAuthorization: this.form.get('limits').get('defaultAuthorization').value,
        memory: this.form.get('limits').get('memory').value * 1000 * 1000 * 1000,
        preemptible: this.form.get('limits').get('preemptible').value,
        storage: this.form.get('limits').get('storage').value * 1000 * 1000 * 1000,
      },
      name: this.form.get('name').value,
    };

    try {
      this.data = await this.upsert(values);
    } catch (e) {
      this.errors = this.formService.handleHttpError(e, { name: 'Name' });
    }
  }

  private setupForm() {
    this.data = this.data || new NamespaceModel();

    this.form = this.formBuilder.group({
      limits: this.formBuilder.group({
        bandwidth: [this.data.limits?.bandwidth / (1000 * 1000 * 1000) || 0, Validators.required],
        cpu: [this.data.limits?.cpu || 0, Validators.required],
        defaultAuthorization: this.data.limits?.defaultAuthorization ?? false,
        memory: [this.data.limits?.memory / (1000 * 1000 * 1000) || 0, Validators.required],
        preemptible: this.data.limits?.preemptible,
        storage: [this.data.limits?.storage / (1000 * 1000 * 1000) || 0, Validators.required],
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
