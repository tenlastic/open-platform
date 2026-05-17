import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import {
  AuthorizationState,
  BuildService,
  BuildState,
  GameServerModel,
  GameServerService,
  GameServerState,
  IAuthorization,
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
export class GameServersListPageComponent implements OnInit {
  public $filter = new BehaviorSubject<string>(null);
  public $records: Observable<GameServerModel[]>;
  public $refresh = new Subject<void>();
  public columns: ListTableColumn<GameServerModel>[] = [];
  public hasLogAuthorization = false;
  public hasWriteAuthorization = false;
  public matches = false;
  public queueId: string;
  public get queues() {
    return this._queues;
  }
  public set queues(value: boolean) {
    this._queues = value;

    if (value) {
      this.columns = [
        { header: 'Name', text: (v) => v.name },
        { header: 'Build', text: (v) => this.getBuild(v.buildId)?.name },
        { header: 'Current Users', text: (v) => `${v.currentUserIds?.length}` },
        { header: 'Description', text: (v) => v.description },
        { header: 'Queue', text: (v) => this.getQueue(v.queueId)?.name },
        { header: 'Status', text: (v) => this.getStatus(v) },
      ];
    } else {
      this.columns = [
        { header: 'Name', text: (v) => v.name },
        { header: 'Build', text: (v) => this.getBuild(v.buildId)?.name },
        { header: 'Current Users', text: (v) => `${v.currentUserIds?.length}` },
        { header: 'Description', text: (v) => v.description },
        { header: 'Status', text: (v) => this.getStatus(v) },
      ];
    }
  }
  public subscriptions: ListTableSubscription[] = [
    {
      Model: GameServerModel,
      request: { _id: uuid(), path: `/subscriptions/game-servers` },
      service: this.gameServerService,
    },
  ];
  public get webSocket() {
    return this.webSocketService.webSockets.find(
      (ws) => `${environment.wssUrl}/namespaces/${this.namespaceId}` === ws.url,
    );
  }

  private _queues = false;
  private namespaceId: string;
  private get where() {
    let where: any = {};

    if (this.$filter.value) {
      where.name = { $regex: this.$filter.value, $options: 'i' };
    }

    where.namespaceId = this.namespaceId;

    if (this.queueId) {
      where.queueId = this.queueId;
    } else {
      if (!this.matches) {
        where.matchId = null;
      }
      if (!this.queues) {
        where.queueId = null;
      }
    }

    return where;
  }

  constructor(
    private activatedRoute: ActivatedRoute,
    private authorizationState: AuthorizationState,
    private buildState: BuildState,
    private buildService: BuildService,
    private gameServerState: GameServerState,
    private gameServerService: GameServerService,
    private identityService: IdentityService,
    private matSnackBar: MatSnackBar,
    private overlayService: OverlayService,
    private queueState: QueueState,
    private queueService: QueueService,
    private webSocketService: WebSocketService,
  ) {}

  public async ngOnInit() {
    this.$records = this.gameServerState.selectMany();

    this.activatedRoute.params.subscribe(async (params) => {
      this.matches = false;
      this.namespaceId = params.namespaceId;
      this.queueId = params.queueId;
      this.queues = false;

      const userId = this.identityService.user?._id;
      const logRoles = [IAuthorization.Role.GameServerLogsRead];
      this.hasLogAuthorization =
        this.authorizationState.hasRoles(null, logRoles, userId) ||
        this.authorizationState.hasRoles(params.namespaceId, logRoles, userId);
      const writeRoles = [IAuthorization.Role.GameServersWrite];
      this.hasWriteAuthorization =
        this.authorizationState.hasRoles(null, writeRoles, userId) ||
        this.authorizationState.hasRoles(params.namespaceId, writeRoles, userId);

      this.$refresh.next();
    });
  }

  public count = () => {
    return this.gameServerService.count(this.namespaceId, { where: this.where });
  };

  public filter = (record: GameServerModel) => {
    const regex = new RegExp(this.$filter.value, 'i');
    if (this.$filter.value && !record.name.match(regex)) {
      return false;
    }

    if (this.namespaceId !== record.namespaceId) {
      return false;
    }

    if (this.queueId && this.queueId !== record.queueId) {
      return false;
    }

    if (!this.queueId) {
      if (!this.matches && record.matchId) {
        return false;
      }

      if (!this.queues && record.queueId) {
        return false;
      }
    }

    return true;
  };

  public find = async (page: number, pageSize: number) => {
    const records = await this.gameServerService.find(this.namespaceId, {
      limit: pageSize,
      skip: page * pageSize,
      sort: 'name',
      where: this.where,
    });

    await Promise.all([
      this.buildService.find(this.namespaceId, {
        select: '-files -reference.files',
        where: { _id: { $in: records.map((gs) => gs.buildId) } },
      }),
      this.queueService.find(this.namespaceId, {
        where: { _id: { $in: records.map((gs) => gs.queueId) } },
      }),
    ]);

    const _ids = records.map((r) => r._id);
    this.subscriptions[0].request.body = { where: { _id: { $in: _ids } } };

    return records;
  };

  public navigate = (record: GameServerModel) => {
    return [record._id];
  };

  public async restart($event: Event, record: GameServerModel) {
    $event.stopPropagation();

    await this.gameServerService.restart(record.namespaceId, record._id);
    this.matSnackBar.open('Game Server is restarting...');
  }

  public setFilter(value: string) {
    this.$filter.next(value);
    this.$refresh.next();
  }

  public showDeletePrompt($event: Event, record: GameServerModel) {
    $event.stopPropagation();
    this.overlayService.open<DeletionOverlayComponentData>(DeletionOverlayComponent, {
      delete: () => this.gameServerService.delete(record.namespaceId, record._id),
      name: 'Game Server',
    });
  }

  public showLogsOverlay($event: Event, record: GameServerModel) {
    $event.stopPropagation();
    this.overlayService.open<LogsOverlayComponentData>(LogsOverlayComponent, { record });
  }

  public getBuild(_id: string) {
    return this.buildState.getOne(_id);
  }

  public getQueue(_id: string) {
    return this.queueState.getOne(_id);
  }

  public getStatus(record: GameServerModel) {
    const current = record.status.components.reduce((a, b) => a + b.current, 0);
    const total = record.status.components.reduce((a, b) => a + b.total, 0);

    return `${record.status.phase} (${current} / ${total})`;
  }
}
