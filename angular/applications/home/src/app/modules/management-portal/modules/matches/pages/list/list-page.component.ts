import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Params } from '@angular/router';
import {
  AuthorizationQuery,
  IAuthorization,
  MatchModel,
  MatchQuery,
  MatchService,
  QueueQuery,
  QueueService,
} from '@tenlastic/http';
import { Observable, Subscription } from 'rxjs';

import { IdentityService } from '../../../../../../core/services';
import { PromptComponent } from '../../../../../../shared/components';

@Component({
  templateUrl: 'list-page.component.html',
  styleUrls: ['./list-page.component.scss'],
})
export class MatchesListPageComponent implements OnDestroy, OnInit {
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild(MatTable, { static: true }) table: MatTable<MatchModel>;

  public dataSource = new MatTableDataSource<MatchModel>();
  public get displayedColumns() {
    return this.params.queueId
      ? ['teams', 'users', 'createdAt', 'finishedAt', 'actions']
      : ['queue', 'teams', 'users', 'createdAt', 'finishedAt', 'actions'];
  }
  public hasWriteAuthorization: boolean;

  private $matches: Observable<MatchModel[]>;
  private updateDataSource$ = new Subscription();

  private params: Params;

  constructor(
    private activatedRoute: ActivatedRoute,
    private authorizationQuery: AuthorizationQuery,
    private identityService: IdentityService,
    private matchQuery: MatchQuery,
    private matchService: MatchService,
    private matDialog: MatDialog,
    private matSnackBar: MatSnackBar,
    private queueQuery: QueueQuery,
    private queueService: QueueService,
  ) {}

  public ngOnInit() {
    this.activatedRoute.params.subscribe((params) => {
      this.params = params;

      const roles = [IAuthorization.Role.MatchesReadWrite];
      const userId = this.identityService.user?._id;
      this.hasWriteAuthorization =
        this.authorizationQuery.hasRoles(null, roles, userId) ||
        this.authorizationQuery.hasRoles(params.namespaceId, roles, userId);

      this.fetchMatches(params);
    });
  }

  public ngOnDestroy() {
    this.updateDataSource$.unsubscribe();
  }

  public getQueue(_id: string) {
    return this.queueQuery.getEntity(_id);
  }

  public getUserIds(match: MatchModel) {
    return match.teams.reduce((previous, current) => [...previous, ...current.userIds], []);
  }

  public showDeletePrompt($event: Event, record: MatchModel) {
    $event.stopPropagation();

    const dialogRef = this.matDialog.open(PromptComponent, {
      data: {
        buttons: [
          { color: 'primary', label: 'No' },
          { color: 'accent', label: 'Yes' },
        ],
        message: `Are you sure you want to delete this Match?`,
      },
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result === 'Yes') {
        await this.matchService.delete(record.namespaceId, record._id);
        this.matSnackBar.open('Match deleted successfully.');
      }
    });
  }

  private async fetchMatches(params: Params) {
    this.$matches = this.matchQuery.selectAll({
      filterBy: (m) =>
        m.namespaceId === params.namespaceId && (!params.queueId || m.queueId === params.queueId),
    });

    this.updateDataSource$ = this.$matches.subscribe((matches) => (this.dataSource.data = matches));

    this.dataSource.filterPredicate = (data: MatchModel, filter: string) => {
      const queue = this.getQueue(data.queueId);
      const regex = new RegExp(filter.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i');

      return filter === `${this.getUserIds(data).length}` || regex.test(queue?.name);
    };

    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    const matches = await this.matchService.find(params.namespaceId, { sort: 'name' });

    if (params.queueId) {
      return;
    }

    const queueIds = matches
      .map((m) => m.queueId)
      .flat()
      .filter((qi, i, arr) => arr.indexOf(qi) === i);
    await this.queueService.find(params.namespaceId, { where: { _id: { $in: queueIds } } });
  }
}
