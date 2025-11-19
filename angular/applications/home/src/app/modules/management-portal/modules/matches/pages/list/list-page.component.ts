import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  AuthorizationState,
  GameServerTemplateService,
  GameServerTemplateState,
  IAuthorization,
  MatchModel,
  MatchService,
  MatchState,
  QueueService,
  QueueState,
  UserService,
  UserState,
  WebSocketService,
} from '@tenlastic/http';
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
import { Observable, Subject } from 'rxjs';

@Component({
  standalone: false,
  styleUrls: ['./list-page.component.scss'],
  templateUrl: 'list-page.component.html',
})
export class MatchesListPageComponent implements OnInit {
  public $records: Observable<MatchModel[]>;
  public $refresh = new Subject<void>();
  public columns: ListTableColumn<MatchModel>[] = [
    {
      header: 'Game Server Template',
      text: (v) => this.getGameServerTemplate(v.gameServerTemplateId)?.name,
    },
    { header: 'Queue', text: (v) => this.getQueue(v.queueId)?.name },
    { header: 'Teams', text: (v) => this.getUsers(v) },
    { header: 'Started At', text: (v) => formatDate(v.startedAt, "MMM d, y 'at' h:mm a", 'en-US') },
    {
      header: 'Finished At',
      text: (v) => formatDate(v.finishedAt, "MMM d, y 'at' h:mm a", 'en-US'),
    },
  ];
  public hasWriteAuthorization = false;
  public subscriptions: ListTableSubscription[] = [
    {
      Model: MatchModel,
      request: { _id: uuid(), path: `/subscriptions/matches` },
      service: this.matchService,
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
    if (this.queueId) {
      where.queueId = this.queueId;
    }

    return where;
  }

  constructor(
    private activatedRoute: ActivatedRoute,
    private authorizationState: AuthorizationState,
    private gameServerTemplateState: GameServerTemplateState,
    private gameServerTemplateService: GameServerTemplateService,
    private identityService: IdentityService,
    private matchService: MatchService,
    private matchState: MatchState,
    private overlayService: OverlayService,
    private queueState: QueueState,
    private queueService: QueueService,
    private userState: UserState,
    private userService: UserService,
    private webSocketService: WebSocketService,
  ) {}

  public ngOnInit() {
    this.$records = this.matchState.selectMany();

    this.activatedRoute.params.subscribe(async (params) => {
      this.namespaceId = params.namespaceId;
      this.queueId = params.queueId;

      const roles = [IAuthorization.Role.MatchesWrite];
      const userId = this.identityService.user?._id;
      this.hasWriteAuthorization =
        this.authorizationState.hasRoles(null, roles, userId) ||
        this.authorizationState.hasRoles(params.namespaceId, roles, userId);

      this.$refresh.next();
    });
  }

  public count = () => {
    return this.matchService.count(this.namespaceId, { where: this.where });
  };

  public filter = (record: MatchModel) => {
    if (this.namespaceId !== record.namespaceId) {
      return false;
    }

    if (this.queueId && this.queueId !== record.queueId) {
      return false;
    }

    return true;
  };

  public find = async (page: number, pageSize: number) => {
    const records = await this.matchService.find(this.namespaceId, {
      limit: pageSize,
      skip: page * pageSize,
      sort: `-createdAt`,
      where: this.where,
    });

    await Promise.all([
      this.gameServerTemplateService.find(this.namespaceId, {
        where: { _id: { $in: records.map((m) => m.gameServerTemplateId) } },
      }),
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

  public navigate = (record: MatchModel) => {
    return [record._id];
  };

  public showDeletePrompt($event: Event, record: MatchModel) {
    $event.stopPropagation();
    this.overlayService.open<DeletionOverlayComponentData>(DeletionOverlayComponent, {
      delete: () => this.matchService.delete(record.namespaceId, record._id),
      name: 'Match',
    });
  }

  private getGameServerTemplate(_id: string) {
    return this.gameServerTemplateState.getOne(_id);
  }

  private getQueue(_id: string) {
    return this.queueState.getOne(_id);
  }

  private getUsers(match: MatchModel) {
    return match.teams
      .map((t, i) => {
        const users = t.userIds
          .map((ui) => this.userState.getOne(ui))
          .map((u) => u?.displayName)
          .sort()
          .join(' + ');

        return `Team ${i + 1} (${users})`;
      })
      .sort()
      .join('   -   ');
  }
}
