import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Params, Router } from '@angular/router';
import {
  AuthorizationQuery,
  GameServerTemplateModel,
  GameServerTemplateService,
  IAuthorization,
  IQueue,
  NamespaceModel,
  NamespaceService,
  QueueModel,
  QueueQuery,
  QueueService,
} from '@tenlastic/http';
import { Subscription } from 'rxjs';

import { FormService, IdentityService } from '../../../../../../core/services';
import { PromptComponent } from '../../../../../../shared/components';

@Component({
  templateUrl: 'form-page.component.html',
  styleUrls: ['./form-page.component.scss'],
})
export class QueuesFormPageComponent implements OnDestroy, OnInit {
  public get cpus() {
    return this.namespace.limits.cpu
      ? IQueue.Cpu.filter((r) => r.value <= this.namespace.limits.cpu)
      : IQueue.Cpu;
  }
  public data: QueueModel;
  public errors: string[] = [];
  public form: FormGroup;
  public gameServerTemplates: GameServerTemplateModel[];
  public hasWriteAuthorization: boolean;
  public get isNew() {
    return this.params.queueId === 'new';
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
  public get usersPerTeam() {
    return this.form.get('usersPerTeam') as FormArray;
  }

  private updateQueue$ = new Subscription();
  private namespace: NamespaceModel;
  private params: Params;

  constructor(
    private activatedRoute: ActivatedRoute,
    private authorizationQuery: AuthorizationQuery,
    private formBuilder: FormBuilder,
    private formService: FormService,
    private gameServerTemplateService: GameServerTemplateService,
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

      const roles = [IAuthorization.Role.QueuesWrite];
      const userId = this.identityService.user?._id;
      this.hasWriteAuthorization =
        this.authorizationQuery.hasRoles(null, roles, userId) ||
        this.authorizationQuery.hasRoles(params.namespaceId, roles, userId);

      this.gameServerTemplates = await this.gameServerTemplateService.find(params.namespaceId, {});
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
    this.isSaving = true;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.isSaving = false;
      return;
    }

    const values: Partial<QueueModel> = {
      _id: this.data._id,
      confirmation: this.form.get('confirmation').value,
      cpu: this.form.get('cpu').value,
      description: this.form.get('description').value,
      gameServerTemplateId: this.form.get('gameServerTemplateId').value,
      invitationSeconds: this.form.get('invitationSeconds').value,
      memory: this.form.get('memory').value,
      name: this.form.get('name').value,
      namespaceId: this.form.get('namespaceId').value,
      preemptible: this.form.get('preemptible').value,
      replicas: this.form.get('replicas').value,
      thresholds: this.form.get('thresholds').value,
      usersPerTeam: this.form.get('usersPerTeam').value,
    };

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

          this.isSaving = false;
        }
      });
    } else {
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
    this.data ??= new QueueModel({
      confirmation: true,
      invitationSeconds: 30,
      usersPerTeam: [1, 1],
    });

    const thresholdFormGroups = [];
    if (this.data?.thresholds?.length > 0) {
      thresholdFormGroups.push(...this.getThresholdFormGroups(this.data.thresholds));
    }

    const usersPerTeamFormControls = this.data.usersPerTeam.map((upt) =>
      this.formBuilder.control(upt, [Validators.min(1), Validators.required]),
    );

    this.form = this.formBuilder.group({
      confirmation: [this.data.confirmation || false],
      cpu: [this.data.cpu || this.cpus[0].value, Validators.required],
      description: [this.data.description],
      gameServerTemplateId: [
        this.data.gameServerTemplateId || this.gameServerTemplates[0]?._id,
        Validators.required,
      ],
      invitationSeconds: [this.data.invitationSeconds || 0],
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
