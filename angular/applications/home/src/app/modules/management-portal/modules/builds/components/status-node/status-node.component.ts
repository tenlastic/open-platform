import { Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Order } from '@datorama/akita';
import {
  IBuild,
  BuildModel,
  BuildLogModel,
  BuildLogQuery,
  BuildLogStore,
  BuildQuery,
  BuildLogService,
  SubscriptionService,
  IAuthorization,
  AuthorizationQuery,
  WebSocketService,
} from '@tenlastic/http';
import { map } from 'rxjs/operators';
import { v4 as uuid } from 'uuid';

import { IdentityService } from '../../../../../../core/services';
import { environment } from '../../../../../../../environments/environment';
import { LogsDialogComponent, LogsDialogComponentData } from '../../../../../../shared/components';

type BuildStatusNodeWithParent = IBuild.Node & { parent: string };

@Component({
  templateUrl: 'status-node.component.html',
  selector: 'app-build-status-node',
  styleUrls: ['./status-node.component.scss'],
})
export class BuildStatusNodeComponent implements OnInit {
  @Input() public build: BuildModel;
  @Input() public node: BuildStatusNodeWithParent;

  public hasLogAuthorization: boolean;
  public phaseToIcon = {
    Error: 'cancel',
    Failed: 'cancel',
    Omitted: 'circle',
    Pending: 'schedule',
    Succeeded: 'check_circle',
  };

  private get webSocket() {
    const url = `${environment.wssUrl}/namespaces/${this.build.namespaceId}`;
    return this.webSocketService.webSockets.find((ws) => url === ws.url);
  }

  constructor(
    private authorizationQuery: AuthorizationQuery,
    private buildLogQuery: BuildLogQuery,
    private buildLogService: BuildLogService,
    private buildLogStore: BuildLogStore,
    private buildQuery: BuildQuery,
    private identityService: IdentityService,
    private matDialog: MatDialog,
    private subscriptionService: SubscriptionService,
    private webSocketService: WebSocketService,
  ) {}

  public ngOnInit() {
    const userId = this.identityService.user?._id;
    const logRoles = [IAuthorization.Role.BuildLogsRead];
    this.hasLogAuthorization =
      this.authorizationQuery.hasRoles(null, logRoles, userId) ||
      this.authorizationQuery.hasRoles(this.build.namespaceId, logRoles, userId);
  }

  public getLabel(displayName: string) {
    return displayName
      .toLowerCase()
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
      .replace(/\(0\)$/, '')
      .replace(/\(([0-9]+)\)$/, (match, p1) => ` (Retry #${p1})`);
  }

  public showLogsDialog() {
    const _id = uuid();
    const data = {
      $logs: this.buildLogQuery.selectAll({
        filterBy: (log) => log.buildId === this.build._id,
        sortBy: 'unix',
        sortByOrder: Order.DESC,
      }),
      $nodes: this.buildQuery
        .selectEntity(this.build._id)
        .pipe(map((build) => this.getNodes(build))),
      find: (container, pod) =>
        this.buildLogService.find(this.build.namespaceId, this.build._id, pod, container, {
          tail: 500,
        }),
      node: this.node,
      subscribe: (container, pod, unix) => {
        const resumeToken = unix ? new Date(unix) : new Date();

        return this.subscriptionService.subscribe<BuildLogModel>(
          BuildLogModel,
          {
            _id,
            body: { resumeToken: resumeToken.toISOString() },
            path: `/subscriptions/builds/${this.build._id}/logs/${pod}/${container}`,
          },
          this.buildLogService,
          this.buildLogStore,
          this.webSocket,
          {
            acks: true,
            callback: (response) => {
              response.body.fullDocument.buildId = this.build._id;
              response.body.fullDocument.container = container;
              response.body.fullDocument.pod = pod;
            },
          },
        );
      },
      unsubscribe: () => this.subscriptionService.unsubscribe(_id, this.webSocket),
    } as LogsDialogComponentData;

    const dialogRef = this.matDialog.open(LogsDialogComponent, { autoFocus: false, data });
    dialogRef.afterClosed().subscribe(() => this.buildLogStore.reset());
  }

  private getNodes(build: BuildModel) {
    const nodes = build.status.nodes.filter((n) => n.type === 'Pod');
    return nodes
      .map((n) => ({ container: n.container, label: this.getLabel(n.displayName), pod: n.pod }))
      .sort((a, b) => (a.label.toLowerCase() > b.label.toLowerCase() ? 1 : -1));
  }
}
