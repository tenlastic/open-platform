import { Component, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Order } from '@datorama/akita';
import { IBuild, Build, BuildLog, BuildLogQuery, BuildLogService } from '@tenlastic/ng-http';

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
    private buildLogService: BuildLogService,
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
    this.matDialog.open(LogsDialogComponent, {
      autoFocus: false,
      data: {
        $logs: this.buildLogQuery.selectAll({
          filterBy: log => log.nodeId === this.node.id && log.buildId === this.build._id,
          limitTo: 250,
          sortBy: 'unix',
          sortByOrder: Order.DESC,
        }),
        find: () =>
          this.buildLogService.find(this.build._id, {
            limit: 250,
            sort: '-unix',
            where: { nodeId: this.node.id },
          }),
        subscribe: () => {
          const socket = this.socketService.connect(environment.apiBaseUrl);
          return socket.subscribe('build-logs', BuildLog, this.buildLogService, {
            nodeId: this.node.id,
            buildId: this.build._id,
          });
        },
      },
    });
  }
}
