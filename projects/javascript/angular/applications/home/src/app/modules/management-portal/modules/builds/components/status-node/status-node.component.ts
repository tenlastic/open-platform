import { Component, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Order } from '@datorama/akita';
import {
  IBuild,
  Build,
  BuildLog,
  BuildLogQuery,
  BuildService,
  BuildLogStore,
  BuildQuery,
} from '@tenlastic/ng-http';
import { map } from 'rxjs/operators';

import { environment } from '../../../../../../../environments/environment';
import { SocketService } from '../../../../../../core/services';
import { LogsDialogComponent } from '../../../../../../shared/components';

type BuildStatusNodeWithParent = IBuild.Node & { parent: string };

@Component({
  templateUrl: 'status-node.component.html',
  selector: 'app-build-status-node',
  styleUrls: ['./status-node.component.scss'],
})
export class BuildStatusNodeComponent {
  @Input() public build: Build;
  @Input() public node: BuildStatusNodeWithParent;

  public phaseToIcon = {
    Error: 'close',
    Failed: 'close',
    Pending: 'schedule',
    Succeeded: 'check',
  };

  constructor(
    private buildLogQuery: BuildLogQuery,
    private buildLogStore: BuildLogStore,
    private buildQuery: BuildQuery,
    private buildService: BuildService,
    private matDialog: MatDialog,
    private socketService: SocketService,
  ) {}

  public getDisplayName(displayName: string) {
    return displayName
      .toLowerCase()
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  public showLogsDialog() {
    const dialogRef = this.matDialog.open(LogsDialogComponent, {
      autoFocus: false,
      data: {
        $logs: this.buildLogQuery.selectAll({
          filterBy: log => log.buildId === this.build._id,
          sortBy: 'unix',
          sortByOrder: Order.DESC,
        }),
        $nodeIds: this.buildQuery
          .selectEntity(this.build._id)
          .pipe(map(build => this.getNodeIds(build))),
        find: nodeId => this.buildService.logs(this.build._id, nodeId, { tail: 500 }),
        nodeId: this.node._id,
        subscribe: async (nodeId, unix) => {
          const socket = await this.socketService.connect(environment.apiBaseUrl);
          return socket.logs(
            BuildLog,
            { buildId: this.build._id, nodeId, since: unix ? new Date(unix) : new Date() },
            this.buildService,
          );
        },
      },
    });

    dialogRef.afterClosed().subscribe(() => this.buildLogStore.reset());
  }

  private getNodeIds(build: Build) {
    const nodes = build.status?.nodes?.filter(n => n.type === 'Pod');
    return nodes
      .map(n => ({ label: this.getDisplayName(n.displayName), value: n._id }))
      .sort((a, b) => (a.label > b.label ? 1 : -1));
  }
}
