import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Params, Router } from '@angular/router';
import {
  AuthorizationQuery,
  BuildModel,
  BuildService,
  IAuthorization,
  IBuild,
  IGameServer,
  IQueue,
  NamespaceModel,
  NamespaceService,
  QueueModel,
  QueueQuery,
  QueueService,
} from '@tenlastic/http';
import { Subscription } from 'rxjs';

import { FormService, IdentityService } from '../../../../../../core/services';
import { ProbeFieldComponent, PromptComponent } from '../../../../../../shared/components';

interface PropertyFormGroup {
  key?: string;
  type?: string;
  value?: any;
}

@Component({
  templateUrl: 'form-page.component.html',
  styleUrls: ['./form-page.component.scss'],
})
export class QueuesFormPageComponent implements OnDestroy, OnInit {
  public builds: BuildModel[];
  public get cpus() {
    return this.namespace.limits.cpu
      ? IQueue.Cpu.filter((r) => r.value <= this.namespace.limits.cpu)
      : IQueue.Cpu;
  }
  public data: QueueModel;
  public errors: string[] = [];
  public form: FormGroup;
  public get gameServerCpus() {
    return this.namespace.limits.cpu
      ? IGameServer.Cpu.filter((r) => r.value <= this.namespace.limits.cpu)
      : IGameServer.Cpu;
  }
  public get gameServerMemories() {
    return this.namespace.limits.memory
      ? IGameServer.Memory.filter((r) => r.value <= this.namespace.limits.memory)
      : IGameServer.Memory;
  }
  public hasWriteAuthorization: boolean;
  public get isNew() {
    return this.params.queueId === 'new';
  }
  public get memories() {
    return this.namespace.limits.memory
      ? IQueue.Memory.filter((r) => r.value <= this.namespace.limits.memory)
      : IQueue.Memory;
  }
  public get ports() {
    return this.form.get('gameServerTemplate').get('ports') as FormArray;
  }
  public get replicas() {
    return IQueue.Replicas;
  }
  public get usersPerTeam() {
    return this.form.get('usersPerTeam') as FormArray;
  }

  private updateQueue$ = new Subscription();
  private namespace: NamespaceModel;
  private params: Params;

  constructor(
    private activatedRoute: ActivatedRoute,
    private authorizationQuery: AuthorizationQuery,
    private buildService: BuildService,
    private formBuilder: FormBuilder,
    private formService: FormService,
    private identityService: IdentityService,
    private matDialog: MatDialog,
    private matSnackBar: MatSnackBar,
    private namespaceService: NamespaceService,
    private queueQuery: QueueQuery,
    private queueService: QueueService,
    private router: Router,
  ) {}

  public ngOnInit() {
    this.activatedRoute.params.subscribe(async (params) => {
      this.params = params;

      const roles = [IAuthorization.Role.QueuesReadWrite];
      const userId = this.identityService.user?._id;
      this.hasWriteAuthorization =
        this.authorizationQuery.hasRoles(null, roles, userId) ||
        this.authorizationQuery.hasRoles(params.namespaceId, roles, userId);

      this.builds = await this.buildService.find(params.namespaceId, {
        select: '-files',
        sort: '-publishedAt',
        where: { namespaceId: params.namespaceId, platform: IBuild.Platform.Server64 },
      });
      this.namespace = await this.namespaceService.findOne(params.namespaceId);

      if (params.queueId !== 'new') {
        this.data = await this.queueService.findOne(params.namespaceId, params.queueId);
      }

      this.setupForm();
    });
  }

  public ngOnDestroy() {
    this.updateQueue$.unsubscribe();
  }

  public navigateToJson() {
    this.formService.navigateToJson(this.form);
  }

  public pushUsersPerTeam(formArray: FormArray) {
    const control = this.formBuilder.control(1, [Validators.min(1), Validators.required]);
    formArray.push(control);
  }

  public async save() {
    this.errors = [];

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const metadata = this.form
      .get('gameServerTemplate')
      .get('metadata')
      .value.reduce((accumulator, property) => {
        accumulator[property.key] = this.getJsonFromProperty(property);
        return accumulator;
      }, {});

    const values: Partial<QueueModel> = {
      _id: this.data._id,
      cpu: this.form.get('cpu').value,
      description: this.form.get('description').value,
      gameServerTemplate: {
        buildId: this.form.get('gameServerTemplate').get('buildId').value,
        cpu: this.form.get('gameServerTemplate').get('cpu').value,
        memory: this.form.get('gameServerTemplate').get('memory').value,
        metadata,
        ports: this.form.get('gameServerTemplate').get('ports').value,
        preemptible: this.form.get('gameServerTemplate').get('preemptible').value,
      },
      memory: this.form.get('memory').value,
      name: this.form.get('name').value,
      namespaceId: this.form.get('namespaceId').value,
      preemptible: this.form.get('preemptible').value,
      replicas: this.form.get('replicas').value,
      thresholds: this.form.get('thresholds').value,
      usersPerTeam: this.form.get('usersPerTeam').value,
    };

    const livenessProbe = ProbeFieldComponent.getJsonFromProbe(
      this.form.get('gameServerTemplate').get('probes').get('liveness').value,
    );
    const readinessProbe = ProbeFieldComponent.getJsonFromProbe(
      this.form.get('gameServerTemplate').get('probes').get('readiness').value,
    );
    if (livenessProbe || readinessProbe) {
      values.gameServerTemplate.probes = { liveness: livenessProbe, readiness: readinessProbe };
    }

    const dirtyFields = this.getDirtyFields();
    if (this.data._id && QueueModel.isRestartRequired(dirtyFields)) {
      const dialogRef = this.matDialog.open(PromptComponent, {
        data: {
          buttons: [
            { color: 'primary', label: 'No' },
            { color: 'accent', label: 'Yes' },
          ],
          message: `These changes require the Queue to be restarted. Is this OK?`,
        },
      });

      dialogRef.afterClosed().subscribe(async (result: string) => {
        if (result === 'Yes') {
          try {
            this.data = await this.upsert(values);
          } catch (e) {
            this.errors = this.formService.handleHttpError(e, { name: 'Name' });
          }
        }
      });
    } else {
      try {
        this.data = await this.upsert(values);
      } catch (e) {
        this.errors = this.formService.handleHttpError(e, { name: 'Name' });
      }
    }
  }

