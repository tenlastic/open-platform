import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Params, Router } from '@angular/router';
import {
  AuthorizationQuery,
  IAuthorization,
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
  public hasWriteAuthorization: boolean;
  public get isNew() {
    return this.params.matchId === 'new';
  }
  public queues: QueueModel[];
  public get users() {
    return this.form.get('users') as FormArray;
  }

  private updateMatch$ = new Subscription();
  private params: Params;

  constructor(
    private activatedRoute: ActivatedRoute,
    private authorizationQuery: AuthorizationQuery,
    private formBuilder: FormBuilder,
    private formService: FormService,
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

      const roles = [IAuthorization.Role.MatchesReadWrite];
      const userId = this.identityService.user?._id;
      this.hasWriteAuthorization =
        this.authorizationQuery.hasRoles(null, roles, userId) ||
        this.authorizationQuery.hasRoles(params.namespaceId, roles, userId);

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

  public navigateToJson() {
    this.formService.navigateToJson(this.form);
  }

  public async save() {
    this.errors = [];

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const values: Partial<MatchModel> = {
      _id: this.data._id,
      namespaceId: this.form.get('namespaceId').value,
      queueId: this.form.get('queueId').value,
      teams: this.form.get('teams').value,
      userIds: this.form.get('users').value.map((u) => u?._id),
      usersPerTeam: this.form.get('usersPerTeam').value,
    };

    try {
      this.data = await this.upsert(values);
    } catch (e) {
      this.errors = this.formService.handleHttpError(e, { name: 'Name' });
    }
  }

  private setupForm(): void {
    this.data = this.data || new MatchModel();

    const teams = this.data.teams || 2;
    const usersPerTeam = this.data.usersPerTeam || 1;

    let users = Array(teams * usersPerTeam).fill(null);
    if (this.data.userIds) {
      users = this.data.userIds.map((ui) => this.userQuery.getEntity(ui));
    }

    this.form = this.formBuilder.group({
      namespaceId: [this.params.namespaceId],
      queueId: [
        this.data.queueId || this.params.queueId || this.queues[0]?._id,
        Validators.required,
      ],
      teams: [teams, Validators.required],
      users: this.formBuilder.array(users),
      usersPerTeam: [usersPerTeam, Validators.required],
    });

    this.form.valueChanges.subscribe((values) => this.syncUserIds(values));

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

  private syncUserIds(values: any) {
    if (!values.teams || !values.usersPerTeam) {
      return;
    }

    const users = values.teams * values.usersPerTeam;

    while (this.users.length > users) {
      this.users.removeAt(this.users.length - 1, { emitEvent: false });
    }

    while (this.users.length < users) {
      this.users.push(this.formBuilder.control(null), { emitEvent: false });
    }

    this.users.updateValueAndValidity({ emitEvent: false });
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
