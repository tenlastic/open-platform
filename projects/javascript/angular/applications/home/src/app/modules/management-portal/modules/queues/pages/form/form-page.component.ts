import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatSnackBar } from '@angular/material';
import { ActivatedRoute, Router } from '@angular/router';
import {
  Build,
  BuildService,
  Game,
  GameService,
  IQueue,
  Queue,
  QueueQuery,
  QueueService,
} from '@tenlastic/ng-http';
import { Subscription } from 'rxjs';

import { IdentityService, SelectedNamespaceService } from '../../../../../../core/services';
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
  public get cpus() {
    const limits = this.selectedNamespaceService.namespace.limits.databases;
    const limit = limits.cpu ? limits.cpu : Infinity;
    return limits.cpu ? IQueue.Cpu.filter(r => r.value <= limit) : IQueue.Cpu;
  }
  public data: Queue;
  public errors: string[] = [];
  public form: FormGroup;
  public games: Game[];
  public get memories() {
    const limits = this.selectedNamespaceService.namespace.limits.databases;
    const limit = limits.memory ? limits.memory : Infinity;
    return limits.memory ? IQueue.Memory.filter(r => r.value <= limit) : IQueue.Memory;
  }
  public get replicas() {
    const limits = this.selectedNamespaceService.namespace.limits.databases;
    const limit = limits.replicas ? limits.replicas : Infinity;
    return this.data && this.data.replicas
      ? IQueue.Replicas.filter(r => r.value <= limit && r.value >= this.data.replicas)
      : IQueue.Replicas;
  }

  private updateQueue$ = new Subscription();

  constructor(
    private activatedRoute: ActivatedRoute,
    private buildService: BuildService,
    private formBuilder: FormBuilder,
    private gameService: GameService,
    public identityService: IdentityService,
    private matDialog: MatDialog,
    private matSnackBar: MatSnackBar,
    private queueQuery: QueueQuery,
    private queueService: QueueService,
    private router: Router,
    public selectedNamespaceService: SelectedNamespaceService,
  ) {}

  public ngOnInit() {
    this.activatedRoute.paramMap.subscribe(async params => {
      const _id = params.get('_id');
      if (_id !== 'new') {
        this.data = await this.queueService.findOne(_id);
      }

      this.builds = await this.buildService.find({
        select: '-files',
        sort: '-publishedAt',
        where: { namespaceId: this.selectedNamespaceService.namespaceId },
      });
      this.games = await this.gameService.find({
        sort: 'title',
        where: { namespaceId: this.selectedNamespaceService.namespaceId },
      });

      this.setupForm();
    });
  }

  public ngOnDestroy() {
    this.updateQueue$.unsubscribe();
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
      gameId: this.form.get('gameId').value,
      gameServerTemplate: {
        buildId: this.form.get('gameServerTemplate').get('buildId').value,
        cpu: this.form.get('gameServerTemplate').get('cpu').value,
        isPreemptible: this.form.get('gameServerTemplate').get('isPreemptible').value,
        memory: this.form.get('gameServerTemplate').get('memory').value,
        metadata: gameServerMetadata,
      },
      isPreemptible: this.form.get('isPreemptible').value,
      memory: this.form.get('memory').value,
      metadata,
      name: this.form.get('name').value,
      namespaceId: this.form.get('namespaceId').value,
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
        isPreemptible: [this.data.gameServerTemplate.isPreemptible || false],
        memory: [this.data.gameServerTemplate.memory || this.memories[0].value],
        metadata: this.formBuilder.array(gameServerMetadata),
      });
    } else {
      gameServerTemplateForm = this.formBuilder.group({
        buildId: [this.builds.length > 0 ? this.builds[0]._id : null, Validators.required],
        cpu: [this.cpus[0].value],
        isPreemptible: [true],
        memory: [this.memories[0].value],
        metadata: this.formBuilder.array(gameServerMetadata),
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
      gameId: [this.data.gameId],
      gameServerTemplate: gameServerTemplateForm,
      isPreemptible: [this.data.isPreemptible === false ? false : true],
      memory: [this.data.memory || this.memories[0].value, Validators.required],
      metadata: this.formBuilder.array(metadata),
      name: [this.data.name, Validators.required],
      namespaceId: [this.selectedNamespaceService.namespaceId],
      replicas: [this.data.replicas || this.replicas[0].value, Validators.required],
      usersPerTeam: [this.data.usersPerTeam || 1, Validators.required],
      teams: [this.data.teams || 2, Validators.required],
    });

    this.form.valueChanges.subscribe(() => (this.errors = []));

    if (this.data._id) {
      this.form.get('replicas').disable({ emitEvent: false });

      this.updateQueue$ = this.queueQuery
        .selectAll({ filterBy: q => q._id === this.data._id })
        .subscribe(queues => {
          const queue = new Queue(queues[0]);
          this.data.status = queue.status;
        });
    }
  }

  private async upsert(data: Partial<Queue>) {
    if (this.data._id) {
      data._id = this.data._id;
      await this.queueService.update(data);
    } else {
      await this.queueService.create(data);
    }

    this.matSnackBar.open('Queue saved successfully.');
    this.router.navigate(['../'], { relativeTo: this.activatedRoute });
  }
}
