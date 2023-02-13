import { Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Order } from '@datorama/akita';
import {
  AuthorizationQuery,
  IAuthorization,
  IWorkflow,
  SubscriptionService,
  WorkflowLogModel,
  WorkflowLogQuery,
  WorkflowLogService,
  WorkflowLogStore,
  WorkflowModel,
  WorkflowQuery,
} from '@tenlastic/http';
import { map } from 'rxjs/operators';
import { v4 as uuid } from 'uuid';

import { IdentityService } from '../../../../../../core/services';
import { environment } from '../../../../../../../environments/environment';
import { LogsDialogComponent, LogsDialogComponentData } from '../../../../../../shared/components';

type WorkflowStatusNodeWithParent = IWorkflow.Node & { parent: string };

@Component({
  selector: 'app-workflow-status-node',
  styleUrls: ['./status-node.component.scss'],
  templateUrl: 'status-node.component.html',
})
export class WorkflowStatusNodeComponent implements OnInit {
  @Input() public node: WorkflowStatusNodeWithParent;
  @Input() public workflow: WorkflowModel;

  public hasLogAuthorization: boolean;
  public phaseToIcon = {
    Error: 'cancel',
    Failed: 'cancel',
    Omitted: 'circle',
    Pending: 'schedule',
    Succeeded: 'check_circle',
  };

  private get webSocketUrl() {
    return `${environment.wssUrl}/namespaces/${this.workflow.namespaceId}`;
  }

  constructor(
    private authorizationQuery: AuthorizationQuery,
    private identityService: IdentityService,
    private matDialog: MatDialog,
    private subscriptionService: SubscriptionService,
    private workflowLogQuery: WorkflowLogQuery,
    private workflowLogService: WorkflowLogService,
    private workflowLogStore: WorkflowLogStore,
    private workflowQuery: WorkflowQuery,
  ) {}

  public ngOnInit() {
    const userId = this.identityService.user?._id;
    const logRoles = [IAuthorization.Role.WorkflowLogsRead];
    this.hasLogAuthorization =
      this.authorizationQuery.hasRoles(null, logRoles, userId) ||
      this.authorizationQuery.hasRoles(this.workflow.namespaceId, logRoles, userId);
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
      $logs: this.workflowLogQuery.selectAll({
        filterBy: (log) => log.workflowId === this.workflow._id,
        sortBy: 'unix',
        sortByOrder: Order.DESC,
      }),
      $nodes: this.workflowQuery
        .selectEntity(this.workflow._id)
        .pipe(map((workflow) => this.getNodes(workflow))),
      find: (container, pod) =>
        this.workflowLogService.find(this.workflow.namespaceId, this.workflow._id, pod, container, {
          tail: 500,
        }),
      node: this.node,
      subscribe: (container, pod, unix) => {
        const resumeToken = unix ? new Date(unix) : new Date();

        return this.subscriptionService.subscribe<WorkflowLogModel>(
          WorkflowLogModel,
          {
            _id,
            body: { resumeToken: resumeToken.toISOString() },
            path: `/subscriptions/workflows/${this.workflow._id}/logs/${pod}/${container}`,
          },
          this.workflowLogService,
          this.workflowLogStore,
          this.webSocketUrl,
          {
            callback: (response) => {
              response.body.fullDocument.container = container;
              response.body.fullDocument.pod = pod;
              response.body.fullDocument.workflowId = this.workflow._id;
            },
          },
        );
      },
      unsubscribe: () => this.subscriptionService.unsubscribe(_id, this.webSocketUrl),
    } as LogsDialogComponentData;

    const dialogRef = this.matDialog.open(LogsDialogComponent, { autoFocus: false, data });
    dialogRef.afterClosed().subscribe(() => this.workflowLogStore.reset());
  }

  private getNodes(workflow: WorkflowModel) {
    const nodes = workflow.status.nodes?.filter((n) => n.type === 'Pod');
    return nodes
      .map((n) => ({ container: n.container, label: this.getLabel(n.displayName), pod: n.pod }))
      .sort((a, b) => (a.label.toLowerCase() > b.label.toLowerCase() ? 1 : -1));
  }
}
