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
    this.gameStore.setActive(record._id);
    this.router.navigate(['games', record._id]);
  }

  private async fetchGames() {
    this.$games = this.gameQuery.selectAll();
    await this.gameService.find({ sort: 'name' });

    this.updateDataSource$ = this.$games.subscribe(games => (this.dataSource.data = games));

    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }
}
