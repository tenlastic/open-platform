import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Game, GameService } from '@tenlastic/ng-http';

@Component({
  styleUrls: ['./layout.component.scss'],
  templateUrl: './layout.component.html',
})
export class LayoutComponent implements OnInit {
  public games: Game[] = [];

  constructor(private gameService: GameService, private router: Router) {}

  public async ngOnInit() {
    this.games = await this.gameService.find({});
    this.router.navigate(['/games', this.games[0].slug]);
  }
}
