import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatSnackBar } from '@angular/material';
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
export class GameServersFormPageComponent implements OnDestroy, OnInit {
  public updateGameServer$ = new Subscription();
  public builds: Build[];
  public cpus = IGameServer.Cpu;
  public data: GameServer;
  public errors: string[] = [];
  public form: FormGroup;
  public games: Game[];
  public memories = IGameServer.Memory;
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
    this.activatedRoute.paramMap.subscribe(async params => {
      const _id = params.get('_id');
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
      isPersistent: this.form.get('isPersistent').value,
      isPreemptible: this.form.get('isPreemptible').value,
      memory: this.form.get('memory').value,
      metadata,
      name: this.form.get('name').value,
      namespaceId: this.form.get('namespaceId').value,
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

  private async handleHttpError(err: HttpErrorResponse, pathMap: any = {}) {
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
    this.data = this.data || new GameServer();

    const properties = [];
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
        properties.push(formGroup);
      });
    }

    this.form = this.formBuilder.group({
      buildId: [this.data.buildId || (this.builds[0] && this.builds[0]._id), Validators.required],
      cpu: [this.data.cpu || this.cpus[0].value, Validators.required],
      description: [this.data.description],
      gameId: [this.data.gameId],
      isPersistent: [this.data.isPersistent === false ? false : true],
      isPreemptible: [this.data.isPreemptible === false ? false : true],
      memory: [this.data.memory || this.memories[0].value, Validators.required],
      metadata: this.formBuilder.array(properties),
      name: [this.data.name, Validators.required],
      namespaceId: [this.selectedNamespaceService.namespaceId, Validators.required],
    });

    this.form.valueChanges.subscribe(() => (this.errors = []));

    if (this.data._id) {
      this.updateGameServer$ = this.gameServerQuery
        .selectAll({ filterBy: gs => gs._id === this.data._id })
        .subscribe(gameServers => {
          const gameServer = new GameServer(gameServers[0]);
          this.data.endpoints = gameServer.endpoints;
          this.data.status = gameServer.status;
        });
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
