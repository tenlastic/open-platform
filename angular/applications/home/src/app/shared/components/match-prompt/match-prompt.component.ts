import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  GameServerQuery,
  MatchModel,
  QueueModel,
  QueueQuery,
  StorefrontModel,
  StorefrontService,
} from '@tenlastic/http';
import { Subscription } from 'rxjs';

import { ExecutableService, UpdateService } from '../../../core/services';

export interface MatchPromptComponentData {
  match: MatchModel;
}

@Component({
  selector: 'app-match-prompt',
  styleUrls: ['./match-prompt.component.scss'],
  templateUrl: 'match-prompt.component.html',
})
export class MatchPromptComponent implements OnDestroy, OnInit {
  public accepted = false;
  public message: string;
  public queue: QueueModel;
  public storefront: StorefrontModel;

  private waitForGameServer$ = new Subscription();
  private timeout: any;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: MatchPromptComponentData,
    public dialogRef: MatDialogRef<MatchPromptComponent>,
    private executableService: ExecutableService,
    private gameServerQuery: GameServerQuery,
    private queueQuery: QueueQuery,
    private storefrontService: StorefrontService,
    private updateService: UpdateService,
  ) {}

  public async ngOnInit() {
    this.dialogRef.disableClose = true;
    this.timeout = setTimeout(() => this.dialogRef.close(), 30000);

    const storefront = await this.storefrontService.find(this.data.match.namespaceId, {});
    this.storefront = storefront[0];
    this.queue = new QueueModel(this.queueQuery.getEntity(this.data.match.queueId));
  }

  public ngOnDestroy() {
    clearTimeout(this.timeout);
    this.waitForGameServer$.unsubscribe();
  }

  public async accept() {
    this.accepted = true;

    clearTimeout(this.timeout);
    this.timeout = setTimeout(() => this.dialogRef.close(), 120 * 1000);

    this.waitForGameServer$ = this.gameServerQuery
      .selectAll({ filterBy: (gs) => gs.matchId === this.data.match._id })
      .subscribe(([gs]) => {
        // If the Game Server is not ready yet, do nothing.
        if (gs?.status.phase !== 'Running') {
          return;
        }

        // If the Game Server does not have public endpoints yet, do nothing.
        if (gs?.status.endpoints.length === 0) {
          return;
        }

        const { entrypoint } = this.updateService.getStatus(gs.namespaceId).build;
        this.executableService.start(entrypoint, gs.namespaceId, { gameServer: gs });

        this.dialogRef.close();
      });
  }

  public decline() {
    this.dialogRef.close();
  }
}
