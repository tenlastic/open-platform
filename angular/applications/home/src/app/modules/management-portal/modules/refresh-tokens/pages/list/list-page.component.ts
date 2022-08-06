import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { Title } from '@angular/platform-browser';
import { RefreshTokenModel, RefreshTokenQuery, RefreshTokenService } from '@tenlastic/ng-http';
import { Observable, Subscription } from 'rxjs';

import { PromptComponent } from '../../../../../../shared/components';
import { TITLE } from '../../../../../../shared/constants';

@Component({
  templateUrl: 'list-page.component.html',
  styleUrls: ['./list-page.component.scss'],
})
export class RefreshTokensListPageComponent implements OnDestroy, OnInit {
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild(MatTable, { static: true }) table: MatTable<RefreshTokenModel>;

  public $refreshTokens: Observable<RefreshTokenModel[]>;
  public dataSource = new MatTableDataSource<RefreshTokenModel>();
  public displayedColumns = ['_id', 'createdAt', 'updatedAt', 'expiresAt', 'actions'];

  private updateDataSource$ = new Subscription();

  constructor(
    private matDialog: MatDialog,
    private matSnackBar: MatSnackBar,
    private refreshTokenQuery: RefreshTokenQuery,
    private refreshTokenService: RefreshTokenService,
    private titleService: Title,
  ) {}

  public async ngOnInit() {
    this.titleService.setTitle(`${TITLE} | Refresh Tokens`);
    this.fetchRefreshTokens();
  }

  public ngOnDestroy() {
    this.updateDataSource$.unsubscribe();
  }

  public showDeletePrompt($event: Event, record: RefreshTokenModel) {
    $event.stopPropagation();

    const dialogRef = this.matDialog.open(PromptComponent, {
      data: {
        buttons: [
          { color: 'primary', label: 'No' },
          { color: 'accent', label: 'Yes' },
        ],
        message: `Are you sure you want to delete this Refresh Token?`,
      },
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result === 'Yes') {
        await this.refreshTokenService.delete(record._id);
        this.matSnackBar.open('Refresh Token deleted successfully.');
      }
    });
  }

  private async fetchRefreshTokens() {
    this.$refreshTokens = this.refreshTokenQuery.selectAll();

    await this.refreshTokenService.find({});

    this.updateDataSource$ = this.$refreshTokens.subscribe(
      (refreshTokens) => (this.dataSource.data = refreshTokens),
    );

    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }
}
