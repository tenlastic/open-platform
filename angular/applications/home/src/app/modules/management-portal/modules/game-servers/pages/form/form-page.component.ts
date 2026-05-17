import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import {
  AuthorizationState,
  BuildModel,
  BuildService,
  GameServerModel,
  GameServerService,
  GameServerState,
  GameServerTemplateModel,
  IAuthorization,
  IBuild,
  IGameServer,
  NamespaceModel,
  NamespaceService,
  SubscriptionService,
  WebSocketService,
} from '@tenlastic/http';
import { map, Subscription } from 'rxjs';
import { v4 as uuid } from 'uuid';

import { FormService, IdentityService, OverlayService } from '@home/app/core/services';
import {
  MetadataForm,
  PortForm,
  ProbeFieldComponent,
  ProbeForm,
  PromptOverlayComponent,
  PromptOverlayComponentData,
} from '@home/app/shared/components';
import { environment } from '@home/environments/environment';

export interface GameServerForm {
  buildId: FormControl<string>;
  cpu: FormControl<number>;
  description: FormControl<string>;
  memory: FormControl<number>;
  metadata: FormArray<FormGroup<MetadataForm>>;
  name: FormControl<string>;
  ports: FormArray<FormGroup<PortForm>>;
  preemptible: FormControl<boolean>;
  probes: FormGroup<ProbesForm>;
  secrets: FormArray<FormGroup<MetadataForm>>;
}

export interface ProbesForm {
  liveness: FormGroup<ProbeForm>;
  readiness: FormGroup<ProbeForm>;
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
export class GameServersFormPageComponent implements OnDestroy, OnInit {
  public builds: BuildModel[];
  public get cpus() {
    return this.namespace.limits.cpu
      ? IGameServer.Cpu.filter((r) => r.value <= this.namespace.limits.cpu)
      : IGameServer.Cpu;
  }
  public data: GameServerModel;
  public errors: string[] = [];
  public form: FormGroup<GameServerForm>;
  public hasWriteAuthorization: boolean;
  public get isNew() {
    return this.gameServerId === 'new';
  }
  public isSaving: boolean;
  public get liveness() {
    return this.form.get('probes').get('liveness');
  }
  public get memories() {
    return this.namespace.limits.memory
      ? IGameServer.Memory.filter((r) => r.value <= this.namespace.limits.memory)
      : IGameServer.Memory;
  }
  public get ports() {
    return this.form.get('ports') as FormArray;
  }
  public get readiness() {
    return this.form.get('probes').get('readiness');
  }

