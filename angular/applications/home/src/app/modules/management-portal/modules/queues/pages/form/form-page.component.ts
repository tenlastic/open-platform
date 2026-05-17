import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import {
  AuthorizationState,
  GameServerTemplateModel,
  GameServerTemplateService,
  IAuthorization,
  IQueue,
  NamespaceModel,
  NamespaceService,
  QueueModel,
  QueueService,
  QueueState,
  SubscriptionService,
  WebSocketService,
} from '@tenlastic/http';
import { map, Subscription } from 'rxjs';
import { v4 as uuid } from 'uuid';

import { FormService, IdentityService, OverlayService } from '@home/app/core/services';
import {
  MetadataForm,
  PromptOverlayComponent,
  PromptOverlayComponentData,
} from '@home/app/shared/components';
import { environment } from '@home/environments/environment';

export interface QueueForm {
  confirmation: FormControl<boolean>;
  cpu: FormControl<number>;
  description: FormControl<string>;
  gameServerTemplateId: FormControl<string>;
  groupSizes: FormArray<FormControl<number>>;
  initialRating: FormControl<number>;
  invitationSeconds: FormControl<number>;
  memory: FormControl<number>;
  metadata: FormArray<FormGroup<MetadataForm>>;
  name: FormControl<string>;
  preemptible: FormControl<boolean>;
  replicas: FormControl<number>;
  teams: FormControl<boolean>;
  thresholds: FormArray<FormGroup<ThresholdForm>>;
}

export interface ThresholdForm {
  rating: FormControl<number>;
  seconds: FormControl<number>;
  usersPerTeam: FormArray<FormControl<number>>;
}

interface PropertyFormGroup {
  key?: string;
  type?: string;
  value?: any;
}

@Component({
  standalone: false,
  styleUrls: ['./form-page.component.scss'],
  templateUrl: 'form-page.component.html',
})
export class QueuesFormPageComponent implements OnDestroy, OnInit {
  public get cpus() {
    return this.namespace.limits.cpu
      ? IQueue.Cpu.filter((r) => r.value <= this.namespace.limits.cpu)
      : IQueue.Cpu;
  }
  public data: QueueModel;
  public errors: string[] = [];
  public form: FormGroup<QueueForm>;
  public gameServerTemplates: GameServerTemplateModel[];
  public get groupSizes() {
    return this.form.get('groupSizes') as FormArray;
  }
  public hasWriteAuthorization: boolean;
  public get isNew() {
    return this.queueId === 'new';
  }
  public isSaving: boolean;
  public get memories() {
    return this.namespace.limits.memory
      ? IQueue.Memory.filter((r) => r.value <= this.namespace.limits.memory)
      : IQueue.Memory;
  }
  public get replicas() {
    return IQueue.Replicas;
  }

  private updateQueue$ = new Subscription();
  private namespace: NamespaceModel;
  private namespaceId: string;
  private queueId: string;
  private subscriptions = [
    {
      Model: QueueModel,
      request: { _id: uuid(), path: `/subscriptions/queues` },
      service: this.queueService,
    },
  ];
  private get webSocket() {
    return this.webSocketService.webSockets.find(
      (ws) => `${environment.wssUrl}/namespaces/${this.namespaceId}` === ws.url,
    );
  }

  constructor(
    private activatedRoute: ActivatedRoute,
    private authorizationState: AuthorizationState,
    private formBuilder: FormBuilder,
    private formService: FormService,
    private gameServerTemplateService: GameServerTemplateService,
    private identityService: IdentityService,
    private matSnackBar: MatSnackBar,
    private namespaceService: NamespaceService,
    private overlayService: OverlayService,
    private queueState: QueueState,
    private queueService: QueueService,
    private router: Router,
    private subscriptionService: SubscriptionService,
    private webSocketService: WebSocketService,
  ) {}

  public ngOnInit() {
    this.activatedRoute.params.subscribe(async (params) => {
      this.namespaceId = params.namespaceId;
      this.queueId = params.queueId;

      const roles = [IAuthorization.Role.QueuesWrite];
      const userId = this.identityService.user?._id;
      this.hasWriteAuthorization =
        this.authorizationState.hasRoles(null, roles, userId) ||
        this.authorizationState.hasRoles(params.namespaceId, roles, userId);

      this.gameServerTemplates = await this.gameServerTemplateService.find(params.namespaceId, {});
      this.namespace = await this.namespaceService.findOne(params.namespaceId);

      if (params.queueId !== 'new') {
        this.data = await this.queueService.findOne(params.namespaceId, params.queueId);
      }

      this.setupForm();

      await this.unsubscribe();
      await this.subscribe();
    });
  }

  public async ngOnDestroy() {
    this.updateQueue$.unsubscribe();
    await this.unsubscribe();
  }

  public addGroupSize() {
    const control = new FormControl(1, [Validators.required, Validators.min(1)]);
    this.groupSizes.push(control);
  }

  public navigateToJson() {
    this.formService.navigateToJson(this.form);
  }

  public pushUsersPerTeam(formArray: FormArray) {
    const control = this.formBuilder.control(1, [Validators.min(1), Validators.required]);
    formArray.push(control);
  }

  public removeGroupSize(index: number) {
    this.groupSizes.removeAt(index);
  }

