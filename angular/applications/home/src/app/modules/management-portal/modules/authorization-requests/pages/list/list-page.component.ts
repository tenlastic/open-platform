import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import {
  AuthorizationRequestModel,
  AuthorizationRequestService,
  AuthorizationRequestState,
  AuthorizationState,
  IAuthorization,
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
export class AuthorizationRequestsListPageComponent implements OnInit {
  public $filter = new BehaviorSubject<string>(null);
  public $records: Observable<AuthorizationRequestModel[]>;
  public $refresh = new Subject<void>();
  public columns: ListTableColumn<AuthorizationRequestModel>[] = [
    { header: 'User', text: (v) => this.getUser(v.userId)?.displayName },
    { header: 'Roles', text: (v) => `${v.roles.length}` },
    { header: 'Created At', text: (v) => formatDate(v.createdAt, "MMM d, y 'at' h:mm a", 'en-US') },
    {
      header: 'Denied At',
      text: (v) => (v.deniedAt ? formatDate(v.deniedAt, "MMM d, y 'at' h:mm a", 'en-US') : ''),
    },
    {
      header: 'Granted At',
      text: (v) => (v.grantedAt ? formatDate(v.grantedAt, "MMM d, y 'at' h:mm a", 'en-US') : ''),
    },
  ];
  public hasWriteAuthorization = false;
  public subscriptions: ListTableSubscription[] = [
    {
      Model: AuthorizationRequestModel,
      request: { _id: uuid(), path: `/subscriptions/authorization-requests` },
      service: this.authorizationRequestService,
    },
  ];
  public get webSocket() {
    return this.webSocketService.webSockets.find(
      (ws) => `${environment.wssUrl}/namespaces/${this.namespaceId}` === ws.url,
    );
  }

  private namespaceId: string;
  private get where() {
    const where: any = { namespaceId: this.namespaceId };

    if (this.$filter.value?.match(/^[0-9A-Fa-f]{24}$/)) {
      where.userId = this.$filter.value;
    }

    return where;
  }

  constructor(
    private activatedRoute: ActivatedRoute,
    private authorizationState: AuthorizationState,
    private authorizationRequestState: AuthorizationRequestState,
    private authorizationRequestService: AuthorizationRequestService,
    private identityService: IdentityService,
    private matSnackBar: MatSnackBar,
    private overlayService: OverlayService,
    private userService: UserService,
    private userState: UserState,
    private webSocketService: WebSocketService,
  ) {}

  public ngOnInit() {
    const roles = [IAuthorization.Role.AuthorizationsWrite];
    const userId = this.identityService.user?._id;
    this.hasWriteAuthorization = this.authorizationState.hasRoles(null, roles, userId);

    this.$records = this.authorizationRequestState.selectMany();

    this.activatedRoute.params.subscribe(async (params) => {
      this.namespaceId = params?.namespaceId;
      this.$refresh.next();
    });
  }

  public count = () => {
    return this.authorizationRequestService.count(this.namespaceId, { where: this.where });
  };

  public async deny($event: Event, record: AuthorizationRequestModel) {
    $event.stopPropagation();
    await this.authorizationRequestService.deny(record.namespaceId, record._id);
    this.matSnackBar.open(`Authorization Request denied successfully.`);
  }

  public filter = (record: AuthorizationRequestModel) => {
    if (this.namespaceId !== record.namespaceId) {
      return false;
    }

    if (!this.$filter.value || !this.$filter.value?.match(/^[0-9A-Fa-f]{24}$/)) {
      return true;
    }

    return this.$filter.value === record.userId;
  };

  public find = async (page: number, pageSize: number) => {
    const records = await this.authorizationRequestService.find(this.namespaceId, {
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

  public getUser(_id: string) {
    return this.userState.getOne(_id);
  }

  public async grant($event: Event, record: AuthorizationRequestModel) {
    $event.stopPropagation();
    await this.authorizationRequestService.grant(record.namespaceId, record._id);
    this.matSnackBar.open(`Authorization Request granted successfully.`);
  }

  public navigate = (record: AuthorizationRequestModel) => {
    return [record._id];
  };

  public setFilter(value: string) {
    this.$filter.next(value);
    this.$refresh.next();
  }

  public showDeletePrompt($event: Event, record: AuthorizationRequestModel) {
    $event.stopPropagation();
    this.overlayService.open<DeletionOverlayComponentData>(DeletionOverlayComponent, {
      delete: () => this.authorizationRequestService.delete(record.namespaceId, record._id),
      name: 'Authorization Request',
    });
  }
}
