import { Component, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Order } from '@datorama/akita';
import {
  IWorkflow,
  StreamService,
  WorkflowLogModel,
  WorkflowLogQuery,
  WorkflowLogService,
  WorkflowLogStore,
  WorkflowModel,
  WorkflowQuery,
} from '@tenlastic/http';
import { map } from 'rxjs/operators';

import { environment } from '../../../../../../../environments/environment';
import { LogsDialogComponent } from '../../../../../../shared/components';

type WorkflowStatusNodeWithParent = IWorkflow.Node & { parent: string };

@Component({
  selector: 'app-workflow-status-node',
  styleUrls: ['./status-node.component.scss'],
  templateUrl: 'status-node.component.html',
})
export class WorkflowStatusNodeComponent {
  @Input() public node: WorkflowStatusNodeWithParent;
  @Input() public workflow: WorkflowModel;

  public phaseToIcon = {
    Error: 'close',
    Failed: 'close',
    Pending: 'schedule',
    Succeeded: 'check',
  };

  constructor(
    private matDialog: MatDialog,
    private streamService: StreamService,
    private workflowLogQuery: WorkflowLogQuery,
    private workflowLogService: WorkflowLogService,
    private workflowLogStore: WorkflowLogStore,
    private workflowQuery: WorkflowQuery,
  ) {}

  public getDisplayName(displayName: string) {
    return displayName
      .toLowerCase()
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
      .replace(/\(0\)$/, '')
      .replace(/\(([0-9]+)\)$/, (match, p1) => ` (Retry #${p1})`);
  }

  public showLogsDialog() {
    const dialogRef = this.matDialog.open(LogsDialogComponent, {
      autoFocus: false,
      data: {
        $logs: this.workflowLogQuery.selectAll({
          filterBy: (log) => log.workflowId === this.workflow._id,
          sortBy: 'unix',
          sortByOrder: Order.DESC,
        }),
        $nodeIds: this.workflowQuery
          .selectEntity(this.workflow._id)
          .pipe(map((workflow) => this.getNodeIds(workflow))),
        find: (nodeId) =>
          this.workflowLogService.find(this.workflow.namespaceId, this.workflow._id, nodeId, {
            tail: 500,
          }),
        nodeId: this.node._id,
        subscribe: async (nodeId, unix) => {
          return this.streamService.logs(
            WorkflowLogModel,
            { nodeId, since: unix ? new Date(unix) : new Date(), workflowId: this.workflow._id },
            this.workflowLogStore,
            environment.wssUrl,
          );
        },
      },
    });

    dialogRef.afterClosed().subscribe(() => this.workflowLogStore.reset());
  }

  private getNodeIds(workflow: WorkflowModel) {
    const nodes = workflow.status?.nodes?.filter((n) => n.type === 'Pod');
    return nodes
      .map((n) => ({ label: this.getDisplayName(n.displayName), value: n._id }))
      .sort((a, b) => (a.label > b.label ? 1 : -1));
  }
}
