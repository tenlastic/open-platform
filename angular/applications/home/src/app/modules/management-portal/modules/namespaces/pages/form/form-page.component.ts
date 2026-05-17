import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import {
  AuthorizationState,
  IAuthorization,
  INamespace,
  NamespaceModel,
  NamespaceService,
  NamespaceState,
  SubscriptionService,
  WebSocketService,
} from '@tenlastic/http';
import { map, Subscription } from 'rxjs';
import { v4 as uuid } from 'uuid';

import { FormService, IdentityService, OverlayService } from '@home/app/core/services';
import { PromptOverlayComponent, PromptOverlayComponentData } from '@home/app/shared/components';
import { environment } from '@home/environments/environment';

export interface NamespacesForm {
  limits: FormGroup<{
    bandwidth: FormControl<number>;
    cpu: FormControl<number>;
    defaultAuthorization: FormControl<boolean>;
    memory: FormControl<number>;
    nonPreemptible: FormControl<boolean>;
    storage: FormControl<number>;
  }>;
  name: FormControl<string>;
}

@Component({
  standalone: false,
  styleUrls: ['./form-page.component.scss'],
  templateUrl: 'form-page.component.html',
})
export class NamespacesFormPageComponent implements OnDestroy, OnInit {
  public data: NamespaceModel;
  public errors: string[] = [];
  public form: FormGroup<NamespacesForm>;
  public hasWriteAuthorization: boolean;
  public hasWriteAuthorizationForNamespace: boolean;
  public isSaving: boolean;

  private updateNamespace$ = new Subscription();
  private subscriptions = [
    {
      Model: NamespaceModel,
      request: { _id: uuid(), path: `/subscriptions/namespaces` },
      service: this.namespaceService,
    },
  ];
  private get webSocket() {
    return this.webSocketService.webSockets.find((ws) => environment.wssUrl === ws.url);
  }

  constructor(
    private activatedRoute: ActivatedRoute,
    private authorizationState: AuthorizationState,
    private formBuilder: FormBuilder,
    private formService: FormService,
    private identityService: IdentityService,
    private matSnackBar: MatSnackBar,
    private namespaceState: NamespaceState,
    private namespaceService: NamespaceService,
    private overlayService: OverlayService,
    private router: Router,
    private subscriptionService: SubscriptionService,
    private webSocketService: WebSocketService,
  ) {}

  public ngOnInit() {
    this.activatedRoute.params.subscribe(async (params) => {
      const roles = [IAuthorization.Role.NamespacesWrite];
      const userId = this.identityService.user?._id;
      this.hasWriteAuthorization = this.authorizationState.hasRoles(null, roles, userId);
      this.hasWriteAuthorizationForNamespace = this.authorizationState.hasRoles(
        params.namespaceId,
        roles,
        userId,
      );

      if (params.namespaceId !== 'new') {
        this.data = await this.namespaceService.findOne(params.namespaceId);
      }

      this.setupForm();

      await this.unsubscribe();
      await this.subscribe();
    });
  }

  public async ngOnDestroy() {
    this.updateNamespace$.unsubscribe();
    await this.unsubscribe();
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

    if (this.form.invalid) {
      this.form.markAllAsTouched();
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
      const dialogRef = this.overlayService.open<PromptOverlayComponentData, string>(
        PromptOverlayComponent,
        {
          buttons: [
            { color: 'primary', label: 'No' },
            { color: 'accent', label: 'Yes' },
          ],
          message: `These changes require the Namespace to be restarted. Is this OK?`,
        },
      );

      dialogRef.$close.subscribe(async (result: string) => {
        if (result === 'Yes') {
          this.isSaving = true;

          try {
            this.data = await this.upsert(values);
          } catch (e) {
            this.errors = this.formService.handleHttpError(e, { name: 'Name' });
          }

          this.isSaving = false;
        }
      });
    } else {
      this.isSaving = true;

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
        bandwidth: this.formBuilder.control(
          this.data.limits.bandwidth / (1000 * 1000 * 1000),
          Validators.required,
        ),
        cpu: this.formBuilder.control(this.data.limits.cpu, Validators.required),
        defaultAuthorization: this.formBuilder.control(this.data.limits.defaultAuthorization),
        memory: this.formBuilder.control(
          this.data.limits.memory / (1000 * 1000 * 1000),
          Validators.required,
        ),
        nonPreemptible: this.formBuilder.control(this.data.limits.nonPreemptible),
        storage: this.formBuilder.control(
          this.data.limits.storage / (1000 * 1000 * 1000),
          Validators.required,
        ),
      }),
      name: this.formBuilder.control(this.data.name, Validators.required),
    });

    if (!this.hasWriteAuthorization && !this.hasWriteAuthorizationForNamespace) {
      this.form.disable({ emitEvent: false });
    } else if (!this.hasWriteAuthorization) {
      this.form.get('limits').disable({ emitEvent: false });
    }

    this.form.valueChanges.subscribe(() => (this.errors = []));

    if (this.data._id) {
      this.updateNamespace$ = this.namespaceState
        .selectMany()
        .pipe(map((ns) => ns.filter((n) => n._id === this.data._id)))
        .subscribe((namespaces) => (this.data = namespaces[0]));
    }
  }

  private subscribe() {
    const promises = this.subscriptions.map((s) => {
      const options = { acks: true };

      return this.subscriptionService.subscribe(
        s.Model,
        { ...s.request },
        s.service,
        this.webSocket,
        options,
      );
    });

    return Promise.all(promises);
  }

  private unsubscribe() {
    const promises = this.subscriptions.map((s) =>
      this.subscriptionService.unsubscribe(s.request._id, this.webSocket),
    );

    return Promise.all(promises);
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
