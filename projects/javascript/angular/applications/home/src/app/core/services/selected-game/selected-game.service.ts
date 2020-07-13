import { Injectable } from '@angular/core';
import { Game, GameService } from '@tenlastic/ng-http';

@Injectable({ providedIn: 'root' })
export class SelectedGameService {
  public get game() {
    return this._game;
  }
  public set game(value: Game) {
    if (value) {
      this._game = value;
      localStorage.setItem('management-portal.game.slug', value.slug);
    } else {
      this._game = null;
      localStorage.removeItem('management-portal.game.slug');
    }
  }
  public get gameSlug() {
    return localStorage.getItem('management-portal.game.slug');
  }

  private _game: Game;

  constructor(private gameService: GameService) {
    this.gameService.onDelete.subscribe(record => this.onDelete(record));
    this.gameService.onUpdate.subscribe(record => this.onUpdate(record));
  }

  private onDelete(record: Game) {
    if (!this.game || this.game._id !== record._id) {
      return;
    }

    this.game = null;
  }

  private onUpdate(record: Game) {
    if (!this.game || this.game._id !== record._id) {
      return;
    }

    this.game = record;
  }
}
