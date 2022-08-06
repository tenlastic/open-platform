import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import {
  AuthorizationQuery,
  IAuthorization,
  NamespaceModel,
  NamespaceService,
} from '@tenlastic/ng-http';

import { FormService, IdentityService } from '../../../../../../core/services';

@Component({
  templateUrl: 'form-page.component.html',
  styleUrls: ['./form-page.component.scss'],
})
export class NamespacesFormPageComponent implements OnInit {
  public data: NamespaceModel;
  public errors: string[] = [];
  public form: FormGroup;
  public hasWriteAuthorization: boolean;
  public hasWriteAuthorizationForNamespace: boolean;

  constructor(
    private activatedRoute: ActivatedRoute,
    private authorizationQuery: AuthorizationQuery,
    private formBuilder: FormBuilder,
    private formService: FormService,
    private identityService: IdentityService,
    private matSnackBar: MatSnackBar,
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
      limits: this.form.get('limits').value,
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

    const { limits } = this.data;
    this.form = this.formBuilder.group({
      limits: this.formBuilder.group({
        builds: this.formBuilder.group({
          count: [limits?.builds?.count || 0, Validators.required],
          size: [limits?.builds?.size || 0, Validators.required],
        }),
        gameServers: this.formBuilder.group({
          cpu: [limits?.gameServers?.cpu || 0, Validators.required],
          memory: [limits?.gameServers?.memory || 0, Validators.required],
          preemptible: [limits?.gameServers?.preemptible || false, Validators.required],
        }),
        queues: this.formBuilder.group({
          cpu: [limits?.queues?.cpu || 0, Validators.required],
          memory: [limits?.queues?.memory || 0, Validators.required],
          preemptible: [limits?.queues?.preemptible || false, Validators.required],
          replicas: [limits?.queues?.replicas || 0, Validators.required],
        }),
        storefronts: this.formBuilder.group({
          count: [limits?.storefronts?.count || 0, Validators.required],
          images: [limits?.storefronts?.images || 0, Validators.required],
          public: [limits?.storefronts?.public || 0, Validators.required],
          size: [limits?.storefronts?.size || 0, Validators.required],
          videos: [limits?.storefronts?.videos || 0, Validators.required],
        }),
        workflows: this.formBuilder.group({
          count: [limits?.workflows?.count || 0, Validators.required],
          cpu: [limits?.workflows?.cpu || 0, Validators.required],
          memory: [limits?.workflows?.memory || 0, Validators.required],
          parallelism: [limits?.workflows?.parallelism || 0, Validators.required],
          preemptible: [limits?.workflows?.preemptible || false, Validators.required],
          storage: [limits?.workflows?.storage || 0, Validators.required],
        }),
      }),
      name: [this.data.name, Validators.required],
    });

    if (!this.hasWriteAuthorization && !this.hasWriteAuthorizationForNamespace) {
      this.form.disable({ emitEvent: false });
    } else if (!this.hasWriteAuthorization) {
      this.form.get('limits').disable({ emitEvent: false });
    }

    this.form.valueChanges.subscribe(() => (this.errors = []));
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
