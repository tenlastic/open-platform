import { Component, OnInit, ViewChild } from '@angular/core';
import {
  MatPaginator,
  MatSort,
  MatTable,
  MatTableDataSource,
  MatDialog,
  MatSnackBar,
} from '@angular/material';
import { Title } from '@angular/platform-browser';
import { GameServer, GameServerService } from '@tenlastic/ng-http';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

import { IdentityService, SelectedGameService } from '../../../../../../core/services';
import { PromptComponent } from '../../../../../../shared/components';
import { SNACKBAR_DURATION, TITLE } from '../../../../../../shared/constants';

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
    'name',
    'description',
    'status',
    'createdAt',
    'updatedAt',
    'actions',
  ];
  public search = '';

  private subject: Subject<string> = new Subject();

  constructor(
    private gameServerService: GameServerService,
    public identityService: IdentityService,
    private matDialog: MatDialog,
    private matSnackBar: MatSnackBar,
    private selectedGameService: SelectedGameService,
    private titleService: Title,
  ) {}

  public async ngOnInit() {
    this.titleService.setTitle(`${TITLE} | Game Servers`);
    this.subject.pipe(debounceTime(300)).subscribe(this.applyFilter.bind(this));

    await this.fetchGameServers();
  }

  public clearSearch() {
    this.search = '';
    this.applyFilter('');
  }

  public getStatus(gameServer: GameServer) {
    if (!gameServer.heartbeatAt) {
      return 'Unavailable';
    }

    const date = new Date();
    date.setMinutes(date.getMinutes() - 1);

    return gameServer.heartbeatAt < date ? 'Unavailable' : 'Available';
  }

  public onKeyUp(searchTextValue: string) {
    this.subject.next(searchTextValue);
  }

  public async restart(record: GameServer) {
    await this.gameServerService.restart(record._id);
    this.matSnackBar.open('Game Server restarted successfully!', null, {
      duration: SNACKBAR_DURATION,
    });
  }

  public showDeletePrompt(record: GameServer) {
    const dialogRef = this.matDialog.open(PromptComponent, {
      data: {
        buttons: [
          { color: 'primary', label: 'No' },
          { color: 'accent', label: 'Yes' },
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

  private async fetchGameServers() {
    const records = await this.gameServerService.find({
      sort: 'name',
      where: { gameId: this.selectedGameService.game._id },
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
