import { Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  AuthorizationState,
  BuildLogModel,
  BuildLogService,
  BuildLogState,
  BuildModel,
  BuildState,
  IAuthorization,
  IBuild,
  SubscriptionService,
  WebSocketService,
} from '@tenlastic/http';
import { map } from 'rxjs/operators';
import { v4 as uuid } from 'uuid';

import { environment } from '../../../../../../../environments/environment';
import { IdentityService } from '../../../../../../core/services';
import { LogsDialogComponent, LogsDialogComponentData } from '../../../../../../shared/components';

type BuildStatusNodeWithParent = IBuild.Node & { parent: string };

@Component({
  selector: 'app-build-status-node',
  standalone: false,
  styleUrls: ['./status-node.component.scss'],
  templateUrl: 'status-node.component.html',
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
    private authorizationState: AuthorizationState,
    private buildLogState: BuildLogState,
    private buildLogService: BuildLogService,
    private buildState: BuildState,
    private identityService: IdentityService,
    private matDialog: MatDialog,
    private subscriptionService: SubscriptionService,
    private webSocketService: WebSocketService,
  ) {}

  public ngOnInit() {
    const userId = this.identityService.user?._id;
    const logRoles = [IAuthorization.Role.BuildLogsRead];
    this.hasLogAuthorization =
      this.authorizationState.hasRoles(null, logRoles, userId) ||
      this.authorizationState.hasRoles(this.build.namespaceId, logRoles, userId);
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
      $logs: this.buildLogState
        .selectMany()
        .pipe(map((bls) => bls.filter((log) => log.buildId === this.build._id)))
        .pipe(map((bls) => bls.sort((a, b) => b.unix - a.unix))),
      $nodes: this.buildState.selectOne(this.build._id).pipe(map((b) => this.getNodes(b))),
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
    dialogRef.afterClosed().subscribe(() => this.buildLogState.reset());
  }

  private getNodes(build: BuildModel) {
    const nodes = build.status.nodes.filter((n) => n.type === 'Pod');
    return nodes
      .map((n) => ({ container: n.container, label: this.getLabel(n.displayName), pod: n.pod }))
      .sort((a, b) => (a.label.toLowerCase() > b.label.toLowerCase() ? 1 : -1));
  }
}
