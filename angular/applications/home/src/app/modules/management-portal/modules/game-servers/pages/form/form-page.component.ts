import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Params, Router } from '@angular/router';
import {
  AuthorizationQuery,
  BuildModel,
  BuildService,
  GameServerModel,
  GameServerQuery,
  GameServerService,
  GameServerTemplateModel,
  IAuthorization,
  IBuild,
  IGameServer,
  NamespaceModel,
  NamespaceService,
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
export class GameServersFormPageComponent implements OnDestroy, OnInit {
  public builds: BuildModel[];
  public get cpus() {
    return this.namespace.limits.cpu
      ? IGameServer.Cpu.filter((r) => r.value <= this.namespace.limits.cpu)
      : IGameServer.Cpu;
  }
  public data: GameServerModel;
  public errors: string[] = [];
  public form: FormGroup;
  public hasWriteAuthorization: boolean;
  public get isNew() {
    return this.params.gameServerId === 'new';
  }
  public isSaving: boolean;
  public get liveness() {
    return this.form.get('probes').get('liveness') as FormGroup;
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
    return this.form.get('probes').get('readiness') as FormGroup;
  }

  private updateGameServer$ = new Subscription();
  private gameServerTemplate: Partial<GameServerTemplateModel>;
  private namespace: NamespaceModel;
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
    private matSnackBar: MatSnackBar,
    private namespaceService: NamespaceService,
    private router: Router,
  ) {
    const navigation = this.router.getCurrentNavigation();
    this.gameServerTemplate = navigation?.extras?.state?.gameServerTemplate;
  }

  public ngOnInit() {
    this.activatedRoute.params.subscribe(async (params) => {
      this.params = params;

      const roles = [IAuthorization.Role.GameServersWrite];
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

      if (params.gameServerId !== 'new') {
        this.data = await this.gameServerService.findOne(params.namespaceId, params.gameServerId);
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
    this.errors = [];
    this.isSaving = true;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.isSaving = false;
      return;
    }

    const metadata = this.form.get('metadata').value.reduce((accumulator, property) => {
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
      namespaceId: this.form.get('namespaceId').value,
      ports: this.form.get('ports').value,
      preemptible: this.form.get('preemptible').value,
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
            this.data = await this.upsert(values);
          } catch (e) {
            this.errors = this.formService.handleHttpError(e);
          }

          this.isSaving = false;
        }
      });
    } else {
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

    const metadataFormGroups = [];
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
        metadataFormGroups.push(formGroup);
      });
    }

    const ports = this.data.ports || [{ port: 7777, protocol: IGameServer.Protocol.Tcp }];
    const portFormGroups = ports.map((p) =>
      this.formBuilder.group({ port: [p.port, Validators.required], protocol: p.protocol }),
    );

    this.form = this.formBuilder.group({
      buildId: [this.data.buildId || (this.builds[0] && this.builds[0]._id), Validators.required],
      cpu: [this.data.cpu || this.cpus[0].value, Validators.required],
      description: [this.data.description],
      memory: [this.data.memory || this.memories[0].value, Validators.required],
      metadata: this.formBuilder.array(metadataFormGroups),
      name: [this.data.name, Validators.required],
      namespaceId: [this.params.namespaceId, Validators.required],
      ports: this.formBuilder.array(portFormGroups, Validators.required),
      preemptible: [this.data.preemptible === false ? false : true],
      probes: this.formBuilder.group({
        liveness: ProbeFieldComponent.getFormGroupFromProbe(this.data.probes?.liveness),
        readiness: ProbeFieldComponent.getFormGroupFromProbe(this.data.probes?.readiness),
      }),
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

  private async upsert(values: Partial<GameServerModel>) {
    const result = values._id
      ? await this.gameServerService.update(this.params.namespaceId, values._id, values)
      : await this.gameServerService.create(this.params.namespaceId, values);

    this.matSnackBar.open(`Game Server saved successfully.`);
    this.router.navigate(['../', result._id], { relativeTo: this.activatedRoute });

    return result;
  }
}
