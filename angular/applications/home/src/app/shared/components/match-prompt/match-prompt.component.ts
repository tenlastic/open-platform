import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  GameServerModel,
  GameServerQuery,
  MatchInvitationModel,
  MatchInvitationService,
  MatchModel,
  MatchQuery,
  QueueModel,
  QueueService,
  StorefrontModel,
  StorefrontService,
} from '@tenlastic/http';
import { Subscription } from 'rxjs';

import { ExecutableService, IdentityService, UpdateService } from '../../../core/services';

export interface MatchPromptComponentData {
  match?: MatchModel;
  matchInvitation?: MatchInvitationModel;
}

@Component({
  selector: 'app-match-prompt',
  styleUrls: ['./match-prompt.component.scss'],
  templateUrl: 'match-prompt.component.html',
})
export class MatchPromptComponent implements OnDestroy, OnInit {
  public message: string;
  public queue: QueueModel;
  public storefront: StorefrontModel;

  private waitForGameServer$ = new Subscription();
  private waitForMatch$ = new Subscription();
  private matchInvitationServiceDelete = this.onMatchInvitationDeleted.bind(this);
  private timeout: NodeJS.Timeout;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: MatchPromptComponentData,
    private dialogRef: MatDialogRef<MatchPromptComponent>,
    private executableService: ExecutableService,
    private gameServerQuery: GameServerQuery,
    private identityService: IdentityService,
    private matchInvitationService: MatchInvitationService,
    private matchQuery: MatchQuery,
    private queueService: QueueService,
    private storefrontService: StorefrontService,
    private updateService: UpdateService,
  ) {}

  public async ngOnInit() {
    if (this.data.match) {
      return this.start(this.data.match._id, this.data.match.namespaceId);
    }

    const { expiresAt, namespaceId, queueId } = this.data.matchInvitation;

    this.closeOnTimeout(expiresAt, 5 * 1000);
    this.message = 'Loading Match information...';

    const [queues, storefronts] = await Promise.all([
      this.queueService.find(namespaceId, { where: { _id: queueId } }),
      this.storefrontService.find(namespaceId, {}),
    ]);
    this.storefront = storefronts[0];
    this.queue = queues[0];

    this.message = null;
  }

  public ngOnDestroy() {
    clearTimeout(this.timeout);
    this.matchInvitationService.emitter.off('delete', this.matchInvitationServiceDelete);
    this.waitForGameServer$.unsubscribe();
    this.waitForMatch$.unsubscribe();
  }

  public async acceptMatchInvitation() {
    const { _id, expiresAt, namespaceId } = this.data.matchInvitation;

    this.matchInvitationService.emitter.on('delete', this.matchInvitationServiceDelete);

    this.closeOnTimeout(new Date(), 5 * 1000);
    this.message = 'Accepting Match Invitation...';
    this.data.matchInvitation = await this.matchInvitationService.accept(namespaceId, _id);

    this.closeOnTimeout(expiresAt, 5 * 1000);
    this.message = 'Waiting for Match...';
    this.data.match = await new Promise<MatchModel>((resolve) => {
      this.waitForMatch$ = this.matchQuery
        .selectAll({
          filterBy: (m) =>
            m.namespaceId === namespaceId &&
            Boolean(m.startedAt) &&
            m.userIds.includes(this.identityService.user._id),
        })
        .subscribe(([m]) => (m ? resolve(m) : null));
    });

    this.matchInvitationService.emitter.off('delete', this.matchInvitationServiceDelete);

    return this.start(this.data.match._id, namespaceId);
  }

  public async declineMatchInvitation() {
    const { _id, namespaceId } = this.data.matchInvitation;
    await this.matchInvitationService.delete(namespaceId, _id);

    this.dialogRef.close();
  }

  private async onMatchInvitationDeleted(match: MatchModel) {
    if (match._id !== this.data.matchInvitation.matchId) {
      return;
    }

    this.dialogRef.close();
  }

  private closeOnTimeout(date: Date, delay = 0) {
    clearTimeout(this.timeout);

    const duration = date.getTime() - Date.now();
    this.timeout = setTimeout(() => this.dialogRef.close(), duration + delay);
  }

  private async start(matchId: string, namespaceId: string) {
    this.closeOnTimeout(new Date(), 30 * 1000);
    this.message = 'Waiting for Game Server...';

    const gameServer = await new Promise<GameServerModel>((resolve) => {
      this.waitForGameServer$ = this.gameServerQuery
        .selectAll({
          filterBy: (gs) =>
            gs.matchId === matchId &&
            gs.status.endpoints.length > 0 &&
            gs.status.phase === 'Running',
        })
        .subscribe(([gs]) => (gs ? resolve(gs) : null));
    });

    this.message = 'Launching application...';
    const { build } = this.updateService.getStatus(namespaceId);
    this.executableService.start(build.entrypoint, namespaceId, { gameServer });

    this.dialogRef.close();
  }
}
