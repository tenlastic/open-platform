import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { Title } from '@angular/platform-browser';
import {
  GameAuthorization,
  GameAuthorizationQuery,
  GameAuthorizationService,
  IGameAuthorization,
} from '@tenlastic/ng-http';
import { Observable, Subscription } from 'rxjs';

import { SelectedNamespaceService } from '../../../../../../core/services';
import { PromptComponent } from '../../../../../../shared/components';
import { TITLE } from '../../../../../../shared/constants';

@Component({
  templateUrl: 'list-page.component.html',
  styleUrls: ['./list-page.component.scss'],
})
export class GameAuthorizationsListPageComponent implements OnDestroy, OnInit {
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild(MatTable, { static: true }) table: MatTable<GameAuthorization>;

  public $gameAuthorizations: Observable<GameAuthorization[]>;
  public GameAuthorizationStatus = IGameAuthorization.GameAuthorizationStatus;
  public dataSource = new MatTableDataSource<GameAuthorization>();
  public displayedColumns: string[] = ['game', 'user', 'status', 'createdAt', 'actions'];
  public statuses = {
    [IGameAuthorization.GameAuthorizationStatus.Granted]: 'Granted',
    [IGameAuthorization.GameAuthorizationStatus.Pending]: 'Pending',
    [IGameAuthorization.GameAuthorizationStatus.Revoked]: 'Revoked',
  };

  private updateDataSource$ = new Subscription();

  constructor(
    private gameAuthorizationQuery: GameAuthorizationQuery,
    private gameAuthorizationService: GameAuthorizationService,
    private matDialog: MatDialog,
    private matSnackBar: MatSnackBar,
    private selectedNamespaceService: SelectedNamespaceService,
    private titleService: Title,
  ) {}

  public ngOnInit() {
    this.titleService.setTitle(`${TITLE} | Game Authorizations`);
    this.fetchGameAuthorizations();
  }

  public ngOnDestroy() {
    this.updateDataSource$.unsubscribe();
  }

  public async grant(gameAuthorization: GameAuthorization) {
    await this.gameAuthorizationService.update({
      _id: gameAuthorization._id,
      status: IGameAuthorization.GameAuthorizationStatus.Granted,
    });
    this.matSnackBar.open('Game Authorization granted successfully.');
  }

  public async revoke(gameAuthorization: GameAuthorization) {
    await this.gameAuthorizationService.update({
      _id: gameAuthorization._id,
      status: IGameAuthorization.GameAuthorizationStatus.Revoked,
    });
    this.matSnackBar.open('Game Authorization revoked successfully.');
  }

  public showDeletePrompt(record: GameAuthorization) {
    const dialogRef = this.matDialog.open(PromptComponent, {
      data: {
        buttons: [
          { color: 'primary', label: 'No' },
          { color: 'accent', label: 'Yes' },
        ],
        message: `Are you sure you want to delete this Game Authorization?`,
      },
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result === 'Yes') {
        await this.gameAuthorizationService.delete(record._id);
        this.matSnackBar.open('Game Authorization deleted successfully.');
      }
    });
  }

  private async fetchGameAuthorizations() {
    const $gameAuthorizations = this.gameAuthorizationQuery.selectAll({
      filterBy: (gameAuthorization) =>
        gameAuthorization.namespaceId === this.selectedNamespaceService.namespaceId,
    });
    this.$gameAuthorizations = this.gameAuthorizationQuery.populate($gameAuthorizations);

    await this.gameAuthorizationService.find({
      sort: '-createdAt',
      where: { namespaceId: this.selectedNamespaceService.namespaceId },
    });

    this.updateDataSource$ = this.$gameAuthorizations.subscribe(
      (gameAuthorizations) => (this.dataSource.data = gameAuthorizations),
    );

    this.dataSource.filterPredicate = (data: GameAuthorization, filter: string) => {
      const regex = new RegExp(filter.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i');
      return (
        regex.test(data.game?.fullTitle) ||
        regex.test(data.status) ||
        regex.test(data.user?.username)
      );
    };

    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }
}