  public async save() {
    this.errors = [];

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const metadata = this.form.get('metadata').value.reduce((accumulator, property) => {
      accumulator[property.key] = this.getJsonFromProperty(property);
      return accumulator;
    }, {});

    const values: Partial<QueueModel> = {
      _id: this.data._id,
      confirmation: this.form.get('confirmation').value,
      cpu: this.form.get('cpu').value,
      description: this.form.get('description').value,
      gameServerTemplateId: this.form.get('gameServerTemplateId').value,
      groupSizes: this.form.get('groupSizes').value,
      initialRating: this.form.get('initialRating').value,
      invitationSeconds: this.form.get('invitationSeconds').value,
      memory: this.form.get('memory').value,
      metadata,
      name: this.form.get('name').value,
      namespaceId: this.namespaceId,
      preemptible: this.form.get('preemptible').value,
      replicas: this.form.get('replicas').value,
      teams: this.form.get('teams').value,
      thresholds: this.form.get('thresholds').value,
    };

    const dirtyFields = this.getDirtyFields();
    if (this.data._id && QueueModel.isRestartRequired(dirtyFields)) {
      const overlay = this.overlayService.open<PromptOverlayComponentData, string>(
        PromptOverlayComponent,
        {
          buttons: [
            { color: 'primary', label: 'No' },
            { color: 'accent', label: 'Yes' },
          ],
          message: `These changes require the Queue to be restarted. Is this OK?`,
        },
      );

      overlay.$close.subscribe(async (result: string) => {
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

  private getJsonFromProperty(property: PropertyFormGroup) {
    switch (property.type) {
      case 'boolean':
        return property.value || false;

      case 'number':
        return isNaN(parseFloat(property.value)) ? 0 : parseFloat(property.value);

      default:
        return property.value || '';
    }
  }

  private getThresholdFormGroups(thresholds: IQueue.Threshold[]) {
    return thresholds.map((t) => {
      const formControls = t.usersPerTeam.map((upt) =>
        this.formBuilder.control(upt, [Validators.min(1), Validators.required]),
      );

      return this.formBuilder.group<ThresholdForm>({
        rating: this.formBuilder.control(t.rating || 0),
        seconds: this.formBuilder.control(t.seconds || 0, [Validators.min(0), Validators.required]),
        usersPerTeam: this.formBuilder.array(formControls),
      });
    });
  }

  private setupForm() {
    this.data ??= new QueueModel({
      confirmation: true,
      groupSizes: [1],
      invitationSeconds: 30,
      thresholds: [{ seconds: 0, usersPerTeam: [1, 1] }],
    });

    const groupSizeFormControls = this.data.groupSizes?.map(
      (gs) => new FormControl(gs, [Validators.required, Validators.min(1)]),
    );

    const metadataFormGroups: FormGroup<MetadataForm>[] = [];
    if (this.data.metadata) {
      Object.entries(this.data.metadata).forEach(([key, property]) => {
        let type = 'boolean';
        if (typeof property === 'string' || property instanceof String) {
          type = 'string';
        } else if (typeof property === 'number') {
          type = 'number';
        }

        const formGroup = this.formBuilder.group({
          key: [key, [Validators.required, Validators.pattern(/^[0-9A-Za-z\-]{2,64}$/)]],
          value: [property, Validators.required],
          type,
        });
        metadataFormGroups.push(formGroup);
      });
    }

    const thresholdFormGroups: FormGroup<ThresholdForm>[] = [];
    if (this.data?.thresholds?.length > 0) {
      thresholdFormGroups.push(...this.getThresholdFormGroups(this.data.thresholds));
    }

    this.form = this.formBuilder.group({
      confirmation: this.formBuilder.control(this.data.confirmation || false),
      cpu: this.formBuilder.control(this.data.cpu || this.cpus[0].value, Validators.required),
      description: this.formBuilder.control(this.data.description),
      gameServerTemplateId: this.formBuilder.control(
        this.data.gameServerTemplateId || this.gameServerTemplates[0]?._id,
        Validators.required,
      ),
      groupSizes: this.formBuilder.array(groupSizeFormControls || []),
      initialRating: this.formBuilder.control(this.data.initialRating || 0),
      invitationSeconds: this.formBuilder.control(this.data.invitationSeconds || 0),
      memory: this.formBuilder.control(
        this.data.memory || this.memories[0].value,
        Validators.required,
      ),
      metadata: this.formBuilder.array(metadataFormGroups),
      name: this.formBuilder.control(this.data.name, Validators.required),
      preemptible: this.formBuilder.control(this.data.preemptible === false ? false : true),
      replicas: this.formBuilder.control(
        this.data.replicas || this.replicas[0].value,
        Validators.required,
      ),
      teams: this.formBuilder.control(this.data.teams || false),
      thresholds: this.formBuilder.array(thresholdFormGroups),
    });

    if (!this.hasWriteAuthorization) {
      this.form.disable({ emitEvent: false });
    }

    this.form.valueChanges.subscribe(() => (this.errors = []));

    if (this.data._id) {
      this.updateQueue$ = this.queueState
        .selectMany()
        .pipe(map((qs) => qs.filter((q) => q._id === this.data._id)))
        .subscribe((queues) => (this.data = queues[0]));
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

  private async upsert(values: Partial<QueueModel>) {
    const result = values._id
      ? await this.queueService.update(this.namespaceId, values._id, values)
      : await this.queueService.create(this.namespaceId, values);

    this.matSnackBar.open(`Queue saved successfully.`);
    this.router.navigate(['../', result._id], { relativeTo: this.activatedRoute });

    return result;
  }
}
