import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import {
  Build,
  BuildService,
  Game,
  GameServer,
  GameServerQuery,
  GameServerService,
  GameService,
  IGameServer,
  Queue,
  QueueService,
} from '@tenlastic/ng-http';
import { Subscription } from 'rxjs';

import { IdentityService, SelectedNamespaceService } from '../../../../../../core/services';
import {
  BreadcrumbsComponentBreadcrumb,
  PromptComponent,
} from '../../../../../../shared/components';

interface PropertyFormGroup {
  key?: string;
  type?: string;
  value?: any;
}

@Component({
  templateUrl: 'form-page.component.html',
  styleUrls: ['./form-page.component.scss'],
})
export class GameServersFormPageComponent implements OnDestroy, OnInit {
  public updateGameServer$ = new Subscription();
  public breadcrumbs: BreadcrumbsComponentBreadcrumb[] = [];
  public builds: Build[];
  public get cpus() {
    const limits = this.selectedNamespaceService.namespace.limits;
    const limit = limits.cpu ? limits.cpu : Infinity;
    return limits.cpu ? IGameServer.Cpu.filter((r) => r.value <= limit) : IGameServer.Cpu;
  }
  public data: GameServer;
  public errors: string[] = [];
  public form: FormGroup;
  public games: Game[];
  public get memories() {
    const limits = this.selectedNamespaceService.namespace.limits;
    const limit = limits.memory ? limits.memory : Infinity;
    return limits.memory ? IGameServer.Memory.filter((r) => r.value <= limit) : IGameServer.Memory;
  }
  public queue: Queue;

  constructor(
    private activatedRoute: ActivatedRoute,
    private buildService: BuildService,
    private formBuilder: FormBuilder,
    private gameServerQuery: GameServerQuery,
    private gameServerService: GameServerService,
    private gameService: GameService,
    public identityService: IdentityService,
    private matDialog: MatDialog,
    private matSnackBar: MatSnackBar,
    private queueService: QueueService,
    private router: Router,
    private selectedNamespaceService: SelectedNamespaceService,
  ) {}

  public ngOnInit() {
    this.activatedRoute.paramMap.subscribe(async (params) => {
      const _id = params.get('_id');

      this.breadcrumbs = [
        { label: 'Game Servers', link: '../' },
        { label: _id === 'new' ? 'Create Game Server' : 'Edit Game Server' },
      ];

      if (_id !== 'new') {
        this.data = await this.gameServerService.findOne(_id);
      }

      this.builds = await this.buildService.find({
        select: '-files',
        sort: '-publishedAt',
        where: { namespaceId: this.selectedNamespaceService.namespaceId, platform: 'server64' },
      });
      this.games = await this.gameService.find({
        sort: 'title',
        where: { namespaceId: this.selectedNamespaceService.namespaceId },
      });

      if (this.data && this.data.queueId) {
        this.queue = await this.queueService.findOne(this.data.queueId);
      }

      this.setupForm();
    });
  }

  public ngOnDestroy() {
    this.updateGameServer$.unsubscribe();
  }

  public navigateToJson() {
    if (this.form.dirty) {
      const dialogRef = this.matDialog.open(PromptComponent, {
        data: {
          buttons: [
            { color: 'primary', label: 'No' },
            { color: 'accent', label: 'Yes' },
          ],
          message: 'Changes will not be saved. Is this OK?',
        },
      });

      dialogRef.afterClosed().subscribe(async (result) => {
        if (result === 'Yes') {
          this.router.navigate([`json`], { relativeTo: this.activatedRoute });
        }
      });
    } else {
      this.router.navigate([`json`], { relativeTo: this.activatedRoute });
    }
  }

  public async save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const metadata = this.form.get('metadata').value.reduce((accumulator, property) => {
      accumulator[property.key] = this.getJsonFromProperty(property);
      return accumulator;
    }, {});

    const values: Partial<GameServer> = {
      buildId: this.form.get('buildId').value,
      cpu: this.form.get('cpu').value,
      description: this.form.get('description').value,
      gameId: this.form.get('gameId').value,
      memory: this.form.get('memory').value,
      metadata,
      name: this.form.get('name').value,
      namespaceId: this.form.get('namespaceId').value,
      persistent: this.form.get('persistent').value,
      preemptible: this.form.get('preemptible').value,
    };

    const dirtyFields = this.getDirtyFields();
    if (this.data._id && GameServer.isRestartRequired(dirtyFields)) {
      const dialogRef = this.matDialog.open(PromptComponent, {
        data: {
          buttons: [
            { color: 'primary', label: 'No' },
            { color: 'accent', label: 'Yes' },
          ],
          message: `These changes require the Game Server to be restarted. Is this OK?`,
        },
      });

      dialogRef.afterClosed().subscribe(async (result: string) => {
        if (result === 'Yes') {
          try {
            await this.upsert(values);
          } catch (e) {
            this.handleHttpError(e);
          }
        }
      });
    } else {
      try {
        await this.upsert(values);
      } catch (e) {
        this.handleHttpError(e);
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

  private async handleHttpError(err: HttpErrorResponse, pathMap: any = {}) {
    this.errors = err.error.errors.map((e) => {
      if (e.name === 'UniqueError') {
        const combination = e.paths.length > 1 ? 'combination ' : '';
        const paths = e.paths.map((p) => pathMap[p]);
        return `${paths.join(' / ')} ${combination}is not unique: ${e.values.join(' / ')}.`;
      } else {
        return e.message;
      }
    });
  }

  private setupForm(): void {
    this.data = this.data || new GameServer();

    const metadata = [];
    if (this.data.metadata) {
      Object.entries(this.data.metadata).forEach(([key, property]) => {
        let type = 'boolean';
        if (typeof property === 'string' || property instanceof String) {
          type = 'string';
        } else if (typeof property === 'number') {
          type = 'number';
        }

        const formGroup = this.formBuilder.group({
          key: [key, [Validators.required, Validators.pattern(/^[0-9A-Za-z\-]{2,40}$/)]],
          value: [property, Validators.required],
          type,
        });
        metadata.push(formGroup);
      });
    }

    this.form = this.formBuilder.group({
      buildId: [this.data.buildId || (this.builds[0] && this.builds[0]._id), Validators.required],
      cpu: [this.data.cpu || this.cpus[0].value, Validators.required],
      description: [this.data.description],
      gameId: [this.data.gameId],
      memory: [this.data.memory || this.memories[0].value, Validators.required],
      metadata: this.formBuilder.array(metadata),
      name: [this.data.name, Validators.required],
      namespaceId: [this.selectedNamespaceService.namespaceId, Validators.required],
      persistent: [this.data.persistent === false ? false : true],
      preemptible: [this.data.preemptible === false ? false : true],
    });

    this.form.valueChanges.subscribe(() => (this.errors = []));

    if (this.data._id) {
      this.updateGameServer$ = this.gameServerQuery
        .selectAll({ filterBy: (gs) => gs._id === this.data._id })
        .subscribe((gameServers) => (this.data = gameServers[0]));
    }
  }

  private async upsert(data: Partial<GameServer>) {
    if (this.data._id) {
      data._id = this.data._id;
      await this.gameServerService.update(data);
    } else {
      await this.gameServerService.create(data);
    }

    this.matSnackBar.open('Game Server saved successfully.');
    this.router.navigate(['../'], { relativeTo: this.activatedRoute });
  }
}
