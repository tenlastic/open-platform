import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  AuthorizationState,
  IAuthorization,
  QueueService,
  QueueState,
  TeamModel,
  TeamService,
  TeamState,
  UserService,
  UserState,
  WebSocketService,
} from '@tenlastic/http';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { v4 as uuid } from 'uuid';

import { formatDate } from '@angular/common';
import { IdentityService, OverlayService } from '@home/app/core/services';
import {
  DeletionOverlayComponent,
  DeletionOverlayComponentData,
  ListTableColumn,
  ListTableSubscription,
} from '@home/app/shared/components';
import { environment } from '@home/environments/environment';

@Component({
  standalone: false,
  styleUrls: ['./list-page.component.scss'],
  templateUrl: 'list-page.component.html',
})
export class TeamsListPageComponent implements OnInit {
  public $filter = new BehaviorSubject<string>(null);
  public $records: Observable<TeamModel[]>;
  public $refresh = new Subject<void>();
  public columns: ListTableColumn<TeamModel>[] = [];
  public hasWriteAuthorization = false;
  public subscriptions: ListTableSubscription[] = [
    {
      Model: TeamModel,
      request: { _id: uuid(), path: `/subscriptions/teams` },
      service: this.teamService,
    },
  ];
  public get webSocket() {
    return this.webSocketService.webSockets.find(
      (ws) => `${environment.wssUrl}/namespaces/${this.namespaceId}` === ws.url,
    );
  }

  private namespaceId: string;
  private queueId: string;
  private get where() {
    let where: any = {};

    where.namespaceId = this.namespaceId;
    where.queueId = this.queueId;

    if (this.$filter.value?.match(/^[0-9A-Fa-f]{24}$/)) {
      where.userId = this.$filter.value;
    }

    return where;
  }

  constructor(
    private activatedRoute: ActivatedRoute,
    private authorizationState: AuthorizationState,
    private identityService: IdentityService,
    private overlayService: OverlayService,
    private queueState: QueueState,
    private queueService: QueueService,
    private teamService: TeamService,
    private teamState: TeamState,
    private userState: UserState,
    private userService: UserService,
    private webSocketService: WebSocketService,
  ) {}

  public async ngOnInit() {
    this.$records = this.teamState.selectMany();

    this.activatedRoute.params.subscribe(async (params) => {
      this.namespaceId = params.namespaceId;
      this.queueId = params.queueId;

      if (params.queueId) {
        this.columns = [
          { header: 'Rating', text: (v) => `${v.rating}` },
          { header: 'Users', text: (v) => this.getUsers(v.userIds) },
          {
            header: 'Created At',
            text: (v) => formatDate(v.createdAt, "MMM d, y 'at' h:mm a", 'en-US'),
          },
          {
            header: 'Updated At',
            text: (v) => formatDate(v.updatedAt, "MMM d, y 'at' h:mm a", 'en-US'),
          },
        ];
      } else {
        this.columns = [
          { header: 'Queue', text: (v) => this.getQueue(v.queueId)?.name },
          { header: 'Rating', text: (v) => `${v.rating}` },
          { header: 'Users', text: (v) => this.getUsers(v.userIds) },
          {
            header: 'Created At',
            text: (v) => formatDate(v.createdAt, "MMM d, y 'at' h:mm a", 'en-US'),
          },
          {
            header: 'Updated At',
            text: (v) => formatDate(v.updatedAt, "MMM d, y 'at' h:mm a", 'en-US'),
          },
        ];
      }

      const roles = [IAuthorization.Role.TeamsWrite];
      const userId = this.identityService.user?._id;
      this.hasWriteAuthorization =
        this.authorizationState.hasRoles(null, roles, userId) ||
        this.authorizationState.hasRoles(params.namespaceId, roles, userId);

      this.$refresh.next();
    });
  }

  public count = () => {
    return this.teamService.count(this.namespaceId, { where: this.where });
  };

  public filter = (record: TeamModel) => {
    if (
      this.$filter.value?.match(/^[0-9A-Fa-f]{24}$/) &&
      !record.userIds.includes(this.$filter.value)
    ) {
      return false;
    }

    if (this.namespaceId !== record.namespaceId) {
      return false;
    }

    if (this.queueId !== record.queueId) {
      return false;
    }

    return true;
  };

  public find = async (page: number, pageSize: number) => {
    const records = await this.teamService.find(this.namespaceId, {
      limit: pageSize,
      skip: page * pageSize,
      sort: `-rating`,
      where: this.where,
    });

    await Promise.all([
      this.queueService.find(this.namespaceId, {
        where: { _id: { $in: records.map((m) => m.queueId) } },
      }),
      this.userService.find({
        where: { _id: { $in: records.map((m) => m.userIds).flat() } },
      }),
    ]);

    const _ids = records.map((r) => r._id);
    this.subscriptions[0].request.body = { where: { _id: { $in: _ids } } };

    return records;
  };

  public navigate = (record: TeamModel) => {
    return [record._id];
  };

  public setFilter(value: string) {
    this.$filter.next(value);
    this.$refresh.next();
  }

  public showDeletePrompt($event: Event, record: TeamModel) {
    $event.stopPropagation();
    this.overlayService.open<DeletionOverlayComponentData>(DeletionOverlayComponent, {
      delete: () => this.teamService.delete(record.namespaceId, record._id),
      name: 'Team',
    });
  }

  private getQueue(_id: string) {
    return this.queueState.getOne(_id);
  }

  private getUsers(userIds: string[]) {
    return userIds
      .map((ui) => this.userState.getOne(ui))
      .map((u) => u.displayName)
      .join(', ');
  }
}
