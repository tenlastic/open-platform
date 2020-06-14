import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator, MatSort, MatTable, MatTableDataSource, MatDialog } from '@angular/material';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { Game, GameServer, GameServerService, GameService } from '@tenlastic/ng-http';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

import { IdentityService, SelectedNamespaceService } from '../../../../../../core/services';
import { PromptComponent } from '../../../../../../shared/components';
import { TITLE } from '../../../../../../shared/constants';

@Component({
  templateUrl: 'list-page.component.html',
  styleUrls: ['./list-page.component.scss'],
})
export class GameServersListPageComponent implements OnInit {
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild(MatTable, { static: true }) table: MatTable<GameServer>;

  public dataSource: MatTableDataSource<GameServer>;
  public displayedColumns: string[] = [
    'game',
    'name',
    'description',
    'createdAt',
    'updatedAt',
    'actions',
  ];
  public game: Game;
  public gamesCount: number;
  public gamesMap: { [k: string]: Game } = {};
  public search = '';

  private _games: Game[] = [];
  private get games() {
    return this._games;
  }
  private set games(value: Game[]) {
    this._games = value;
    this._games.forEach(g => (this.gamesMap[g._id] = g));
  }
  private subject: Subject<string> = new Subject();

  constructor(
    private activatedRoute: ActivatedRoute,
    private gameServerService: GameServerService,
    private gameService: GameService,
    public identityService: IdentityService,
    private matDialog: MatDialog,
    private selectedNamespaceService: SelectedNamespaceService,
    private titleService: Title,
  ) {}

  public async ngOnInit() {
    this.activatedRoute.paramMap.subscribe(async params => {
      this.titleService.setTitle(`${TITLE} | Game Servers`);
      this.subject.pipe(debounceTime(300)).subscribe(this.applyFilter.bind(this));

      const gameSlug = params.get('gameSlug');
      if (gameSlug) {
        this.game = await this.gameService.findOne(gameSlug);
      } else {
        const { namespaceId } = this.selectedNamespaceService;
        this.gamesCount = await this.gameService.count({ where: { namespaceId } });
      }

      await this.fetchGames();
      await this.fetchGameServers();
    });
  }

  public clearSearch() {
    this.search = '';
    this.applyFilter('');
  }

  public onKeyUp(searchTextValue: string) {
    this.subject.next(searchTextValue);
  }

  public showDeletePrompt(record: GameServer) {
    const dialogRef = this.matDialog.open(PromptComponent, {
      data: {
        buttons: [
          { background: 'accent', label: 'No' },
          { color: 'white', label: 'Yes' },
        ],
        message: `Are you sure you want to delete this Game Server?`,
      },
    });

    dialogRef.afterClosed().subscribe(async result => {
      if (result === 'Yes') {
        await this.gameServerService.delete(record._id);
        this.deleteGameServer(record);
      }
    });
  }

  private applyFilter(filterValue: string) {
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  private async fetchGames() {
    this.games = await this.gameService.find({
      sort: 'name',
      where: {
        namespaceId: this.selectedNamespaceService.namespace._id,
      },
    });
  }

  private async fetchGameServers() {
    const where = this.game
      ? { gameId: this.game._id }
      : { gameId: { $in: this.games.map(g => g._id) } };
    const records = await this.gameServerService.find({
      sort: 'name',
      where,
    });

    this.dataSource = new MatTableDataSource<GameServer>(records);
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  private deleteGameServer(record: GameServer) {
    const index = this.dataSource.data.findIndex(u => u._id === record._id);
    this.dataSource.data.splice(index, 1);

    this.dataSource.data = [].concat(this.dataSource.data);
    this.table.renderRows();
  }
}
