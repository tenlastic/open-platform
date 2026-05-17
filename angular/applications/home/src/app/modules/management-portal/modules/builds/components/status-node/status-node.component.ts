import { Component, Input, OnInit } from '@angular/core';
import { AuthorizationState, BuildModel, IAuthorization } from '@tenlastic/http';

import { IdentityService, OverlayService } from '@home/app/core/services';
import {
  LogsOverlayComponent,
  LogsOverlayComponentData,
} from '../logs-overlay/logs-overlay.component';

export interface StatusNode {
  children?: StatusNode[];
  displayName?: string;
  finishedAt?: Date;
  id?: string;
  message?: string;
  name?: string;
  phase?: string;
  startedAt?: Date;
  type?: string;
}

@Component({
  selector: 'app-status-node',
  standalone: false,
  styleUrls: ['./status-node.component.scss'],
  templateUrl: 'status-node.component.html',
})
export class StatusNodeComponent implements OnInit {
  @Input() public build: BuildModel;
  @Input() public node: StatusNode;

  public hasLogAuthorization: boolean;
  public phaseToIcon = {
    Error: 'cancel',
    Failed: 'cancel',
    Omitted: 'circle',
    Pending: 'schedule',
    Succeeded: 'check_circle',
  };

  constructor(
    private authorizationState: AuthorizationState,
    private identityService: IdentityService,
    private overlayService: OverlayService,
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

  public showLogsOverlay($event: Event) {
    $event.stopPropagation();

    const node = this.build.status.nodes.find((n) => n.id === this.node.id);
    this.overlayService.open<LogsOverlayComponentData>(LogsOverlayComponent, {
      node,
      record: this.build,
    });
  }

  public showStatusNode(node: StatusNode) {
    return ['Pod', 'Workflow'].includes(node.type);
  }
}
