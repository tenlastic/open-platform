import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router } from '@angular/router';
import { GameQuery, GameService, GameStore } from '@tenlastic/ng-http';

@Injectable({ providedIn: 'root' })
export class GameGuard implements CanActivate {
  constructor(
    private gameQuery: GameQuery,
    private gameService: GameService,
    private gameStore: GameStore,
    private router: Router,
  ) {}

  public async canActivate(activatedRouteSnapshot: ActivatedRouteSnapshot) {
    const _id = activatedRouteSnapshot.paramMap.get('_id');
    const activeGame = this.gameQuery.getActive();
    if (activeGame) {
      return true;
    }

    try {
      const game = await this.gameService.findOne(_id);
      this.gameStore.setActive(game._id);
    } catch {
      this.router.navigateByUrl('/games');
      return false;
    }

    return true;
  }
}
