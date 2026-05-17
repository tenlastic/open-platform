import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import {
  AuthorizationState,
  GameServerTemplateModel,
  GameServerTemplateService,
  IAuthorization,
  IMatch,
  MatchModel,
  MatchService,
  MatchState,
  QueueModel,
  QueueService,
  UserModel,
  UserService,
  UserState,
} from '@tenlastic/http';
import { map, Subscription } from 'rxjs';

import { FormService, IdentityService } from '@home/app/core/services';

export interface MatchForm {
  confirmation: FormControl<boolean>;
  gameServerTemplateId: FormControl<string>;
  invitationSeconds: FormControl<number>;
  queueId: FormControl<string>;
  teams: FormArray<FormGroup<TeamForm>>;
}

export interface TeamForm {
  users: FormArray<FormControl<UserModel>>;
}

@Component({
  standalone: false,
  styleUrls: ['./form-page.component.scss'],
  templateUrl: 'form-page.component.html',
})
export class MatchesFormPageComponent implements OnDestroy, OnInit {
  public data: MatchModel;
  public errors: string[] = [];
  public form: FormGroup<MatchForm>;
  public gameServerTemplates: GameServerTemplateModel[];
  public hasWriteAuthorization: boolean;
  public get isNew() {
    return this.matchId === 'new';
  }
  public isSaving: boolean;
  public queues: QueueModel[];
  public get teams() {
    return this.form.get('teams') as FormArray;
  }

  private updateMatch$ = new Subscription();
  private matchId: string;
  private namespaceId: string;
  private queueId: string;

  constructor(
    private activatedRoute: ActivatedRoute,
    private authorizationState: AuthorizationState,
    private formBuilder: FormBuilder,
    private formService: FormService,
    private gameServerTemplateService: GameServerTemplateService,
    private identityService: IdentityService,
    private matchState: MatchState,
    private matchService: MatchService,
    private matSnackBar: MatSnackBar,
    private queueService: QueueService,
    private router: Router,
    private userState: UserState,
    private userService: UserService,
  ) {}

  public ngOnInit() {
    this.activatedRoute.params.subscribe(async (params) => {
      this.matchId = params.matchId;
      this.namespaceId = params.namespaceId;
      this.queueId = params.queueId;

      const roles = [IAuthorization.Role.MatchesWrite];
      const userId = this.identityService.user?._id;
      this.hasWriteAuthorization =
        this.authorizationState.hasRoles(null, roles, userId) ||
        this.authorizationState.hasRoles(params.namespaceId, roles, userId);

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
    this.isSaving = true;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.isSaving = false;
      return;
    }

    const invitationsExpireAt = this.form.get('confirmation').value
      ? new Date(Date.now() + this.form.get('invitationSeconds').value * 1000)
      : null;
    const teams: IMatch.Team[] = this.form.get('teams').value.map((t, i) => {
      return { index: i, userIds: t.users.map((u) => u._id) };
    });

    const values: Partial<MatchModel> = {
      _id: this.data._id,
      gameServerTemplateId: this.form.get('gameServerTemplateId').value,
      invitationSeconds: this.form.get('invitationSeconds').value,
      invitationsExpireAt,
      namespaceId: this.namespaceId,
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

    this.isSaving = false;
  }

  private setupForm() {
    this.data ??= new MatchModel({
      invitationSeconds: 30,
      invitationsExpireAt: new Date(),
      teams: [{ userIds: [null] }, { userIds: [null] }],
    });

    const teamFormGroups: FormGroup<TeamForm>[] = this.data.teams.map((t) => {
      const users = t.userIds.map((ui) => this.userState.getOne(ui));
      const formControls = users.map((u) => this.formBuilder.control(u, Validators.required));
      const formArray = this.formBuilder.array(formControls);

      return this.formBuilder.group({ users: formArray });
    });

    this.form = this.formBuilder.group({
      confirmation: this.formBuilder.control(Boolean(this.data.invitationsExpireAt) || false),
      gameServerTemplateId: this.formBuilder.control(
        this.data.gameServerTemplateId || this.gameServerTemplates[0]?._id,
        Validators.required,
      ),
      invitationSeconds: this.formBuilder.control(
        this.data.invitationSeconds || 0,
        Validators.required,
      ),
      queueId: this.formBuilder.control({
        disabled: true,
        value: this.data.queueId || this.queueId,
      }),
      teams: this.formBuilder.array(teamFormGroups),
    });

    if (this.queueId) {
      this.form.get('queueId').disable({ emitEvent: false });
    }

    if (!this.hasWriteAuthorization || !this.isNew) {
      this.form.disable({ emitEvent: false });
    }

    this.form.valueChanges.subscribe(() => (this.errors = []));

    if (this.data._id) {
      this.updateMatch$ = this.matchState
        .selectMany()
        .pipe(map((ms) => ms.filter((m) => m._id === this.data._id)))
        .subscribe((matches) => (this.data = matches[0]));
    }
  }

  private async upsert(values: Partial<MatchModel>) {
    const result = values._id
      ? await this.matchService.update(this.namespaceId, values._id, values)
      : await this.matchService.create(this.namespaceId, values);

    this.matSnackBar.open(`Match saved successfully.`);
    this.router.navigate(['../', result._id], { relativeTo: this.activatedRoute });

    return result;
  }
}
