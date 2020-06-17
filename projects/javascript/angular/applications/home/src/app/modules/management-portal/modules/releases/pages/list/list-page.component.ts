import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator, MatSort, MatTable, MatTableDataSource, MatDialog } from '@angular/material';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { Game, GameService, Release, ReleaseService } from '@tenlastic/ng-http';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

import { IdentityService, SelectedNamespaceService } from '../../../../../../core/services';
import { PromptComponent } from '../../../../../../shared/components';
import { TITLE } from '../../../../../../shared/constants';

@Component({
  templateUrl: 'list-page.component.html',
  styleUrls: ['./list-page.component.scss'],
})
export class ReleasesListPageComponent implements OnInit {
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild(MatTable, { static: true }) table: MatTable<Release>;

  public dataSource: MatTableDataSource<Release>;
  public displayedColumns: string[] = [
    'title',
    'version',
    'publishedAt',
    'createdAt',
    'updatedAt',
    'actions',
  ];
  public game: Game;
  public games: Game[] = [];
  public search = '';

  private subject: Subject<string> = new Subject();

  constructor(
    private activatedRoute: ActivatedRoute,
    private gameService: GameService,
    public identityService: IdentityService,
    private matDialog: MatDialog,
    private releaseService: ReleaseService,
    private selectedNamespaceService: SelectedNamespaceService,
    private titleService: Title,
  ) {}

  ngOnInit() {
    this.activatedRoute.paramMap.subscribe(async params => {
      const gameSlug = params.get('gameSlug');
      if (gameSlug) {
        this.game = await this.gameService.findOne(gameSlug);
      } else {
        const { namespaceId } = this.selectedNamespaceService;
        this.games = await this.gameService.find({ where: { namespaceId } });
      }

      this.titleService.setTitle(`${TITLE} | Releases`);
      this.fetchReleases();

      this.subject.pipe(debounceTime(300)).subscribe(this.applyFilter.bind(this));
    });
  }

  public clearSearch() {
    this.search = '';
    this.applyFilter('');
  }

  public getGameTitle(_id: string) {
    return this.games.find(g => g._id === _id).fullTitle;
  }

  public onKeyUp(searchTextValue: string) {
    this.subject.next(searchTextValue);
  }

  public async publish(article: Release) {
    const result = await this.releaseService.update({
      ...article,
      publishedAt: new Date(),
    });
    article.publishedAt = result.publishedAt;
  }

  public showDeletePrompt(record: Release) {
    const dialogRef = this.matDialog.open(PromptComponent, {
      data: {
        buttons: [
          { color: 'primary', label: 'No' },
          { color: 'accent', label: 'Yes' },
        ],
        message: `Are you sure you want to delete this Release?`,
      },
    });

    dialogRef.afterClosed().subscribe(async result => {
      if (result === 'Yes') {
        await this.releaseService.delete(record._id);
        this.deleteRelease(record);
      }
    });
  }

  public async unpublish(article: Release) {
    const result = await this.releaseService.update({
      ...article,
      publishedAt: null,
    });
    article.publishedAt = result.publishedAt;
  }

  private applyFilter(filterValue: string) {
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  private async fetchReleases() {
    const where = this.game
      ? { gameId: this.game._id }
      : { gameId: { $in: this.games.map(g => g._id) } };
    const records = await this.releaseService.find({ sort: 'name', where });

    this.dataSource = new MatTableDataSource<Release>(records);
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  private deleteRelease(record: Release) {
    const index = this.dataSource.data.findIndex(u => u._id === record._id);
    this.dataSource.data.splice(index, 1);

    this.dataSource.data = [].concat(this.dataSource.data);
    this.table.renderRows();
  }
}
