import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
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
} from '@tenlastic/http';
import { Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
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
export class GameServersListPageComponent implements OnDestroy, OnInit {
  @ViewChild(MatPaginator) set paginator(paginator: MatPaginator) {
    this.dataSource.paginator = paginator;
  }
  @ViewChild(MatSort) set sort(sort: MatSort) {
    this.dataSource.sort = sort;
  }

  public dataSource = new MatTableDataSource<GameServerModel>();
  public displayedColumns = ['name', 'description', 'build', 'status', 'actions'];
  public hasWriteAuthorization: boolean;
  public message: string;
  public get queueId() {
    return this.params?.queueId;
  }

  private $gameServers: Observable<GameServerModel[]>;
  private updateDataSource$ = new Subscription();
  private params: Params;
  private get webSocketUrl() {
    return `${environment.wssUrl}/namespaces/${this.params.namespaceId}`;
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
    private subscriptionService: SubscriptionService,
  ) {}

  public async ngOnInit() {
    this.activatedRoute.params.subscribe(async (params) => {
      this.message = 'Loading...';
      this.params = params;

      const roles = [IAuthorization.Role.GameServersWrite];
      const userId = this.identityService.user?._id;
      this.hasWriteAuthorization =
        this.authorizationQuery.hasRoles(null, roles, userId) ||
        this.authorizationQuery.hasRoles(params.namespaceId, roles, userId);

      await this.fetchGameServers(params);

      this.message = null;
    });
  }

  public ngOnDestroy() {
    this.updateDataSource$.unsubscribe();
  }

  public getBuild(_id: string) {
    return this.buildQuery.getEntity(_id);
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
          this.webSocketUrl,
          {
            callback: (response) => {
              response.body.fullDocument.container = container;
              response.body.fullDocument.gameServerId = record._id;
              response.body.fullDocument.pod = pod;
            },
          },
        );
      },
      unsubscribe: () => this.subscriptionService.unsubscribe(_id, this.webSocketUrl),
    } as LogsDialogComponentData;

    const dialogRef = this.matDialog.open(LogsDialogComponent, { autoFocus: false, data });
    dialogRef.afterClosed().subscribe(() => this.gameServerLogStore.reset());
  }

  private async fetchGameServers(params: Params) {
    this.$gameServers = this.gameServerQuery.selectAll({
      filterBy: (gs) =>
        gs.namespaceId === params.namespaceId &&
        (this.queueId ? this.queueId === gs.queueId : gs.persistent),
    });

    this.updateDataSource$ = this.$gameServers.subscribe(
      (gameServers) => (this.dataSource.data = gameServers),
    );

    this.dataSource.filterPredicate = (data: GameServerModel, filter: string) => {
      const regex = new RegExp(filter.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i');
      return regex.test(data.description) || regex.test(data.name) || regex.test(data.status.phase);
    };

    const gameServers = await this.gameServerService.find(params.namespaceId, { sort: 'name' });
    await this.buildService.find(params.namespaceId, {
      where: { _id: { $in: gameServers.map((gs) => gs.buildId) } },
    });
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
}
