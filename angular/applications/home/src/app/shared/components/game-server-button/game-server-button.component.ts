import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import {
  GameServerModel,
  GameServerQuery,
  QueueQuery,
  QueueService,
  StorefrontModel,
  StorefrontQuery,
  StorefrontService,
} from '@tenlastic/http';
import { Subscription } from 'rxjs';

import { ExecutableService, UpdateService } from '../../../core/services';

@Component({
  selector: 'app-game-server-button',
  styleUrls: ['./game-server-button.component.scss'],
  templateUrl: './game-server-button.component.html',
})
export class GameServerButtonComponent implements OnDestroy, OnInit {
  @Input() public gameServer: GameServerModel;

  public waitForGameServer$ = new Subscription();
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
    const { namespaceId } = this.gameServer;

    if (!this.queueQuery.hasEntity(this.gameServer.queueId)) {
      await this.queueService.find(namespaceId, { where: { _id: this.gameServer.queueId } });
    }

    if (!this.storefrontQuery.hasEntity((s: StorefrontModel) => s.namespaceId === namespaceId)) {
      await this.storefrontService.find(namespaceId, { where: { namespaceId } });
    }
  }

  public ngOnDestroy() {
    this.waitForGameServer$.unsubscribe();
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

  public async join(gameServer: GameServerModel) {
    this.isWaitingForGameServer = true;

    this.waitForGameServer$ = this.gameServerQuery.selectEntity(gameServer._id).subscribe((gs) => {
      // If the Game Server is not ready yet or does not have public endpoints yet, do nothing.
      if (!gs?.status.endpoints || gs?.status?.phase !== 'Running') {
        return;
      }

      this.isWaitingForGameServer = false;

      const { build } = this.updateService.getStatus(gs.namespaceId);
      this.executableService.start(build.entrypoint, gs.namespaceId, { gameServer: gs });
    });
  }
}
