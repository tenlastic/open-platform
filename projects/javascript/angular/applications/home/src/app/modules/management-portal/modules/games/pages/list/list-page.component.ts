import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator, MatSort, MatTable, MatTableDataSource, MatDialog } from '@angular/material';
import { Title } from '@angular/platform-browser';
import { Game, GameService } from '@tenlastic/ng-http';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

import {
  IdentityService,
  SelectedGameService,
  SelectedNamespaceService,
} from '../../../../../../core/services';
import { PromptComponent } from '../../../../../../shared/components';
import { TITLE } from '../../../../../../shared/constants';

@Component({
  templateUrl: 'list-page.component.html',
  styleUrls: ['./list-page.component.scss'],
})
export class GamesListPageComponent implements OnInit {
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild(MatTable, { static: true }) table: MatTable<Game>;

  public dataSource: MatTableDataSource<Game>;
  public displayedColumns: string[] = ['title', 'subtitle', 'createdAt', 'updatedAt', 'actions'];
  public search = '';

  private subject: Subject<string> = new Subject();

  constructor(
    private gameService: GameService,
    public identityService: IdentityService,
    private matDialog: MatDialog,
    public selectedGameService: SelectedGameService,
    private selectedNamespaceService: SelectedNamespaceService,
    private titleService: Title,
  ) {}

  ngOnInit() {
    this.titleService.setTitle(`${TITLE} | Games`);
    this.fetchGames();

    this.subject.pipe(debounceTime(300)).subscribe(this.applyFilter.bind(this));
  }

  public clearSearch() {
    this.search = '';
    this.applyFilter('');
  }

  public onKeyUp(searchTextValue: string) {
    this.subject.next(searchTextValue);
  }

  public select(record: Game) {
    this.selectedGameService.game = record;
  }

  public showDeletePrompt(record: Game) {
    const dialogRef = this.matDialog.open(PromptComponent, {
      data: {
        buttons: [
          { color: 'primary', label: 'No' },
          { color: 'accent', label: 'Yes' },
        ],
        message: `Are you sure you want to delete this Game?`,
      },
    });

    dialogRef.afterClosed().subscribe(async result => {
      if (result === 'Yes') {
        await this.gameService.delete(record._id);
        this.deleteGame(record);
      }
    });
  }

  private applyFilter(filterValue: string) {
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  private async fetchGames() {
    const records = await this.gameService.find({
      sort: 'title',
      where: { namespaceId: this.selectedNamespaceService.namespaceId },
    });

    this.dataSource = new MatTableDataSource<Game>(records);
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  private deleteGame(record: Game) {
    const index = this.dataSource.data.findIndex(u => u._id === record._id);
    this.dataSource.data.splice(index, 1);

    this.dataSource.data = [].concat(this.dataSource.data);
    this.table.renderRows();
  }
}
