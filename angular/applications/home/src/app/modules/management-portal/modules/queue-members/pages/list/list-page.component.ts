import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  AuthorizationState,
  IAuthorization,
  QueueMemberModel,
  QueueMemberService,
  QueueMemberState,
  QueueService,
  QueueState,
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
export class QueueMembersListPageComponent implements OnInit {
  public $filter = new BehaviorSubject<string>(null);
  public $records: Observable<QueueMemberModel[]>;
  public $refresh = new Subject<void>();
  public columns: ListTableColumn<QueueMemberModel>[] = [];
  public hasWriteAuthorization = false;
  public subscriptions: ListTableSubscription[] = [
    {
      Model: QueueMemberModel,
      request: { _id: uuid(), path: `/subscriptions/queue-members` },
      service: this.queueMemberService,
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
    private queueMemberService: QueueMemberService,
    private queueMemberState: QueueMemberState,
    private queueState: QueueState,
    private queueService: QueueService,
    private userState: UserState,
    private userService: UserService,
    private webSocketService: WebSocketService,
  ) {}

  public async ngOnInit() {
    this.$records = this.queueMemberState.selectMany();

    this.activatedRoute.params.subscribe(async (params) => {
      this.namespaceId = params.namespaceId;
      this.queueId = params.queueId;

      if (params.queueId) {
        this.columns = [
          { header: 'User', text: (v) => this.getUser(v.userId)?.displayName },
          {
            header: 'Created At',
            text: (v) => formatDate(v.createdAt, "MMM d, y 'at' h:mm a", 'en-US'),
          },
        ];
      } else {
        this.columns = [
          { header: 'Queue', text: (v) => this.getQueue(v.queueId)?.name },
          { header: 'User', text: (v) => this.getUser(v.userId)?.displayName },
          {
            header: 'Created At',
            text: (v) => formatDate(v.createdAt, "MMM d, y 'at' h:mm a", 'en-US'),
          },
        ];
      }

      const roles = [IAuthorization.Role.QueuesWrite];
      const userId = this.identityService.user?._id;
      this.hasWriteAuthorization =
        this.authorizationState.hasRoles(null, roles, userId) ||
        this.authorizationState.hasRoles(params.namespaceId, roles, userId);

      this.$refresh.next();
    });
  }

  public count = () => {
    return this.queueMemberService.count(this.namespaceId, { where: this.where });
  };

  public filter = (record: QueueMemberModel) => {
    if (this.$filter.value?.match(/^[0-9A-Fa-f]{24}$/) && this.$filter.value !== record.userId) {
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
    const records = await this.queueMemberService.find(this.namespaceId, {
      limit: pageSize,
      skip: page * pageSize,
      sort: `createdAt`,
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

  public navigate = (record: QueueMemberModel) => {
    return [record._id];
  };

  public setFilter(value: string) {
    this.$filter.next(value);
    this.$refresh.next();
  }

  public showDeletePrompt($event: Event, record: QueueMemberModel) {
    $event.stopPropagation();
    this.overlayService.open<DeletionOverlayComponentData>(DeletionOverlayComponent, {
      delete: () => this.queueMemberService.delete(record.namespaceId, record._id),
      name: 'Queue Member',
    });
  }

  private getQueue(_id: string) {
    return this.queueState.getOne(_id);
  }

  private getUser(_id: string) {
    return this.userState.getOne(_id);
  }
}
