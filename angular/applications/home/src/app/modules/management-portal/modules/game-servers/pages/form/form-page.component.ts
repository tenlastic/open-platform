import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Params } from '@angular/router';
import {
  AuthorizationQuery,
  Build,
  BuildService,
  GameServer,
  GameServerQuery,
  GameServerService,
  IAuthorization,
  IGameServer,
  Namespace,
  NamespaceService,
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
export class GameServersFormPageComponent implements OnDestroy, OnInit {
  public builds: Build[];
  public get cpus() {
    const limits = this.namespace.limits.gameServers;
    const limit = limits.cpu ? limits.cpu : Infinity;
    return limits.cpu ? IGameServer.Cpu.filter((r) => r.value <= limit) : IGameServer.Cpu;
  }
  public data: GameServer;
  public errors: string[] = [];
  public form: FormGroup;
  public hasWriteAuthorization: boolean;
  public get memories() {
    const limits = this.namespace.limits.gameServers;
    const limit = limits.memory ? limits.memory : Infinity;
    return limits.memory ? IGameServer.Memory.filter((r) => r.value <= limit) : IGameServer.Memory;
  }

  private updateGameServer$ = new Subscription();
  private namespace: Namespace;
  private params: Params;

  constructor(
    private activatedRoute: ActivatedRoute,
    private authorizationQuery: AuthorizationQuery,
    private buildService: BuildService,
    private formBuilder: FormBuilder,
    private formService: FormService,
    private gameServerQuery: GameServerQuery,
    private gameServerService: GameServerService,
    private identityService: IdentityService,
    private matDialog: MatDialog,
    private namespaceService: NamespaceService,
  ) {}

  public ngOnInit() {
    this.activatedRoute.params.subscribe(async (params) => {
      this.params = params;

      const roles = [IAuthorization.AuthorizationRole.GameServersReadWrite];
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

      if (params.gameServerId !== 'new') {
        this.data = await this.gameServerService.findOne(params.gameServerId);
      }

      this.setupForm();
    });
  }

  public ngOnDestroy() {
    this.updateGameServer$.unsubscribe();
  }

  public navigateToJson() {
    this.formService.navigateToJson(this.form);
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
      _id: this.data._id,
      buildId: this.form.get('buildId').value,
      cpu: this.form.get('cpu').value,
      description: this.form.get('description').value,
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
            this.data = await this.formService.upsert(this.gameServerService, values);
          } catch (e) {
            this.formService.handleHttpError(e);
          }
        }
      });
    } else {
      try {
        this.data = await this.formService.upsert(this.gameServerService, values);
      } catch (e) {
        this.formService.handleHttpError(e);
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
      memory: [this.data.memory || this.memories[0].value, Validators.required],
      metadata: this.formBuilder.array(metadata),
      name: [this.data.name, Validators.required],
      namespaceId: [this.params.namespaceId, Validators.required],
      persistent: [this.data.persistent === false ? false : true],
      preemptible: [this.data.preemptible === false ? false : true],
    });

    if (!this.hasWriteAuthorization) {
      this.form.disable({ emitEvent: false });
    }

    this.form.valueChanges.subscribe(() => (this.errors = []));

    if (this.data._id) {
      this.updateGameServer$ = this.gameServerQuery
        .selectAll({ filterBy: (gs) => gs._id === this.data._id })
        .subscribe((gameServers) => (this.data = gameServers[0]));
    }
  }
}
