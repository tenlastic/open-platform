import { Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';
import { GameService } from '@tenlastic/ng-http';

import { SelectedGameService } from '../../services';

@Injectable({ providedIn: 'root' })
export class GameGuard implements CanActivate {
  constructor(private gameService: GameService, private selectedGameService: SelectedGameService) {}

  public async canActivate() {
    const { game, gameId } = this.selectedGameService;

    if (!game && gameId) {
      try {
        this.selectedGameService.game = await this.gameService.findOne(gameId);
      } catch {
        this.selectedGameService.game = null;
      }
    }

    return true;
  }
}
