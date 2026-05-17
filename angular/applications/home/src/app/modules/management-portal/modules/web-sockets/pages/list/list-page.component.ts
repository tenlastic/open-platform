import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  UserService,
  UserState,
  WebSocketModel,
  WebSocketService,
  WebSocketState,
} from '@tenlastic/http';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { v4 as uuid } from 'uuid';

import { formatDate } from '@angular/common';
import { ListTableColumn, ListTableSubscription } from '@home/app/shared/components';
import { environment } from '@home/environments/environment';

@Component({
  standalone: false,
  styleUrls: ['./list-page.component.scss'],
  templateUrl: 'list-page.component.html',
})
export class WebSocketsListPageComponent implements OnInit {
  public $filter = new BehaviorSubject<string>(null);
  public $records: Observable<WebSocketModel[]>;
  public $refresh = new Subject<void>();
  public columns: ListTableColumn<WebSocketModel>[] = [
    { header: 'User', text: (v) => this.getUser(v.userId)?.displayName },
    { header: 'Created At', text: (v) => formatDate(v.createdAt, "MMM d, y 'at' h:mm a", 'en-US') },
    { header: 'Updated At', text: (v) => formatDate(v.updatedAt, "MMM d, y 'at' h:mm a", 'en-US') },
    { header: 'Duration', text: (v) => this.getDuration(v) },
  ];
  public includeConnected = true;
  public includeDisconnected = false;
  public subscriptions: ListTableSubscription[] = [
    {
      Model: WebSocketModel,
      request: { _id: uuid(), path: '/subscriptions/web-sockets' },
      service: this.webSocketService,
    },
  ];
  public get webSocket() {
    return this.webSocketService.webSockets.find((ws) => environment.wssUrl === ws.url);
  }

  private namespaceId: string;
  private userId: string;
  private get where() {
    let where: any = {};

    if (this.$filter.value) {
      where.userId = this.$filter.value;
    }

    if (this.includeConnected) {
      where.$or ||= [];
      where.$or.push({ disconnectedAt: null });
    }

    if (this.includeDisconnected) {
      where.$or ||= [];
      where.$or.push({ disconnectedAt: { $exists: true } });
    }

    if (this.userId) {
      where.userId = this.userId;
    }

    return where;
  }

  constructor(
    private activatedRoute: ActivatedRoute,
    private userService: UserService,
    private userState: UserState,
    private webSocketService: WebSocketService,
    private webSocketState: WebSocketState,
  ) {}

  public ngOnInit() {
    this.$records = this.webSocketState.selectMany();

    this.activatedRoute.params.subscribe(async (params) => {
      this.namespaceId = params.namespaceId;
      this.userId = params.userId;

      this.$refresh.next();
    });
  }

  public count = () => {
    if (!this.includeConnected && !this.includeDisconnected) {
      return 0;
    }

    return this.webSocketService.count(this.namespaceId, { where: this.where });
  };

  public filter = (record: WebSocketModel) => {
    if (this.$filter.value && this.$filter.value !== record.userId) {
      return false;
    }

    if (!this.includeConnected && !record.disconnectedAt) {
      return false;
    }

    if (!this.includeDisconnected && record.disconnectedAt) {
      return false;
    }

    if (this.namespaceId && this.namespaceId !== record.namespaceId) {
      return false;
    }

    if (this.userId && this.userId !== record.userId) {
      return false;
    }

    return true;
  };

  public find = async (page: number, pageSize: number) => {
    if (!this.includeConnected && !this.includeDisconnected) {
      this.subscriptions[0].request.body = { where: { _id: { $in: [] } } };
      return [];
    }

    const records = await this.webSocketService.find(this.namespaceId, {
      limit: pageSize,
      skip: page * pageSize,
      sort: '-createdAt',
      where: this.where,
    });

    await this.userService.find({
      where: { _id: { $in: records.map((r) => r.userId) } },
    });

    const _ids = records.map((r) => r._id);
    this.subscriptions[0].request.body = { where: { _id: { $in: _ids } } };

    return records;
  };

  private getDuration(webSocket: WebSocketModel) {
    if (!webSocket.disconnectedAt) {
      return '';
    }

    let delta = Math.abs(webSocket.disconnectedAt.getTime() - webSocket.createdAt.getTime());

    const days = Math.floor(delta / (1000 * 60 * 60 * 24));
    delta -= days * (1000 * 60 * 60 * 24);

    const hours = Math.floor(delta / (1000 * 60 * 60));
    delta -= hours * (1000 * 60 * 60);

    const minutes = Math.floor(delta / (1000 * 60));
    delta -= minutes * (1000 * 60);

    const seconds = Math.floor(delta / 1000);

    if (days > 0) {
      return `${days} Days, ${hours} Hours, ${minutes} Minutes, ${seconds} Seconds`;
    } else if (hours > 0) {
      return `${hours} Hours, ${minutes} Minutes, ${seconds} Seconds`;
    } else if (minutes > 0) {
      return `${minutes} Minutes, ${seconds} Seconds`;
    }

    return `${seconds} Seconds`;
  }

  private getUser(_id: string) {
    return this.userState.getOne(_id);
  }
}
