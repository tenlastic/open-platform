import { Component, Input } from '@angular/core';
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
} from '@tenlastic/http';
import { map } from 'rxjs/operators';

import { environment } from '../../../../../../../environments/environment';
import { LogsDialogComponent, LogsDialogComponentData } from '../../../../../../shared/components';

type BuildStatusNodeWithParent = IBuild.Node & { parent: string };

@Component({
  templateUrl: 'status-node.component.html',
  selector: 'app-build-status-node',
  styleUrls: ['./status-node.component.scss'],
})
export class BuildStatusNodeComponent {
  @Input() public build: BuildModel;
  @Input() public node: BuildStatusNodeWithParent;

  public phaseToIcon = {
    Error: 'cancel',
    Failed: 'cancel',
    Omitted: 'circle',
    Pending: 'schedule',
    Succeeded: 'check_circle',
  };

  private get webSocketUrl() {
    return `${environment.wssUrl}/namespaces/${this.build.namespaceId}`;
  }

  constructor(
    private buildLogQuery: BuildLogQuery,
    private buildLogService: BuildLogService,
    private buildLogStore: BuildLogStore,
    private buildQuery: BuildQuery,
    private matDialog: MatDialog,
    private subscriptionService: SubscriptionService,
  ) {}

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
        return this.subscriptionService.logs<BuildLogModel>(
          BuildLogModel,
          { buildId: this.build._id, container, pod },
          {
            body: { since: unix ? new Date(unix) : new Date() },
            path: `/subscriptions/builds/${this.build._id}/logs/${pod}/${container}`,
          },
          this.buildLogStore,
          this.webSocketUrl,
        );
      },
      wssUrl: this.webSocketUrl,
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