  private getDirtyFields() {
    return Object.keys(this.form.controls).filter((key) => this.form.get(key).dirty);
  }

  private getJsonFromProperty(property: PropertyFormGroup): any {
    switch (property.type) {
      case 'boolean':
        return property.value || false;

      case 'number':
        return isNaN(parseFloat(property.value)) ? 0 : parseFloat(property.value);

      default:
        return property.value || '';
    }
  }

  private getMetadataFormGroups(metadata: any[]) {
    return Object.entries(metadata).map(([key, property]) => {
      let type = 'boolean';
      if (typeof property === 'string' || property instanceof String) {
        type = 'string';
      } else if (typeof property === 'number') {
        type = 'number';
      }

      return this.formBuilder.group({
        key: [key, [Validators.required, Validators.pattern(/^[0-9A-Za-z\-]{2,40}$/)]],
        value: property,
        type,
      });
    });
  }

  private getThresholdFormGroups(thresholds: IQueue.Threshold[]) {
    return thresholds.map((t) => {
      const formControls = t.usersPerTeam.map((upt) =>
        this.formBuilder.control(upt, [Validators.min(1), Validators.required]),
      );

      return this.formBuilder.group({
        seconds: [t.seconds, [Validators.min(1), Validators.required]],
        usersPerTeam: this.formBuilder.array(formControls),
      });
    });
  }

  private setupForm() {
    this.data ??= new QueueModel({ usersPerTeam: [1, 1] });

    const { gameServerTemplate } = this.data;

    const metadataFormGroups = [];
    if (gameServerTemplate?.metadata) {
      metadataFormGroups.push(...this.getMetadataFormGroups(gameServerTemplate.metadata));
    }

    const ports = gameServerTemplate?.ports || [{ port: 7777, protocol: IGameServer.Protocol.Tcp }];
    const portFormGroups = ports.map((p) =>
      this.formBuilder.group({ port: [p.port, Validators.required], protocol: p.protocol }),
    );

    const probesFormGroup = this.formBuilder.group({
      liveness: ProbeFieldComponent.getFormGroupFromProbe(gameServerTemplate?.probes?.liveness),
      readiness: ProbeFieldComponent.getFormGroupFromProbe(gameServerTemplate?.probes?.readiness),
    });

    let gameServerTemplateForm: FormGroup;
    if (gameServerTemplate) {
      gameServerTemplateForm = this.formBuilder.group({
        buildId: [gameServerTemplate.buildId, Validators.required],
        cpu: [gameServerTemplate.cpu || this.cpus[0].value],
        memory: [gameServerTemplate.memory || this.memories[0].value],
        metadata: this.formBuilder.array(metadataFormGroups),
        ports: this.formBuilder.array(portFormGroups),
        preemptible: [gameServerTemplate.preemptible || false],
        probes: probesFormGroup,
      });
    } else {
      gameServerTemplateForm = this.formBuilder.group({
        buildId: [this.builds.length > 0 ? this.builds[0]._id : null, Validators.required],
        cpu: [this.cpus[0].value],
        memory: [this.memories[0].value],
        metadata: this.formBuilder.array(metadataFormGroups),
        ports: this.formBuilder.array(portFormGroups),
        preemptible: [true],
        probes: probesFormGroup,
      });
    }

    const thresholdFormGroups = [];
    if (this.data?.thresholds?.length > 0) {
      thresholdFormGroups.push(...this.getThresholdFormGroups(this.data.thresholds));
    }

    const usersPerTeamFormControls = this.data.usersPerTeam.map((upt) =>
      this.formBuilder.control(upt, [Validators.min(1), Validators.required]),
    );

    this.form = this.formBuilder.group({
      cpu: [this.data.cpu || this.cpus[0].value, Validators.required],
      description: [this.data.description],
      gameServerTemplate: gameServerTemplateForm,
      memory: [this.data.memory || this.memories[0].value, Validators.required],
      name: [this.data.name, Validators.required],
      namespaceId: [this.params.namespaceId],
      preemptible: [this.data.preemptible === false ? false : true],
      replicas: [this.data.replicas || this.replicas[0].value, Validators.required],
      thresholds: this.formBuilder.array(thresholdFormGroups),
      usersPerTeam: this.formBuilder.array(usersPerTeamFormControls, Validators.required),
    });

    if (!this.hasWriteAuthorization) {
      this.form.disable({ emitEvent: false });
    }

    this.form.valueChanges.subscribe(() => (this.errors = []));

    if (this.data._id) {
      this.updateQueue$ = this.queueQuery
        .selectAll({ filterBy: (q) => q._id === this.data._id })
        .subscribe((queues) => (this.data = queues[0]));
    }
  }

  private async upsert(values: Partial<QueueModel>) {
    const result = values._id
      ? await this.queueService.update(this.params.namespaceId, values._id, values)
      : await this.queueService.create(this.params.namespaceId, values);

    this.matSnackBar.open(`Queue saved successfully.`);
    this.router.navigate(['../', result._id], { relativeTo: this.activatedRoute });

    return result;
  }
}
