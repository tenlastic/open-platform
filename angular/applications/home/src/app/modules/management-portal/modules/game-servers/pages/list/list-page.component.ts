import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Params } from '@angular/router';
import { Order } from '@datorama/akita';
import {
  AuthorizationQuery,
  BuildQuery,
  BuildService,
  GameServerLogModel,
  GameServerLogQuery,
  GameServerLogStore,
  GameServerModel,
  GameServerQuery,
  GameServerService,
  IAuthorization,
  IGameServer,
  GameServerLogService,
  SubscriptionService,
  WebSocketService,
  QueueQuery,
  QueueService,
} from '@tenlastic/http';
import { Subject } from 'rxjs';
import { debounceTime, map } from 'rxjs/operators';
import { v4 as uuid } from 'uuid';

import { environment } from '../../../../../../../environments/environment';
import { IdentityService } from '../../../../../../core/services';
import {
  LogsDialogComponent,
  LogsDialogComponentData,
  PromptComponent,
} from '../../../../../../shared/components';

@Component({
  templateUrl: 'list-page.component.html',
  styleUrls: ['./list-page.component.scss'],
})
export class GameServersListPageComponent implements AfterViewInit, OnDestroy, OnInit {
  @ViewChild(MatPaginator) private paginator: MatPaginator;

  public dataSource = new MatTableDataSource<GameServerModel>();
  public displayedColumns = ['name', 'build', 'currentUserIds', 'description', 'status', 'actions'];
  public filter: string;
  public hasLogAuthorization: boolean;
  public hasWriteAuthorization: boolean;
  public get includeQueues() {
    return this._includeQueues;
  }
  public set includeQueues(value: boolean) {
    this._includeQueues = value;

    if (value) {
      this.displayedColumns = [
        'name',
        'build',
        'currentUserIds',
        'description',
        'queue',
        'status',
        'actions',
      ];
    } else {
      this.displayedColumns = [
        'name',
        'build',
        'currentUserIds',
        'description',
        'status',
        'actions',
      ];
    }
  }
  public message: string;
  public get pageIndex() {
    return this.paginator?.pageIndex || 0;
  }
  public get pageSize() {
    return this.paginator?.pageSize || 10;
  }
  public get queueId() {
    return this.params?.queueId;
  }

  private filter$ = new Subject();
  private _includeQueues = false;
  private count = 0;
  private date = new Date(0);
  private params: Params;
  private timeout: NodeJS.Timeout;
  private get webSocket() {
    const url = `${environment.wssUrl}/namespaces/${this.params.namespaceId}`;
    return this.webSocketService.webSockets.find((ws) => url === ws.url);
  }

  constructor(
    private activatedRoute: ActivatedRoute,
    private authorizationQuery: AuthorizationQuery,
    private buildQuery: BuildQuery,
    private buildService: BuildService,
    private gameServerLogQuery: GameServerLogQuery,
    private gameServerLogService: GameServerLogService,
    private gameServerLogStore: GameServerLogStore,
    private gameServerQuery: GameServerQuery,
    private gameServerService: GameServerService,
    private identityService: IdentityService,
    private matDialog: MatDialog,
    private matSnackBar: MatSnackBar,
    private queueQuery: QueueQuery,
    private queueService: QueueService,
    private subscriptionService: SubscriptionService,
    private webSocketService: WebSocketService,
  ) {}

  public async ngOnInit() {
    this.filter$.pipe(debounceTime(300)).subscribe(() => this.fetchGameServers());

    this.activatedRoute.params.subscribe(async (params) => {
      this.message = 'Loading...';
      this.params = params;

      const userId = this.identityService.user?._id;
      const logRoles = [IAuthorization.Role.GameServerLogsRead];
      this.hasLogAuthorization =
        this.authorizationQuery.hasRoles(null, logRoles, userId) ||
        this.authorizationQuery.hasRoles(params.namespaceId, logRoles, userId);
      const writeRoles = [IAuthorization.Role.GameServersWrite];
      this.hasWriteAuthorization =
        this.authorizationQuery.hasRoles(null, writeRoles, userId) ||
        this.authorizationQuery.hasRoles(params.namespaceId, writeRoles, userId);

      await this.fetchGameServers();

      this.message = null;
    });

    this.gameServerService.emitter.on('create', (a) => {
      if (!this.match(a)) {
        return;
      }

      if (this.dataSource.data[0]?.createdAt >= a.createdAt) {
        return;
      }

      if (this.dataSource.data[this.dataSource.data.length]?.createdAt <= a.createdAt) {
        return;
      }

      this.fetchGameServers(true);
    });

    this.gameServerService.emitter.on('delete', (a) => {
      const index = this.dataSource.data.findIndex((d) => d._id === a._id);

      if (index < 0 || index > this.dataSource.data.length) {
        return;
      }

      this.fetchGameServers(true);
    });

    this.gameServerService.emitter.on('update', (a) => {
      const index = this.dataSource.data.findIndex((d) => d._id === a._id);

      if (index < 0 || index > this.dataSource.data.length) {
        return;
      }

      if (this.match(a)) {
        this.dataSource.data[index] = a;
        this.dataSource.data = [...this.dataSource.data];
      } else {
        this.fetchGameServers(true);
      }
    });
  }

  public ngAfterViewInit() {
    this.paginator.length = this.count;
  }

  public ngOnDestroy() {
    clearTimeout(this.timeout);
  }

