import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  AuthorizationState,
  CollectionModel,
  CollectionService,
  CollectionState,
  IAuthorization,
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
export class CollectionsListPageComponent implements OnInit {
  public $filter = new BehaviorSubject<string>(null);
  public $records: Observable<CollectionModel[]>;
  public $refresh = new Subject<void>();
  public columns: ListTableColumn<CollectionModel>[] = [
    { header: 'Name', text: (v) => v.name },
    { header: 'Properties', text: (v) => `${Object.keys(v.jsonSchema?.properties || {}).length}` },
    { header: 'Roles', text: (v) => `${Object.keys(v.permissions.roles || {}).length}` },
    { header: 'Created At', text: (v) => formatDate(v.createdAt, "MMM d, y 'at' h:mm a", 'en-US') },
    { header: 'Updated At', text: (v) => formatDate(v.updatedAt, "MMM d, y 'at' h:mm a", 'en-US') },
  ];
  public hasWriteAuthorization = false;
  public subscriptions: ListTableSubscription[] = [
    {
      Model: CollectionModel,
      request: { _id: uuid(), path: `/subscriptions/collections` },
      service: this.collectionService,
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

    if (this.$filter.value) {
      where.name = { $regex: this.$filter.value, $options: 'i' };
    }

    return where;
  }

  constructor(
    private activatedRoute: ActivatedRoute,
    private authorizationState: AuthorizationState,
    private collectionState: CollectionState,
    private collectionService: CollectionService,
    private identityService: IdentityService,
    private overlayService: OverlayService,
    private webSocketService: WebSocketService,
  ) {}

  public async ngOnInit() {
    this.$records = this.collectionState.selectMany();

    this.activatedRoute.params.subscribe(async (params) => {
      this.namespaceId = params.namespaceId;

      const roles = [IAuthorization.Role.CollectionsWrite];
      const userId = this.identityService.user?._id;
      this.hasWriteAuthorization =
        this.authorizationState.hasRoles(null, roles, userId) ||
        this.authorizationState.hasRoles(this.namespaceId, roles, userId);

      this.$refresh.next();
    });
  }

  public count = () => {
    return this.collectionService.count(this.namespaceId, { where: this.where });
  };

  public filter = (record: CollectionModel) => {
    if (this.namespaceId !== record.namespaceId) {
      return false;
    }

    if (!this.$filter.value) {
      return true;
    }

    const regex = new RegExp(this.$filter.value, 'i');
    return regex.test(record.name);
  };

  public find = async (page: number, pageSize: number) => {
    const records = await this.collectionService.find(this.namespaceId, {
      limit: pageSize,
      skip: page * pageSize,
      sort: 'name',
      where: this.where,
    });

    const _ids = records.map((r) => r._id);
    this.subscriptions[0].request.body = { where: { _id: { $in: _ids } } };

    return records;
  };

  public navigate = (record: CollectionModel) => {
    return [record._id];
  };

  public setFilter(value: string) {
    this.$filter.next(value);
    this.$refresh.next();
  }

  public showDeletePrompt($event: Event, record: CollectionModel) {
    $event.stopPropagation();
    this.overlayService.open<DeletionOverlayComponentData>(DeletionOverlayComponent, {
      delete: () => this.collectionService.delete(record.namespaceId, record._id),
      name: 'Collection',
    });
  }
}
