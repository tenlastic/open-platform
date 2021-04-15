import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { Title } from '@angular/platform-browser';
import { GameInvitation, GameInvitationQuery, GameInvitationService } from '@tenlastic/ng-http';
import { Observable, Subscription } from 'rxjs';

import { IdentityService, SelectedNamespaceService } from '../../../../../../core/services';
import { PromptComponent } from '../../../../../../shared/components';
import { TITLE } from '../../../../../../shared/constants';

@Component({
  templateUrl: 'list-page.component.html',
  styleUrls: ['./list-page.component.scss'],
})
export class GameInvitationsListPageComponent implements OnDestroy, OnInit {
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild(MatTable, { static: true }) table: MatTable<GameInvitation>;

  public $gameInvitations: Observable<GameInvitation[]>;
  public dataSource = new MatTableDataSource<GameInvitation>();
  public displayedColumns: string[] = ['game', 'user', 'createdAt', 'actions'];

  private updateDataSource$ = new Subscription();

  constructor(
    private gameInvitationQuery: GameInvitationQuery,
    private gameInvitationService: GameInvitationService,
    public identityService: IdentityService,
    private matDialog: MatDialog,
    private matSnackBar: MatSnackBar,
    private selectedNamespaceService: SelectedNamespaceService,
    private titleService: Title,
  ) {}

  public ngOnInit() {
    this.titleService.setTitle(`${TITLE} | Game Invitations`);
    this.fetchGameInvitations();
  }

  public ngOnDestroy() {
    this.updateDataSource$.unsubscribe();
  }

  public showDeletePrompt(record: GameInvitation) {
    const dialogRef = this.matDialog.open(PromptComponent, {
      data: {
        buttons: [
          { color: 'primary', label: 'No' },
          { color: 'accent', label: 'Yes' },
        ],
        message: `Are you sure you want to delete this Game Invitation?`,
      },
    });

    dialogRef.afterClosed().subscribe(async result => {
      if (result === 'Yes') {
        await this.gameInvitationService.delete(record._id);
        this.matSnackBar.open('Game Invitation deleted successfully.');
      }
    });
  }

  private async fetchGameInvitations() {
    const $gameInvitations = this.gameInvitationQuery.selectAll({
      filterBy: gameInvitation =>
        gameInvitation.namespaceId === this.selectedNamespaceService.namespaceId,
    });
    this.$gameInvitations = this.gameInvitationQuery.populate($gameInvitations);

    await this.gameInvitationService.find({
      sort: '-createdAt',
      where: { namespaceId: this.selectedNamespaceService.namespaceId },
    });

    this.updateDataSource$ = this.$gameInvitations.subscribe(
      gameInvitations => (this.dataSource.data = gameInvitations),
    );

    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }
}
