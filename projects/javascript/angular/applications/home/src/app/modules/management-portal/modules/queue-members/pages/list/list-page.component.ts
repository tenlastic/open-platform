import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import {
  MatPaginator,
  MatSort,
  MatTable,
  MatTableDataSource,
  MatDialog,
  MatSnackBar,
} from '@angular/material';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { QueueMember, QueueMemberQuery, QueueMemberService } from '@tenlastic/ng-http';
import { Observable, Subscription } from 'rxjs';

import { IdentityService } from '../../../../../../core/services';
import { PromptComponent } from '../../../../../../shared/components';
import { TITLE } from '../../../../../../shared/constants';

@Component({
  templateUrl: 'list-page.component.html',
  styleUrls: ['./list-page.component.scss'],
})
export class QueueMembersListPageComponent implements OnDestroy, OnInit {
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild(MatTable, { static: true }) table: MatTable<QueueMember>;

  public $queueMembers: Observable<QueueMember[]>;
  public dataSource = new MatTableDataSource<QueueMember>();
  public displayedColumns: string[] = ['username', 'createdAt', 'actions'];

  private updateDataSource$ = new Subscription();

  constructor(
    private activatedRoute: ActivatedRoute,
    public identityService: IdentityService,
    private matDialog: MatDialog,
    private matSnackBar: MatSnackBar,
    private queueMemberQuery: QueueMemberQuery,
    private queueMemberService: QueueMemberService,
    private titleService: Title,
  ) {}

  public ngOnInit() {
    this.titleService.setTitle(`${TITLE} | QueueMembers`);
    this.fetchQueueMembers();
  }

  public ngOnDestroy() {
    this.updateDataSource$.unsubscribe();
  }

  public showDeletePrompt(record: QueueMember) {
    const dialogRef = this.matDialog.open(PromptComponent, {
      data: {
        buttons: [
          { color: 'primary', label: 'No' },
          { color: 'accent', label: 'Yes' },
        ],
        message: `Are you sure you want to delete this QueueMember?`,
      },
    });

    dialogRef.afterClosed().subscribe(async result => {
      if (result === 'Yes') {
        await this.queueMemberService.delete(record._id);
        this.matSnackBar.open('Queue Member deleted successfully.');
      }
    });
  }

  private async fetchQueueMembers() {
    const queueId = this.activatedRoute.snapshot.paramMap.get('_id');

    const $queueMembers = this.queueMemberQuery.selectAll({
      filterBy: qm => qm.queueId === queueId,
    });
    this.$queueMembers = this.queueMemberQuery.populate($queueMembers);

    await this.queueMemberService.find({
      sort: 'createdAt',
      where: { queueId },
    });

    this.updateDataSource$ = this.$queueMembers.subscribe(
      queueMembers => (this.dataSource.data = queueMembers),
    );

    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }
}
