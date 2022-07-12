import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Params } from '@angular/router';
import {
  AuthorizationQuery,
  Build,
  BuildService,
  IAuthorization,
  IGameServer,
  IQueue,
  Namespace,
  NamespaceService,
  Queue,
  QueueQuery,
  QueueService,
} from '@tenlastic/ng-http';
import { Subscription } from 'rxjs';

import { FormService, IdentityService } from '../../../../../../core/services';
import { PromptComponent } from '../../../../../../shared/components';

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
  public builds: Build[];
  public components = {
    application: 'Application',
    redis: 'Redis',
    sidecar: 'Sidecar',
  };
  public get cpus() {
    const limits = this.namespace.limits.queues;
    const limit = limits.cpu ? limits.cpu : Infinity;
    return limits.cpu ? IQueue.Cpu.filter((r) => r.value <= limit) : IQueue.Cpu;
  }
  public data: Queue;
  public errors: string[] = [];
  public form: FormGroup;
  public get gameServerCpus() {
    const limits = this.namespace.limits.gameServers;
    const limit = limits.cpu ? limits.cpu : Infinity;
    return limits.cpu ? IGameServer.Cpu.filter((r) => r.value <= limit) : IGameServer.Cpu;
  }
  public get gameServerMemories() {
    const limits = this.namespace.limits.gameServers;
    const limit = limits.memory ? limits.memory : Infinity;
    return limits.memory ? IGameServer.Memory.filter((r) => r.value <= limit) : IGameServer.Memory;
  }
  public hasWriteAuthorization: boolean;
  public get memories() {
    const limits = this.namespace.limits.queues;
    const limit = limits.memory ? limits.memory : Infinity;
    return limits.memory ? IQueue.Memory.filter((r) => r.value <= limit) : IQueue.Memory;
  }
  public get replicas() {
    const limits = this.namespace.limits.queues;
    const limit = limits.replicas ? limits.replicas : Infinity;
    return limits.replicas ? IQueue.Replicas.filter((r) => r.value <= limit) : IQueue.Replicas;
  }

  private updateQueue$ = new Subscription();
  private namespace: Namespace;
  private params: Params;

  constructor(
    private activatedRoute: ActivatedRoute,
    private authorizationQuery: AuthorizationQuery,
    private buildService: BuildService,
    private formBuilder: FormBuilder,
    private formService: FormService,
    private identityService: IdentityService,
    private matDialog: MatDialog,
    private namespaceService: NamespaceService,
    private queueQuery: QueueQuery,
    private queueService: QueueService,
  ) {}

  public ngOnInit() {
    this.activatedRoute.params.subscribe(async (params) => {
      this.params = params;

      const roles = [IAuthorization.AuthorizationRole.QueuesReadWrite];
      const userId = this.identityService.user?._id;
      this.hasWriteAuthorization =
        this.authorizationQuery.hasRoles(null, roles, userId) ||
        this.authorizationQuery.hasRoles(params.namespaceId, roles, userId);

      this.builds = await this.buildService.find({
        select: '-files',
        sort: '-publishedAt',
        where: { namespaceId: params.namespaceId, platform: 'server64' },
      });
      this.namespace = await this.namespaceService.findOne(params.namespaceId);

      if (params.queueId !== 'new') {
        this.data = await this.queueService.findOne(params.queueId);
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

  public async save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const gameServerMetadata = this.form
      .get('gameServerTemplate')
      .get('metadata')
      .value.reduce((accumulator, property) => {
        accumulator[property.key] = this.getJsonFromProperty(property);
        return accumulator;
      }, {});

    const metadata = this.form.get('metadata').value.reduce((accumulator, property) => {
      accumulator[property.key] = this.getJsonFromProperty(property);
      return accumulator;
    }, {});

    const values: Partial<Queue> = {
      buildId: this.form.get('buildId').value,
      cpu: this.form.get('cpu').value,
      description: this.form.get('description').value,
      gameServerTemplate: {
        buildId: this.form.get('gameServerTemplate').get('buildId').value,
        cpu: this.form.get('gameServerTemplate').get('cpu').value,
        memory: this.form.get('gameServerTemplate').get('memory').value,
        metadata: gameServerMetadata,
        preemptible: this.form.get('gameServerTemplate').get('preemptible').value,
      },
      memory: this.form.get('memory').value,
      metadata,
      name: this.form.get('name').value,
      namespaceId: this.form.get('namespaceId').value,
      preemptible: this.form.get('preemptible').value,
      replicas: this.form.get('replicas').value,
      usersPerTeam: this.form.get('usersPerTeam').value,
      teams: this.form.get('teams').value,
    };

    const dirtyFields = this.getDirtyFields();
    if (this.data._id && Queue.isRestartRequired(dirtyFields)) {
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
            this.data = await this.formService.upsert(this.queueService, values);
          } catch (e) {
            this.formService.handleHttpError(e, { name: 'Name' });
          }
        }
      });
    } else {
      try {
        this.data = await this.formService.upsert(this.queueService, values);
      } catch (e) {
        this.formService.handleHttpError(e, { name: 'Name' });
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

  private setupForm(): void {
    this.data = this.data || new Queue();

    const gameServerMetadata = [];
    if (this.data.gameServerTemplate && this.data.gameServerTemplate.metadata) {
      gameServerMetadata.push(...this.getMetadataFormGroups(this.data.gameServerTemplate.metadata));
    }

    let gameServerTemplateForm: FormGroup;
    if (this.data.gameServerTemplate) {
      gameServerTemplateForm = this.formBuilder.group({
        buildId: [this.data.gameServerTemplate.buildId, Validators.required],
        cpu: [this.data.gameServerTemplate.cpu || this.cpus[0].value],
        memory: [this.data.gameServerTemplate.memory || this.memories[0].value],
        metadata: this.formBuilder.array(gameServerMetadata),
        preemptible: [this.data.gameServerTemplate.preemptible || false],
      });
    } else {
      gameServerTemplateForm = this.formBuilder.group({
        buildId: [this.builds.length > 0 ? this.builds[0]._id : null, Validators.required],
        cpu: [this.cpus[0].value],
        memory: [this.memories[0].value],
        metadata: this.formBuilder.array(gameServerMetadata),
        preemptible: [true],
      });
    }

    const metadata = [];
    if (this.data && this.data.metadata) {
      metadata.push(...this.getMetadataFormGroups(this.data.metadata));
    }

    this.form = this.formBuilder.group({
      buildId: [this.data.buildId],
      cpu: [this.data.cpu || this.cpus[0].value, Validators.required],
      description: [this.data.description],
      gameServerTemplate: gameServerTemplateForm,
      memory: [this.data.memory || this.memories[0].value, Validators.required],
      metadata: this.formBuilder.array(metadata),
      name: [this.data.name, Validators.required],
      namespaceId: [this.params.namespaceId],
      preemptible: [this.data.preemptible === false ? false : true],
      replicas: [this.data.replicas || this.replicas[0].value, Validators.required],
      usersPerTeam: [this.data.usersPerTeam || 1, Validators.required],
      teams: [this.data.teams || 2, Validators.required],
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
}
