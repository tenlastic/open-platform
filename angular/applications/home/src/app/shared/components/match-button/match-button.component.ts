import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import {
  GameServerQuery,
  MatchModel,
  QueueQuery,
  QueueService,
  StorefrontModel,
  StorefrontQuery,
  StorefrontService,
} from '@tenlastic/http';
import { Subscription } from 'rxjs';

import { ExecutableService, UpdateService } from '../../../core/services';

@Component({
  selector: 'app-match-button',
  styleUrls: ['./match-button.component.scss'],
  templateUrl: './match-button.component.html',
})
export class MatchButtonComponent implements OnDestroy, OnInit {
  @Input() public match: MatchModel;

  public waitForMatch$ = new Subscription();
  public isWaitingForGameServer = false;

  constructor(
    private executableService: ExecutableService,
    private gameServerQuery: GameServerQuery,
    private queueQuery: QueueQuery,
    private queueService: QueueService,
    private storefrontQuery: StorefrontQuery,
    private storefrontService: StorefrontService,
    private updateService: UpdateService,
  ) {}

  public async ngOnInit() {
    const { namespaceId, queueId } = this.match;

    if (!this.queueQuery.hasEntity(queueId)) {
      await this.queueService.find(namespaceId, { where: { _id: queueId } });
    }

    if (!this.storefrontQuery.hasEntity((s: StorefrontModel) => s.namespaceId === namespaceId)) {
      await this.storefrontService.find(namespaceId, { where: { namespaceId } });
    }
  }

  public ngOnDestroy() {
    this.waitForMatch$.unsubscribe();
  }

  public getQueue(_id: string) {
    return this.queueQuery.getEntity(_id);
  }

  public getStorefront(namespaceId: string) {
    const [storefront] = this.storefrontQuery.getAll({
      filterBy: (s) => s.namespaceId === namespaceId,
    });
    return new StorefrontModel(storefront);
  }

  public async join(match: MatchModel) {
    this.isWaitingForGameServer = true;

    this.waitForMatch$ = this.gameServerQuery
      .selectAll({ filterBy: (gs) => gs.matchId === match._id })
      .subscribe(([gs]) => {
        // If the Game Server is not ready yet or does not have public endpoints yet, do nothing.
        if (gs?.status.endpoints.length === 0 || gs?.status.phase !== 'Running') {
          return;
        }

        this.isWaitingForGameServer = false;

        const { build } = this.updateService.getStatus(gs.namespaceId);
        this.executableService.start(build.entrypoint, gs.namespaceId, { gameServer: gs });
      });
  }
}
