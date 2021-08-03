import { Component, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Order } from '@datorama/akita';
import {
  IWorkflow,
  Workflow,
  WorkflowLog,
  WorkflowLogQuery,
  WorkflowLogStore,
  WorkflowQuery,
  WorkflowService,
} from '@tenlastic/ng-http';
import { map } from 'rxjs/operators';

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
    private workflowLogStore: WorkflowLogStore,
    private workflowQuery: WorkflowQuery,
    private workflowService: WorkflowService,
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
        $logs: this.workflowLogQuery.selectAll({
          filterBy: log => log.workflowId === this.workflow._id,
          sortBy: 'unix',
          sortByOrder: Order.DESC,
        }),
        $nodeIds: this.workflowQuery
          .selectEntity(this.workflow._id)
          .pipe(map(workflow => this.getNodeIds(workflow))),
        find: nodeId => this.workflowService.logs(this.workflow._id, nodeId, { tail: 500 }),
        nodeId: this.node._id,
        subscribe: async (nodeId, unix) => {
          const socket = await this.socketService.connect(environment.apiBaseUrl);
          return socket.logs(
            WorkflowLog,
            { nodeId, since: unix ? new Date(unix) : new Date(), workflowId: this.workflow._id },
            this.workflowService,
          );
        },
      },
    });

    dialogRef.afterClosed().subscribe(() => this.workflowLogStore.reset());
  }

  private getNodeIds(workflow: Workflow) {
    const nodes = workflow.status?.nodes?.filter(n => n.type === 'Pod');
    return nodes
      .map(n => ({ label: this.getDisplayName(n.displayName), value: n._id }))
      .sort((a, b) => (a.label > b.label ? 1 : -1));
  }
}
