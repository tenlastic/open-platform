import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Params, Router } from '@angular/router';
import {
  AuthorizationQuery,
  BuildModel,
  BuildService,
  GameServerTemplateModel,
  GameServerTemplateQuery,
  GameServerTemplateService,
  IAuthorization,
  IBuild,
  IGameServer,
  NamespaceModel,
  NamespaceService,
} from '@tenlastic/http';
import { Subscription } from 'rxjs';

import { FormService, IdentityService } from '../../../../../../core/services';
import { ProbeFieldComponent } from '../../../../../../shared/components';

interface PropertyFormGroup {
  key?: string;
  type?: string;
  value?: any;
}

@Component({
  templateUrl: 'form-page.component.html',
  styleUrls: ['./form-page.component.scss'],
})
export class GameServerTemplatesFormPageComponent implements OnDestroy, OnInit {
  public builds: BuildModel[];
  public get cpus() {
    return this.namespace.limits.cpu
      ? IGameServer.Cpu.filter((r) => r.value <= this.namespace.limits.cpu)
      : IGameServer.Cpu;
  }
  public data: GameServerTemplateModel;
  public errors: string[] = [];
  public form: FormGroup;
  public hasWriteAuthorization: boolean;
  public get isNew() {
    return this.params.gameServerTemplateId === 'new';
  }
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

  private updateGameServerTemplate$ = new Subscription();
  private namespace: NamespaceModel;
  private params: Params;

  constructor(
    private activatedRoute: ActivatedRoute,
    private authorizationQuery: AuthorizationQuery,
    private buildService: BuildService,
    private formBuilder: FormBuilder,
    private formService: FormService,
    private gameServerTemplateQuery: GameServerTemplateQuery,
    private gameServerTemplateService: GameServerTemplateService,
    private identityService: IdentityService,
    private matSnackBar: MatSnackBar,
    private namespaceService: NamespaceService,
    private router: Router,
  ) {}

  public ngOnInit() {
    this.activatedRoute.params.subscribe(async (params) => {
      this.params = params;

      const roles = [IAuthorization.Role.GameServersReadWrite];
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

      if (params.gameServerTemplateId !== 'new') {
        this.data = await this.gameServerTemplateService.findOne(
          params.namespaceId,
          params.gameServerTemplateId,
        );
      }

      this.setupForm();
    });
  }

  public ngOnDestroy() {
    this.updateGameServerTemplate$.unsubscribe();
  }

  public navigateToGameServerForm() {
    this.router.navigate(['../../', 'game-servers', 'new'], {
      relativeTo: this.activatedRoute,
      state: { gameServerTemplate: new GameServerTemplateModel(this.data) },
    });
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

    const values: Partial<GameServerTemplateModel> = {
      _id: this.data._id,
      buildId: this.form.get('buildId').value,
      cpu: this.form.get('cpu').value,
      description: this.form.get('description').value,
      memory: this.form.get('memory').value,
      metadata,
      name: this.form.get('name').value,
      namespaceId: this.form.get('namespaceId').value,
      persistent: this.form.get('persistent').value,
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

    try {
      this.data = await this.upsert(values);
    } catch (e) {
      this.errors = this.formService.handleHttpError(e);
    }
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
    this.data ??= new GameServerTemplateModel();

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
      persistent: [this.data.persistent === false ? false : true],
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
      this.updateGameServerTemplate$ = this.gameServerTemplateQuery
        .selectAll({ filterBy: (gs) => gs._id === this.data._id })
        .subscribe((gsts) => (this.data = gsts[0]));
    }
  }

  private async upsert(values: Partial<GameServerTemplateModel>) {
    const result = values._id
      ? await this.gameServerTemplateService.update(this.params.namespaceId, values._id, values)
      : await this.gameServerTemplateService.create(this.params.namespaceId, values);

    this.matSnackBar.open(`Game Server Template saved successfully.`);
    this.router.navigate(['../', result._id], { relativeTo: this.activatedRoute });

    return result;
  }
}
