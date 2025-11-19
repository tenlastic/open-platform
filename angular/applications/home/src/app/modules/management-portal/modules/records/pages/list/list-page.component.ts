import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  AuthorizationState,
  CollectionModel,
  CollectionService,
  IAuthorization,
  RecordModel,
  RecordService,
  RecordState,
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
export class RecordsListPageComponent implements OnInit {
  public $filter = new BehaviorSubject<string>(null);
  public $records: Observable<RecordModel[]>;
  public $refresh = new Subject<void>();
  public collection: CollectionModel;
  public columns: ListTableColumn<RecordModel>[] = [];
  public hasWriteAuthorization = false;
  public propertyColumns: ListTableColumn<RecordModel>[] = [];
  public subscriptions: ListTableSubscription[] = [
    {
      Model: RecordModel,
      request: { _id: uuid(), path: `/subscriptions/records` },
      service: this.recordService,
    },
  ];
  public get webSocket() {
    return this.webSocketService.webSockets.find(
      (ws) => `${environment.wssUrl}/namespaces/${this.namespaceId}` === ws.url,
    );
  }

  private collectionId: string;
  private namespaceId: string;
  private get where() {
    let where: any = {};

    if (this.$filter.value?.match(/^[0-9A-Fa-f]{24}$/)) {
      where.userId = this.$filter.value;
    }

    return where;
  }

  constructor(
    private activatedRoute: ActivatedRoute,
    private authorizationState: AuthorizationState,
    private collectionService: CollectionService,
    private identityService: IdentityService,
    private overlayService: OverlayService,
    private recordService: RecordService,
    private recordState: RecordState,
    private userState: UserState,
    private userService: UserService,
    private webSocketService: WebSocketService,
  ) {}

  public async ngOnInit() {
    this.$records = this.recordState.selectMany();

    this.activatedRoute.params.subscribe(async (params) => {
      this.collectionId = params.collectionId;
      this.namespaceId = params.namespaceId;

      const roles = [IAuthorization.Role.CollectionsWrite];
      const userId = this.identityService.user?._id;
      this.hasWriteAuthorization =
        this.authorizationState.hasRoles(null, roles, userId) ||
        this.authorizationState.hasRoles(this.namespaceId, roles, userId);

      this.collection = await this.collectionService.findOne(this.namespaceId, this.collectionId);
      this.propertyColumns = Object.entries(this.collection.jsonSchema.properties)
        .map(([key, value]) => {
          if (value.type === 'array' || value.type === 'object') {
            return null;
          }

          return { header: this.getHeader(key), text: (v: RecordModel) => v.properties[key] };
        })
        .filter((p) => p)
        .slice(0, 4);
      this.columns = this.propertyColumns.concat([
        {
          header: 'Created At',
          text: (v) => formatDate(v.createdAt, "MMM d, y 'at' h:mm a", 'en-US'),
        },
        {
          header: 'Updated At',
          text: (v) => formatDate(v.updatedAt, "MMM d, y 'at' h:mm a", 'en-US'),
        },
        { header: 'User', text: (v) => this.getUser(v.userId)?.displayName },
      ]);

      this.$refresh.next();
    });
  }

  public count = () => {
    return this.recordService.count(this.namespaceId, this.collectionId, { where: this.where });
  };

  public filter = (record: RecordModel) => {
    const regex = new RegExp(this.$filter.value, 'i');
    if (this.$filter.value?.match(/^[0-9A-Fa-f]{24}$/) && !record.userId.match(regex)) {
      return false;
    }

    if (record.collectionId !== this.collectionId) {
      return false;
    }

    if (record.namespaceId !== this.namespaceId) {
      return false;
    }

    return true;
  };

  public find = async (page: number, pageSize: number) => {
    const records = await this.recordService.find(this.namespaceId, this.collectionId, {
      limit: pageSize,
      skip: page * pageSize,
      sort: '_id',
      where: this.where,
    });

    await this.userService.find({
      where: { _id: { $in: records.map((r) => r.userId) } },
    });

    const _ids = records.map((r) => r._id);
    this.subscriptions[0].request.body = { where: { _id: { $in: _ids } } };

    return records;
  };

  public navigate = (record: RecordModel) => {
    return [record._id];
  };

  public setFilter(value: string) {
    this.$filter.next(value);
    this.$refresh.next();
  }

  public showDeletePrompt($event: Event, record: RecordModel) {
    $event.stopPropagation();
    this.overlayService.open<DeletionOverlayComponentData>(DeletionOverlayComponent, {
      delete: () => this.recordService.delete(record.namespaceId, record.collectionId, record._id),
      name: 'Record',
    });
  }

  private getHeader(value: string) {
    const result = value.replace(/([A-Z])/g, ' $1');
    return result.charAt(0).toUpperCase() + result.slice(1);
  }

  private getUser(_id: string) {
    return this.userState.getOne(_id);
  }
}
