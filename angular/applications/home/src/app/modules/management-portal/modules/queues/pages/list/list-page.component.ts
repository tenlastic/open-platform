import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import {
  AuthorizationState,
  GameServerTemplateService,
  GameServerTemplateState,
  IAuthorization,
  QueueModel,
  QueueService,
  QueueState,
  WebSocketService,
} from '@tenlastic/http';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { v4 as uuid } from 'uuid';

import { IdentityService, OverlayService } from '@home/app/core/services';
import {
  DeletionOverlayComponent,
  DeletionOverlayComponentData,
  ListTableColumn,
  ListTableSubscription,
} from '@home/app/shared/components';
import { environment } from '@home/environments/environment';
import { LogsOverlayComponent, LogsOverlayComponentData } from '../../components';

@Component({
  standalone: false,
  styleUrls: ['./list-page.component.scss'],
  templateUrl: 'list-page.component.html',
})
export class QueuesListPageComponent implements OnInit {
  public $filter = new BehaviorSubject<string>(null);
  public $records: Observable<QueueModel[]>;
  public $refresh = new Subject<void>();
  public columns: ListTableColumn<QueueModel>[] = [
    { header: 'Name', text: (v) => v.name },
    { header: 'Description', text: (v) => v.description },
    {
      header: 'Game Server Template',
      text: (v) => this.getGameServerTemplate(v.gameServerTemplateId)?.name,
    },
    { header: 'Status', text: (v) => this.getStatus(v) },
  ];
  public hasLogAuthorization = false;
  public hasWriteAuthorization = false;
  public queueId: string;
  public subscriptions: ListTableSubscription[] = [
    {
      Model: QueueModel,
      request: { _id: uuid(), path: `/subscriptions/queues` },
      service: this.queueService,
    },
  ];
  public get webSocket() {
    return this.webSocketService.webSockets.find(
      (ws) => `${environment.wssUrl}/namespaces/${this.namespaceId}` === ws.url,
    );
  }

  private namespaceId: string;
  private get where() {
    const where: any = {};

    if (this.$filter.value) {
      where.name = { $regex: this.$filter.value, $options: 'i' };
    }

    return where;
  }

  constructor(
    private activatedRoute: ActivatedRoute,
    private authorizationState: AuthorizationState,
    private gameServerTemplateState: GameServerTemplateState,
    private gameServerTemplateService: GameServerTemplateService,
    private identityService: IdentityService,
    private matSnackBar: MatSnackBar,
    private overlayService: OverlayService,
    private queueState: QueueState,
    private queueService: QueueService,
    private webSocketService: WebSocketService,
  ) {}

  public ngOnInit() {
    this.$records = this.queueState.selectMany();

    this.activatedRoute.params.subscribe(async (params) => {
      this.namespaceId = params.namespaceId;

      const userId = this.identityService.user?._id;
      const logRoles = [IAuthorization.Role.QueueLogsRead];
      this.hasLogAuthorization =
        this.authorizationState.hasRoles(null, logRoles, userId) ||
        this.authorizationState.hasRoles(this.namespaceId, logRoles, userId);
      const writeRoles = [IAuthorization.Role.QueuesWrite];
      this.hasWriteAuthorization =
        this.authorizationState.hasRoles(null, writeRoles, userId) ||
        this.authorizationState.hasRoles(this.namespaceId, writeRoles, userId);

      this.$refresh.next();
    });
  }

  public count = () => {
    return this.queueService.count(this.namespaceId, { where: this.where });
  };

  public filter = (record: QueueModel) => {
    if (!this.$filter.value) {
      return true;
    }

    const regex = new RegExp(this.$filter.value, 'i');
    return (
      regex.test(record.description) || regex.test(record.name) || regex.test(record.status?.phase)
    );
  };

  public find = async (page: number, pageSize: number) => {
    const records = await this.queueService.find(this.namespaceId, {
      limit: pageSize,
      skip: page * pageSize,
      sort: 'name',
      where: this.where,
    });

    await this.gameServerTemplateService.find(this.namespaceId, {
      where: { _id: { $in: records.map((q) => q.gameServerTemplateId) } },
    });

    const _ids = records.map((r) => r._id);
    this.subscriptions[0].request.body = { where: { _id: { $in: _ids } } };

    return records;
  };

  public navigate = (record: QueueModel) => {
    return [record._id];
  };

  public async restart($event: Event, record: QueueModel) {
    $event.stopPropagation();

    await this.queueService.restart(record.namespaceId, record._id);
    this.matSnackBar.open('Queue is restarting...');
  }

  public setFilter(value: string) {
    this.$filter.next(value);
    this.$refresh.next();
  }

  public showDeletePrompt($event: Event, record: QueueModel) {
    $event.stopPropagation();
    this.overlayService.open<DeletionOverlayComponentData>(DeletionOverlayComponent, {
      delete: () => this.queueService.delete(record.namespaceId, record._id),
      name: 'Queue',
    });
  }

  public showLogsOverlay($event: Event, record: QueueModel) {
    $event.stopPropagation();
    this.overlayService.open<LogsOverlayComponentData>(LogsOverlayComponent, { record });
  }

  private getGameServerTemplate(_id: string) {
    return this.gameServerTemplateState.getOne(_id);
  }

  private getStatus(record: QueueModel) {
    const current = record.status.components.reduce((a, b) => a + b.current, 0);
    const total = record.status.components.reduce((a, b) => a + b.total, 0);

    return `${record.status.phase} (${current} / ${total})`;
  }
}
