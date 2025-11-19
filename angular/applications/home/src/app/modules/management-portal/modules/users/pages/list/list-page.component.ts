import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  AuthorizationState,
  IAuthorization,
  UserModel,
  UserService,
  UserState,
  WebSocketModel,
  WebSocketService,
  WebSocketState,
} from '@tenlastic/http';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
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
export class UsersListPageComponent implements OnDestroy, OnInit {
  public $filter = new BehaviorSubject<string>(null);
  public $records: Observable<UserModel[]>;
  public columns: ListTableColumn<UserModel>[] = [
    { header: 'Name', text: (v) => v.displayName },
    { header: 'Email Address', text: (v) => v.email },
    {
      header: 'Status',
      icon: (v) => (this.webSockets[v._id] ? 'brightness_1' : 'radio_button_unchecked'),
      text: (v) => (this.webSockets[v._id] ? 'Online' : 'Offline'),
    },
    { header: 'Steam ID', text: (v) => v.steamId },
    { header: 'Steam Persona Name', text: (v) => v.steamPersonaName },
    { header: 'Username', text: (v) => v.username },
    { header: 'Created At', text: (v) => formatDate(v.createdAt, "MMM d, y 'at' h:mm a", 'en-US') },
    { header: 'Updated At', text: (v) => formatDate(v.updatedAt, "MMM d, y 'at' h:mm a", 'en-US') },
  ];
  public hasWriteAuthorization = false;
  public subscriptions: ListTableSubscription[] = [
    {
      Model: UserModel,
      request: { _id: uuid(), path: '/subscriptions/users' },
      service: this.userService,
    },
    {
      Model: WebSocketModel,
      request: { _id: uuid(), path: '/subscriptions/web-sockets' },
      service: this.webSocketService,
    },
  ];
  public get user() {
    return this.identityService.user;
  }
  public get webSocket() {
    return this.webSocketService.webSockets.find((ws) => environment.wssUrl === ws.url);
  }
  public webSockets: { [key: string]: WebSocketModel } = {};

  private updateWebSockets$ = new Subscription();
  private get where() {
    if (!this.$filter.value) {
      return null;
    }

    return {
      $or: [
        { email: { $regex: `^${this.$filter.value}`, $options: 'i' } },
        { steamPersonaName: { $regex: `^${this.$filter.value}`, $options: 'i' } },
        { username: { $regex: `^${this.$filter.value}`, $options: 'i' } },
      ],
    };
  }

  constructor(
    private authorizationState: AuthorizationState,
    private identityService: IdentityService,
    private overlayService: OverlayService,
    private userService: UserService,
    private userState: UserState,
    private webSocketState: WebSocketState,
    private webSocketService: WebSocketService,
  ) {}

  public async ngOnInit() {
    const roles = [IAuthorization.Role.UsersWrite];
    const userId = this.identityService.user?._id;
    this.hasWriteAuthorization = this.authorizationState.hasRoles(null, roles, userId);

    this.$records = this.userState.selectMany();

    this.updateWebSockets$ = this.webSocketState.selectMany().subscribe((webSockets) => {
      this.webSockets = {};

      for (const webSocket of webSockets) {
        if (webSocket.disconnectedAt) {
          continue;
        }

        this.webSockets[webSocket.userId] = webSocket;
      }
    });
  }

  public ngOnDestroy() {
    this.updateWebSockets$.unsubscribe();
  }

  public count = () => {
    return this.userService.count({ where: this.where });
  };

  public filter = (record: UserModel) => {
    if (!this.$filter.value) {
      return true;
    }

    const regex = new RegExp(`${this.$filter.value}`, 'i');
    if (
      !record.email.match(regex) &&
      !record.steamPersonaName.match(regex) &&
      !record.username.match(regex)
    ) {
      return false;
    }

    return true;
  };

  public find = async (page: number, pageSize: number) => {
    const records = await this.userService.find({
      limit: pageSize,
      skip: page * pageSize,
      where: this.where,
    });

    const _ids = records.map((r) => r._id);
    await this.webSocketService.find(null, {
      where: { disconnectedAt: null, userId: { $in: _ids } },
    });

    this.subscriptions[0].request.body = { where: { _id: { $in: _ids } } };
    this.subscriptions[1].request.body = { where: { userIds: { $in: _ids } } };

    return records;
  };

  public navigate = (record: UserModel) => {
    return [record._id];
  };

  public showDeletePrompt($event: Event, record: UserModel) {
    $event.stopPropagation();
    this.overlayService.open<DeletionOverlayComponentData>(DeletionOverlayComponent, {
      delete: () => this.userService.delete(record._id),
      name: 'User',
    });
  }
}
