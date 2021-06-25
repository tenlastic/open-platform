import { Component, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Order } from '@datorama/akita';
import {
  IWorkflow,
  Workflow,
  WorkflowLog,
  WorkflowLogQuery,
  WorkflowLogService,
} from '@tenlastic/ng-http';

import { environment } from '../../../../../../../environments/environment';
import { SocketService } from '../../../../../../core/services';
import { LogsDialogComponent } from '../../../../../../shared/components';

type WorkflowStatusNodeWithParent = IWorkflow.Node & { parent: string };

@Component({
  selector: 'app-workflow-status-node',
  styleUrls: ['./status-node.component.scss'],
  templateUrl: 'status-node.component.html',
})
export class WorkflowStatusNodeComponent {
  @Input() public node: WorkflowStatusNodeWithParent;
  @Input() public workflow: Workflow;

  public phaseToIcon = {
    Error: 'close',
    Failed: 'close',
    Pending: 'schedule',
    Succeeded: 'check',
  };

  constructor(
    private matDialog: MatDialog,
    private socketService: SocketService,
    private workflowLogQuery: WorkflowLogQuery,
    private workflowLogService: WorkflowLogService,
  ) {}

  public showLogsDialog() {
    this.matDialog.open(LogsDialogComponent, {
      autoFocus: false,
      data: {
        $logs: this.workflowLogQuery.selectAll({
          filterBy: log => log.nodeId === this.node.id && log.workflowId === this.workflow._id,
          limitTo: 250,
          sortBy: 'unix',
          sortByOrder: Order.DESC,
        }),
        find: () =>
          this.workflowLogService.find(this.workflow._id, {
            limit: 250,
            sort: '-unix',
            where: { nodeId: this.node.id },
          }),
        subscribe: async () => {
          const socket = await this.socketService.connect(environment.apiBaseUrl);
          return socket.subscribe('workflow-logs', WorkflowLog, this.workflowLogService, {
            nodeId: this.node.id,
            workflowId: this.workflow._id,
          });
        },
      },
    });
  }
}
