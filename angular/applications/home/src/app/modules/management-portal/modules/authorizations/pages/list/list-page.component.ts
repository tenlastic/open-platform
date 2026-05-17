import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  AuthorizationModel,
  AuthorizationService,
  AuthorizationState,
  IAuthorization,
  UserService,
  UserState,
  WebSocketService,
} from '@tenlastic/http';
import { BehaviorSubject, Observable } from 'rxjs';
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
export class AuthorizationsListPageComponent implements OnInit {
  public $filter = new BehaviorSubject<string>(null);
  public $records: Observable<AuthorizationModel[]>;
  public columns: ListTableColumn<AuthorizationModel>[] = [
    { header: 'User', text: (v) => this.getUser(v.userId)?.displayName },
    { header: 'Roles', text: (v) => `${v.roles?.length || 0}` },
    { header: 'Created At', text: (v) => formatDate(v.createdAt, "MMM d, y 'at' h:mm a", 'en-US') },
    { header: 'Updated At', text: (v) => formatDate(v.updatedAt, "MMM d, y 'at' h:mm a", 'en-US') },
  ];
  public hasWriteAuthorization = false;
  public subscriptions: ListTableSubscription[] = [
    {
      Model: AuthorizationModel,
      request: { _id: uuid(), path: '/subscriptions/authorizations' },
      service: this.authorizationService,
    },
  ];
  public type: IAuthorization.Type;
  public get webSocket() {
    return this.webSocketService.webSockets.find((ws) => environment.wssUrl === ws.url);
  }

  private namespaceId: string;
  private get where() {
    let where: any = {};

    if (this.namespaceId) {
      where.namespaceId = this.namespaceId;
    } else {
      where.namespaceId = null;
    }

    if (this.type) {
      if (this.type === IAuthorization.Type.ApiKey) {
        where.apiKey = { $exists: true };
        where.userId = null;
      } else if (this.type === IAuthorization.Type.Default) {
        where.apiKey = null;
        where.userId = null;
      } else if (this.type === IAuthorization.Type.User) {
        where.apiKey = null;
        where.userId = { $exists: true };
      }
    }

    if (this.$filter.value?.match(/^[0-9A-Fa-f]{24}$/)) {
      where.userId = this.$filter.value;
    }

    return where;
  }

  constructor(
    private activatedRoute: ActivatedRoute,
    private authorizationState: AuthorizationState,
    private authorizationService: AuthorizationService,
    private identityService: IdentityService,
    private overlayService: OverlayService,
    private userService: UserService,
    private userState: UserState,
    private webSocketService: WebSocketService,
  ) {}

  public ngOnInit() {
    const roles = [IAuthorization.Role.AuthorizationsWrite];
    const userId = this.identityService.user?._id;
    this.hasWriteAuthorization = this.authorizationState.hasRoles(null, roles, userId);

    this.$records = this.authorizationState.selectMany();

    this.activatedRoute.data.subscribe((data) => {
      this.type = data?.type;

      if (this.type === IAuthorization.Type.ApiKey) {
        this.columns = [
          { header: 'Name', text: (v) => v.name },
          { header: 'Roles', text: (v) => `${v.roles?.length || 0}` },
          {
            header: 'Created At',
            text: (v) => formatDate(v.createdAt, "MMM d, y 'at' h:mm a", 'en-US'),
          },
          {
            header: 'Updated At',
            text: (v) => formatDate(v.updatedAt, "MMM d, y 'at' h:mm a", 'en-US'),
          },
        ];
      } else if (this.type === IAuthorization.Type.Default) {
        this.columns = [
          { header: 'Roles', text: (v) => `${v.roles?.length || 0}` },
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
          { header: 'User', text: (v) => this.getUser(v.userId)?.displayName },
          { header: 'Roles', text: (v) => `${v.roles?.length || 0}` },
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
    });

    this.activatedRoute.params.subscribe(async (params) => {
      this.namespaceId = params?.namespaceId;
    });
  }

  public count = () => {
    return this.authorizationService.count(this.namespaceId, {
      where: this.where,
    });
  };

  public filter = (record: AuthorizationModel) => {
    if (this.$filter.value?.match(/^[0-9A-Fa-f]{24}$/) && this.$filter.value !== record.userId) {
      return false;
    }

    if (this.namespaceId !== record.namespaceId) {
      return false;
    }

    if (this.type) {
      if (this.type === IAuthorization.Type.ApiKey && (!record.name || record.userId)) {
        return false;
      }

      if (this.type === IAuthorization.Type.Default && (record.name || record.userId)) {
        return false;
      }

      if (this.type === IAuthorization.Type.User && (record.name || !record.userId)) {
        return false;
      }
    }

    return true;
  };

  public find = async (page: number, pageSize: number) => {
    const records = await this.authorizationService.find(this.namespaceId, {
      limit: pageSize,
      skip: page * pageSize,
      sort: `-createdAt`,
      where: this.where,
    });

    await this.userService.find({
      where: { _id: { $in: records.map((r) => r.userId) } },
    });

    const _ids = records.map((r) => r._id);
    this.subscriptions[0].request.body = { where: { _id: { $in: _ids } } };

    return records;
  };

  public getUser(_id: string) {
    return this.userState.getOne(_id);
  }

  public navigate = (record: AuthorizationModel) => {
    return [record._id];
  };

  public setFilter(value: string) {
    this.$filter.next(value);
  }

  public showDeletePrompt($event: Event, record: AuthorizationModel) {
    $event.stopPropagation();
    this.overlayService.open<DeletionOverlayComponentData>(DeletionOverlayComponent, {
      delete: () => this.authorizationService.delete(record.namespaceId, record._id),
      name: this.type ? `${this.type} Authorization` : 'Authorization',
    });
  }
}