  private updateGameServer$ = new Subscription();
  private gameServerId: string;
  private gameServerTemplate: Partial<GameServerTemplateModel>;
  private namespace: NamespaceModel;
  private namespaceId: string;
  private subscriptions = [
    {
      Model: GameServerModel,
      request: { _id: uuid(), path: `/subscriptions/game-servers` },
      service: this.gameServerService,
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
    private buildService: BuildService,
    private formBuilder: FormBuilder,
    private formService: FormService,
    private gameServerState: GameServerState,
    private gameServerService: GameServerService,
    private identityService: IdentityService,
    private matSnackBar: MatSnackBar,
    private namespaceService: NamespaceService,
    private overlayService: OverlayService,
    private router: Router,
    private subscriptionService: SubscriptionService,
    private webSocketService: WebSocketService,
  ) {
    const navigation = this.router.currentNavigation();
    this.gameServerTemplate = navigation?.extras?.state?.gameServerTemplate;
  }

  public ngOnInit() {
    this.activatedRoute.params.subscribe(async (params) => {
      this.gameServerId = params.gameServerId;
      this.namespaceId = params.namespaceId;

      const roles = [IAuthorization.Role.GameServersWrite];
      const userId = this.identityService.user?._id;
      this.hasWriteAuthorization =
        this.authorizationState.hasRoles(null, roles, userId) ||
        this.authorizationState.hasRoles(params.namespaceId, roles, userId);

      this.builds = await this.buildService.find(params.namespaceId, {
        select: '-files -reference.files',
        sort: '-publishedAt',
        where: { namespaceId: params.namespaceId, platform: IBuild.Platform.Server64 },
      });
      this.namespace = await this.namespaceService.findOne(params.namespaceId);

      if (params.gameServerId !== 'new') {
        this.data = await this.gameServerService.findOne(params.namespaceId, params.gameServerId);
      }

      this.setupForm();

      await this.unsubscribe();
      await this.subscribe();
    });
  }

  public async ngOnDestroy() {
    this.updateGameServer$.unsubscribe();
    await this.unsubscribe();
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

    const metadata = this.form.get('metadata').value.reduce((accumulator, property) => {
      accumulator[property.key] = this.getJsonFromProperty(property);
      return accumulator;
    }, {});
    const secrets = this.form.get('secrets').value.reduce((accumulator, property) => {
      accumulator[property.key] = this.getJsonFromProperty(property);
      return accumulator;
    }, {});

    const values: Partial<GameServerModel> = {
      _id: this.data._id,
      buildId: this.form.get('buildId').value,
      cpu: this.form.get('cpu').value,
      description: this.form.get('description').value,
      memory: this.form.get('memory').value,
      metadata,
      name: this.form.get('name').value,
      namespaceId: this.namespaceId,
      ports: this.form.get('ports').value,
      preemptible: this.form.get('preemptible').value,
      secrets,
    };

    const livenessProbe = ProbeFieldComponent.getJsonFromProbe(
      this.form.get('probes').get('liveness').value,
    );
    const readinessProbe = ProbeFieldComponent.getJsonFromProbe(
      this.form.get('probes').get('readiness').value,
    );
    if (livenessProbe || readinessProbe) {
      values.probes = { liveness: livenessProbe, readiness: readinessProbe };
    }

    const dirtyFields = this.getDirtyFields();
    if (this.data._id && GameServerModel.isRestartRequired(dirtyFields)) {
      const overlay = this.overlayService.open<PromptOverlayComponentData, string>(
        PromptOverlayComponent,
        {
          buttons: [
            { color: 'primary', label: 'No' },
            { color: 'accent', label: 'Yes' },
          ],
          message: `These changes require the Game Server to be restarted. Is this OK?`,
        },
      );

      overlay.$close.subscribe(async (result: string) => {
        if (result === 'Yes') {
          this.isSaving = true;

          try {
            this.data = await this.upsert(values);
          } catch (e) {
            this.errors = this.formService.handleHttpError(e);
          }

          this.isSaving = false;
        }
      });
    } else {
      this.isSaving = true;

      try {
        this.data = await this.upsert(values);
      } catch (e) {
        this.errors = this.formService.handleHttpError(e);
      }

      this.isSaving = false;
    }
  }

  private getDirtyFields() {
    return Object.keys(this.form.controls).filter((key) => this.form.get(key).dirty);
  }

  private getFormGroups(input: unknown) {
    const formGroups: FormGroup[] = [];

    if (input) {
      Object.entries(input).forEach(([key, property]) => {
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
        formGroups.push(formGroup);
      });
    }

    return formGroups;
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

  private setupForm() {
    this.data ??= this.gameServerTemplate?.toGameServer() ?? new GameServerModel();

    const metadataFormGroups = this.getFormGroups(this.data.metadata);

    const ports = this.data.ports || [{ port: 7777, protocol: IGameServer.Protocol.Tcp }];
    const portFormGroups = ports.map((p) =>
      this.formBuilder.group<PortForm>({
        port: this.formBuilder.control(p.port, Validators.required),
        protocol: this.formBuilder.control(p.protocol),
      }),
    );

    const secretsFormGroups = this.getFormGroups(this.data.secrets);

    this.form = this.formBuilder.group({
      buildId: this.formBuilder.control(
        this.data.buildId || this.builds[0]?._id,
        Validators.required,
      ),
      cpu: this.formBuilder.control(this.data.cpu || this.cpus[0].value, Validators.required),
      description: this.formBuilder.control(this.data.description),
      memory: this.formBuilder.control(
        this.data.memory || this.memories[0].value,
        Validators.required,
      ),
      metadata: this.formBuilder.array(metadataFormGroups),
      name: this.formBuilder.control(this.data.name, Validators.required),
      ports: this.formBuilder.array(portFormGroups, Validators.required),
      preemptible: this.formBuilder.control(this.data.preemptible === false ? false : true),
      probes: this.formBuilder.group<ProbesForm>({
        liveness: ProbeFieldComponent.getFormGroupFromProbe(this.data.probes?.liveness),
        readiness: ProbeFieldComponent.getFormGroupFromProbe(this.data.probes?.readiness),
      }),
      secrets: this.formBuilder.array(secretsFormGroups),
    });

    if (!this.hasWriteAuthorization) {
      this.form.disable({ emitEvent: false });
    }

    this.form.valueChanges.subscribe(() => (this.errors = []));

    if (this.data._id) {
      this.updateGameServer$ = this.gameServerState
        .selectMany()
        .pipe(map((gss) => gss.filter((gs) => gs._id === this.data._id)))
        .subscribe((gss) => (this.data = gss[0]));
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

  private async upsert(values: Partial<GameServerModel>) {
    const result = values._id
      ? await this.gameServerService.update(this.namespaceId, values._id, values)
      : await this.gameServerService.create(this.namespaceId, values);

    this.matSnackBar.open(`Game Server saved successfully.`);
    this.router.navigate(['../', result._id], { relativeTo: this.activatedRoute });

    return result;
  }
}
