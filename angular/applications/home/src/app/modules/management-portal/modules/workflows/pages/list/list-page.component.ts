import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  AuthorizationState,
  IAuthorization,
  WebSocketService,
  WorkflowModel,
  WorkflowService,
  WorkflowState,
} from '@tenlastic/http';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { v4 as uuid } from 'uuid';

import { formatDate } from '@angular/common';
import { IdentityService, OverlayService } from '@home/app/core/services';
import {
  DeletionOverlayComponent,
  DeletionOverlayComponentData as DeletionOverlayData,
  ListTableColumn,
  ListTableSubscription,
} from '@home/app/shared/components';
import { environment } from '@home/environments/environment';

@Component({
  standalone: false,
  styleUrls: ['./list-page.component.scss'],
  templateUrl: 'list-page.component.html',
})
export class WorkflowsListPageComponent implements OnInit {
  public $filter = new BehaviorSubject<string>(null);
  public $records: Observable<WorkflowModel[]>;
  public $refresh = new Subject<void>();
  public columns: ListTableColumn<WorkflowModel>[] = [
    { header: 'Name', text: (v) => v.name },
    { header: 'Status', text: (v) => (v.status ? v.status.phase : 'Pending') },
    { header: 'Created At', text: (v) => formatDate(v.createdAt, "MMM d, y 'at' h:mm a", 'en-US') },
    { header: 'Updated At', text: (v) => formatDate(v.updatedAt, "MMM d, y 'at' h:mm a", 'en-US') },
  ];
  public hasWriteAuthorization = false;
  public subscriptions: ListTableSubscription[] = [
    {
      Model: WorkflowModel,
      request: { _id: uuid(), path: `/subscriptions/workflows` },
      service: this.workflowService,
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
      where.$or = [
        { name: { $regex: this.$filter.value, $options: 'i' } },
        { 'status.phase': { $regex: this.$filter.value, $options: 'i' } },
      ];
    }

    return where;
  }

  constructor(
    private activatedRoute: ActivatedRoute,
    private authorizationState: AuthorizationState,
    private identityService: IdentityService,
    private overlayService: OverlayService,
    private webSocketService: WebSocketService,
    private workflowState: WorkflowState,
    private workflowService: WorkflowService,
  ) {}

  public async ngOnInit() {
    this.$records = this.workflowState.selectMany();

    this.activatedRoute.params.subscribe(async (params) => {
      this.namespaceId = params.namespaceId;

      const roles = [IAuthorization.Role.WorkflowsWrite];
      const userId = this.identityService.user?._id;
      this.hasWriteAuthorization =
        this.authorizationState.hasRoles(null, roles, userId) ||
        this.authorizationState.hasRoles(this.namespaceId, roles, userId);

      this.$refresh.next();
    });
  }

  public count = () => {
    return this.workflowService.count(this.namespaceId, { where: this.where });
  };

  public filter = (record: WorkflowModel) => {
    if (this.namespaceId !== record.namespaceId) {
      return false;
    }

    if (!this.$filter.value) {
      return true;
    }

    const regex = new RegExp(this.$filter.value, 'i');
    return regex.test(record.name) || regex.test(record.status.phase);
  };

  public find = async (page: number, pageSize: number) => {
    const records = await this.workflowService.find(this.namespaceId, {
      limit: pageSize,
      skip: page * pageSize,
      sort: '-createdAt',
      where: this.where,
    });

    const _ids = records.map((r) => r._id);
    this.subscriptions[0].request.body = { where: { _id: { $in: _ids } } };

    return records;
  };

  public navigate = (record: WorkflowModel) => {
    return [record._id];
  };

  public setFilter(value: string) {
    this.$filter.next(value);
    this.$refresh.next();
  }

  public showDeletePrompt($event: Event, record: WorkflowModel) {
    $event.stopPropagation();
    this.overlayService.open<DeletionOverlayData>(DeletionOverlayComponent, {
      delete: () => this.workflowService.delete(record.namespaceId, record._id),
      name: 'Authorization Request',
    });
  }
}
