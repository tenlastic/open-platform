import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Params, Router } from '@angular/router';
import {
  AuthorizationQuery,
  GameServerTemplateModel,
  GameServerTemplateService,
  IAuthorization,
  IMatch,
  MatchModel,
  MatchQuery,
  MatchService,
  QueueModel,
  QueueService,
  UserQuery,
  UserService,
} from '@tenlastic/http';
import { Subscription } from 'rxjs';

import { FormService, IdentityService } from '../../../../../../core/services';

@Component({
  templateUrl: 'form-page.component.html',
  styleUrls: ['./form-page.component.scss'],
})
export class MatchesFormPageComponent implements OnDestroy, OnInit {
  public data: MatchModel;
  public errors: string[] = [];
  public form: FormGroup;
  public gameServerTemplates: GameServerTemplateModel[];
  public hasWriteAuthorization: boolean;
  public get isNew() {
    return this.params.matchId === 'new';
  }
  public queues: QueueModel[];
  public get teams() {
    return this.form.get('teams') as FormArray;
  }

  private updateMatch$ = new Subscription();
  private params: Params;

  constructor(
    private activatedRoute: ActivatedRoute,
    private authorizationQuery: AuthorizationQuery,
    private formBuilder: FormBuilder,
    private formService: FormService,
    private gameServerTemplateService: GameServerTemplateService,
    private identityService: IdentityService,
    private matchQuery: MatchQuery,
    private matchService: MatchService,
    private matSnackBar: MatSnackBar,
    private queueService: QueueService,
    private router: Router,
    private userQuery: UserQuery,
    private userService: UserService,
  ) {}

  public ngOnInit() {
    this.activatedRoute.params.subscribe(async (params) => {
      this.params = params;

      const roles = [IAuthorization.Role.MatchesWrite];
      const userId = this.identityService.user?._id;
      this.hasWriteAuthorization =
        this.authorizationQuery.hasRoles(null, roles, userId) ||
        this.authorizationQuery.hasRoles(params.namespaceId, roles, userId);

      this.gameServerTemplates = await this.gameServerTemplateService.find(params.namespaceId, {});

      if (params.queueId) {
        this.queues = await this.queueService.find(params.namespaceId, {
          limit: 1,
          where: { _id: params.queueId },
        });
      } else {
        this.queues = await this.queueService.find(params.namespaceId, {});
      }

      if (params.matchId !== 'new') {
        this.data = await this.matchService.findOne(params.namespaceId, params.matchId);
        await this.userService.find({ where: { _id: { $in: this.data.userIds } } });
      }

      this.setupForm();
    });
  }

  public ngOnDestroy() {
    this.updateMatch$.unsubscribe();
  }

  public getTeamUsers(index: number) {
    return this.teams.at(index).get('users') as FormArray;
  }

  public navigateToJson() {
    this.formService.navigateToJson(this.form);
  }

  public pushTeam() {
    const formArray = this.formBuilder.array([]);
    this.pushUserToTeam(formArray);

    this.teams.push(this.formBuilder.group({ users: formArray }));
  }

  public pushUserToTeam(formArray: FormArray) {
    const control = this.formBuilder.control(null, Validators.required);
    formArray.push(control);
  }

  public async save() {
    this.errors = [];

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const confirmationExpiresAt = this.form.get('confirmation').value
      ? new Date(Date.now() + this.form.get('invitationSeconds').value * 1000)
      : null;
    const teams: IMatch.Team[] = this.form.get('teams').value.map((t) => {
      return { userIds: t.users.map((u) => u._id) };
    });

    const values: Partial<MatchModel> = {
      _id: this.data._id,
      confirmationExpiresAt,
      gameServerTemplateId: this.form.get('gameServerTemplateId').value,
      invitationSeconds: this.form.get('invitationSeconds').value,
      namespaceId: this.form.get('namespaceId').value,
      queueId: this.form.get('queueId').value,
      teams,
    };

    try {
      this.data = await this.upsert(values);
    } catch (e) {
      this.errors = this.formService.handleHttpError(e, {
        namespaceId: 'Namespace',
        'teams.userIds': 'Team Users',
      });
    }
  }

  private setupForm() {
    this.data ??= new MatchModel({
      confirmationExpiresAt: new Date(),
      invitationSeconds: 30,
      teams: [{ userIds: [null] }, { userIds: [null] }],
    });

    const teamFormGroups = this.data.teams.map((t) => {
      const users = t.userIds.map((ui) => this.userQuery.getEntity(ui));
      const formControls = users.map((u) => this.formBuilder.control(u, Validators.required));
      const formArray = this.formBuilder.array(formControls);

      return this.formBuilder.group({ users: formArray });
    });

    this.form = this.formBuilder.group({
      confirmation: [Boolean(this.data.confirmationExpiresAt) || false],
      gameServerTemplateId: [
        this.data.gameServerTemplateId || this.gameServerTemplates[0]?._id,
        Validators.required,
      ],
      invitationSeconds: [this.data.invitationSeconds || 0, Validators.required],
      namespaceId: [this.params.namespaceId],
      queueId: [{ disabled: true, value: this.data.queueId || this.params.queueId }],
      teams: this.formBuilder.array(teamFormGroups),
    });

    if (this.params.queueId) {
      this.form.get('queueId').disable({ emitEvent: false });
    }

    if (!this.hasWriteAuthorization || !this.isNew) {
      this.form.disable({ emitEvent: false });
    }

    this.form.valueChanges.subscribe(() => (this.errors = []));

    if (this.data._id) {
      this.updateMatch$ = this.matchQuery
        .selectAll({ filterBy: (q) => q._id === this.data._id })
        .subscribe((matches) => (this.data = matches[0]));
    }
  }

  private async upsert(values: Partial<MatchModel>) {
    const result = values._id
      ? await this.matchService.update(this.params.namespaceId, values._id, values)
      : await this.matchService.create(this.params.namespaceId, values);

    this.matSnackBar.open(`Match saved successfully.`);
    this.router.navigate(['../', result._id], { relativeTo: this.activatedRoute });

    return result;
  }
}
