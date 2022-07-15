import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Params } from '@angular/router';
import {
  AuthorizationQuery,
  Game,
  GameQuery,
  GameService,
  IAuthorization,
} from '@tenlastic/ng-http';
import { Observable, Subscription } from 'rxjs';

import { IdentityService } from '../../../../../../core/services';
import { PromptComponent } from '../../../../../../shared/components';
import { TITLE } from '../../../../../../shared/constants';

@Component({
  templateUrl: 'list-page.component.html',
  styleUrls: ['./list-page.component.scss'],
})
export class GamesListPageComponent implements OnDestroy, OnInit {
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild(MatTable, { static: true }) table: MatTable<Game>;

  public dataSource = new MatTableDataSource<Game>();
  public displayedColumns = ['title', 'subtitle', 'createdAt', 'updatedAt', 'actions'];
  public hasWriteAuthorization: boolean;

  private $games: Observable<Game[]>;
  private updateDataSource$ = new Subscription();

  constructor(
    private activatedRoute: ActivatedRoute,
    private authorizationQuery: AuthorizationQuery,
    private gameQuery: GameQuery,
    private gameService: GameService,
    private identityService: IdentityService,
    private matDialog: MatDialog,
    private matSnackBar: MatSnackBar,
    private titleService: Title,
  ) {}

  public async ngOnInit() {
    this.activatedRoute.params.subscribe((params) => {
      this.titleService.setTitle(`${TITLE} | Games`);

      const roles = [IAuthorization.AuthorizationRole.QueuesReadWrite];
      const userId = this.identityService.user?._id;
      this.hasWriteAuthorization =
        this.authorizationQuery.hasRoles(null, roles, userId) ||
        this.authorizationQuery.hasRoles(params.namespaceId, roles, userId);

      this.fetchGames(params);
    });
  }

  public ngOnDestroy() {
    this.updateDataSource$.unsubscribe();
  }

  public showDeletePrompt($event: Event, record: Game) {
    $event.stopPropagation();
    
    const dialogRef = this.matDialog.open(PromptComponent, {
      data: {
        buttons: [
          { color: 'primary', label: 'No' },
          { color: 'accent', label: 'Yes' },
        ],
        message: `Are you sure you want to delete this Game?`,
      },
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result === 'Yes') {
        await this.gameService.delete(record._id);
        this.matSnackBar.open('Game deleted successfully.');
      }
    });
  }

  private async fetchGames(params: Params) {
    this.$games = this.gameQuery.selectAll({
      filterBy: (gs) => gs.namespaceId === params.namespaceId,
    });

    await this.gameService.find({
      sort: 'name',
      where: { namespaceId: params.namespaceId },
    });

    this.updateDataSource$ = this.$games.subscribe((games) => (this.dataSource.data = games));

    this.dataSource.filterPredicate = (data: Game, filter: string) => {
      const regex = new RegExp(filter.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i');
      return regex.test(data.subtitle) || regex.test(data.title);
    };

    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }
}
