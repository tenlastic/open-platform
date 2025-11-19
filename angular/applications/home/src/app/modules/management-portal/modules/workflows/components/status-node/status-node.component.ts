import { Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  AuthorizationState,
  IAuthorization,
  IWorkflow,
  SubscriptionService,
  WebSocketService,
  WorkflowLogModel,
  WorkflowLogService,
  WorkflowLogState,
  WorkflowModel,
  WorkflowState,
} from '@tenlastic/http';
import { map } from 'rxjs/operators';
import { v4 as uuid } from 'uuid';

import { environment } from '../../../../../../../environments/environment';
import { IdentityService } from '../../../../../../core/services';
import { LogsDialogComponent, LogsDialogComponentData } from '../../../../../../shared/components';

type WorkflowStatusNodeWithParent = IWorkflow.Node & { parent: string };

@Component({
  selector: 'app-workflow-status-node',
  standalone: false,
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

  private get webSocket() {
    const url = `${environment.wssUrl}/namespaces/${this.workflow.namespaceId}`;
    return this.webSocketService.webSockets.find((ws) => url === ws.url);
  }

  constructor(
    private authorizationState: AuthorizationState,
    private identityService: IdentityService,
    private matDialog: MatDialog,
    private subscriptionService: SubscriptionService,
    private webSocketService: WebSocketService,
    private workflowLogState: WorkflowLogState,
    private workflowLogService: WorkflowLogService,
    private workflowState: WorkflowState,
  ) {}

  public ngOnInit() {
    const userId = this.identityService.user?._id;
    const logRoles = [IAuthorization.Role.WorkflowLogsRead];
    this.hasLogAuthorization =
      this.authorizationState.hasRoles(null, logRoles, userId) ||
      this.authorizationState.hasRoles(this.workflow.namespaceId, logRoles, userId);
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
      $logs: this.workflowLogState
        .selectMany()
        .pipe(map((wls) => wls.filter((wl) => wl.workflowId === this.workflow._id)))
        .pipe(map((wls) => wls.sort((a, b) => b.unix - a.unix))),
      $nodes: this.workflowState.selectOne(this.workflow._id).pipe(map((w) => this.getNodes(w))),
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
          this.webSocket,
          {
            acks: true,
            callback: (response) => {
              response.body.fullDocument.container = container;
              response.body.fullDocument.pod = pod;
              response.body.fullDocument.workflowId = this.workflow._id;
            },
          },
        );
      },
      unsubscribe: () => this.subscriptionService.unsubscribe(_id, this.webSocket),
    } as LogsDialogComponentData;

    const dialogRef = this.matDialog.open(LogsDialogComponent, { autoFocus: false, data });
    dialogRef.afterClosed().subscribe(() => this.workflowLogState.reset());
  }

  private getNodes(workflow: WorkflowModel) {
    const nodes = workflow.status.nodes?.filter((n) => n.type === 'Pod');
    return nodes
      .map((n) => ({ container: n.container, label: this.getLabel(n.displayName), pod: n.pod }))
      .sort((a, b) => (a.label.toLowerCase() > b.label.toLowerCase() ? 1 : -1));
  }
}