  public async fetchGameServers(throttle = false) {
    const date = new Date();
    const threshold = this.date.getTime() + 5 * 1000;

    if (date.getTime() < threshold && throttle) {
      this.timeout = setTimeout(() => this.fetchGameServers(), threshold - date.getTime());
      return;
    }

    this.date = date;

    let where: any = {};
    if (this.filter) {
      where.name = { $regex: `^${this.filter}`, $options: 'i' };
    }
    where.namespaceId = this.params.namespaceId;
    if (!this.includeQueues) {
      where.queueId = null;
    }

    this.dataSource.data = await this.gameServerService.find(this.params.namespaceId, {
      limit: this.pageSize,
      skip: this.pageIndex * this.pageSize,
      sort: `name`,
      where,
    });

    this.count = await this.gameServerService.count(this.params.namespaceId, {
      where,
    });

    if (this.paginator) {
      this.paginator.length = this.count;

      if (this.paginator.length < this.pageIndex * this.pageSize) {
        this.paginator.firstPage();
      }
    }

    const buildIds = this.dataSource.data
      .map((d) => d.buildId)
      .filter((ui) => !this.buildQuery.hasEntity(ui));

    if (buildIds.length > 0) {
      await this.buildService.find(this.params.namespaceId, { where: { _id: { $in: buildIds } } });
    }

    const queueIds = this.dataSource.data
      .map((d) => d.queueId)
      .filter((qi) => qi && !this.queueQuery.hasEntity(qi));

    if (queueIds.length > 0) {
      await this.queueService.find(this.params.namespaceId, { where: { _id: { $in: queueIds } } });
    }
  }

  public getBuild(_id: string) {
    return this.buildQuery.getEntity(_id);
  }

  public getQueue(_id: string) {
    return this.queueQuery.getEntity(_id);
  }

  public getStatus(record: GameServerModel) {
    const current = record.status.components.reduce((a, b) => a + b.current, 0);
    const total = record.status.components.reduce((a, b) => a + b.total, 0);

    return `${record.status.phase} (${current} / ${total})`;
  }

  public async restart($event: Event, record: GameServerModel) {
    $event.stopPropagation();

    await this.gameServerService.restart(record.namespaceId, record._id);
    this.matSnackBar.open('Game Server is restarting...');
  }

  public setFilter(value: string) {
    this.filter = value;
    this.filter$.next();
  }

  public showDeletePrompt($event: Event, record: GameServerModel) {
    $event.stopPropagation();

    const dialogRef = this.matDialog.open(PromptComponent, {
      data: {
        buttons: [
          { color: 'primary', label: 'No' },
          { color: 'accent', label: 'Yes' },
        ],
        message: `Are you sure you want to delete this Game Server?`,
      },
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result === 'Yes') {
        await this.gameServerService.delete(record.namespaceId, record._id);
        this.matSnackBar.open('Game Server deleted successfully.');
      }
    });
  }

  public showLogsDialog($event: Event, record: GameServerModel) {
    $event.stopPropagation();

    const _id = uuid();
    const data = {
      $logs: this.gameServerLogQuery.selectAll({
        filterBy: (log) => log.gameServerId === record._id,
        sortBy: 'unix',
        sortByOrder: Order.DESC,
      }),
      $nodes: this.gameServerQuery
        .selectEntity(record._id)
        .pipe(map((gameServer) => this.getNodes(gameServer))),
      find: (container, pod) =>
        this.gameServerLogService.find(record.namespaceId, record._id, pod, container, {
          tail: 500,
        }),
      subscribe: (container, pod, unix) => {
        const resumeToken = unix ? new Date(unix) : new Date();

        return this.subscriptionService.subscribe<GameServerLogModel>(
          GameServerLogModel,
          {
            _id,
            body: { resumeToken: resumeToken.toISOString() },
            path: `/subscriptions/game-servers/${record._id}/logs/${pod}/${container}`,
          },
          this.gameServerLogService,
          this.gameServerLogStore,
          this.webSocket,
          {
            acks: true,
            callback: (response) => {
              response.body.fullDocument.container = container;
              response.body.fullDocument.gameServerId = record._id;
              response.body.fullDocument.pod = pod;
            },
          },
        );
      },
      unsubscribe: () => this.subscriptionService.unsubscribe(_id, this.webSocket),
    } as LogsDialogComponentData;

    const dialogRef = this.matDialog.open(LogsDialogComponent, { autoFocus: false, data });
    dialogRef.afterClosed().subscribe(() => this.gameServerLogStore.reset());
  }

  private getNodes(gameServer: GameServerModel) {
    return gameServer.status.nodes
      .map((n) => {
        let label: string = 'Game Server';
        if (
          n.component === IGameServer.StatusComponentName.Sidecar &&
          n.container === 'endpoints-sidecar'
        ) {
          label = `${IGameServer.StatusComponentName.Sidecar} (Endpoints)`;
        } else if (
          n.component === IGameServer.StatusComponentName.Sidecar &&
          n.container === 'status-sidecar'
        ) {
          label = `${IGameServer.StatusComponentName.Sidecar} (Status)`;
        }

        return { container: n.container, label: label, pod: n.pod };
      })
      .sort((a, b) => (a.label.toLowerCase() > b.label.toLowerCase() ? 1 : -1));
  }

  private match(gameServer: GameServerModel) {
    const regex = new RegExp(`^${this.filter}`, 'i');
    if (this.filter && !gameServer.name.match(regex)) {
      return false;
    }

    if (this.params.namespaceId !== gameServer.namespaceId) {
      return false;
    }

    if (!this.includeQueues && gameServer.queueId) {
      return false;
    }

    return true;
  }
}
