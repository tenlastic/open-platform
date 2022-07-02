import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { Game, GameQuery, GameService, GameStore } from '@tenlastic/ng-http';
import { Observable, Subscription } from 'rxjs';

import { IdentityService } from '../../../../core/services';
import { TITLE } from '../../../../shared/constants';

@Component({
  templateUrl: 'list-page.component.html',
  styleUrls: ['./list-page.component.scss'],
})
export class GamesListPageComponent implements OnDestroy, OnInit {
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild(MatTable, { static: true }) table: MatTable<Game>;

  public get $activeGame() {
    return this.gameQuery.selectActive() as Observable<Game>;
  }
  public $games: Observable<Game[]>;
  public dataSource = new MatTableDataSource<Game>();
  public displayedColumns: string[] = ['title', 'subtitle', 'createdAt', 'updatedAt', 'actions'];

  private updateDataSource$ = new Subscription();

  constructor(
    private gameQuery: GameQuery,
    private gameService: GameService,
    private gameStore: GameStore,
    public identityService: IdentityService,
    private router: Router,
    private titleService: Title,
  ) {}

  public async ngOnInit() {
    this.titleService.setTitle(`${TITLE} | Games`);

    await this.fetchGames();
  }

  public ngOnDestroy() {
    this.updateDataSource$.unsubscribe();
  }

  public select(record: Game) {
    localStorage.setItem('games._id', record._id);
    this.gameStore.setActive(record._id);
    this.router.navigate(['games', record._id]);
  }

  private async fetchGames() {
    this.$games = this.gameQuery.selectAll({ sortBy: 'title' });
    const games = await this.gameService.find({ sort: 'title' });

    // If only one Game is available, automatically select it.
    if (games.length === 1) {
      this.select(games[0]);
    }

    // If a Game was selected during a previous session, restore that selection.
    const _id = localStorage.getItem('games._id');
    const game = games.find((g) => g._id === _id);
    if (game && this.gameQuery.getActiveId() !== game._id) {
      this.select(game);
    }

    this.updateDataSource$ = this.$games.subscribe((g) => (this.dataSource.data = g));

    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }
}
