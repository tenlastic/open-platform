import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatPaginator, MatSort, MatTable, MatTableDataSource, MatDialog } from '@angular/material';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { QueueMember, QueueMemberQuery, QueueMemberService } from '@tenlastic/ng-http';
import { Observable, Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

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
  public search = '';

  private updateDataSource$ = new Subscription();
  private subject: Subject<string> = new Subject();

  constructor(
    private activatedRoute: ActivatedRoute,
    public identityService: IdentityService,
    private matDialog: MatDialog,
    private queueMemberQuery: QueueMemberQuery,
    private queueMemberService: QueueMemberService,
    private titleService: Title,
  ) {}

  public ngOnInit() {
    this.titleService.setTitle(`${TITLE} | QueueMembers`);
    this.fetchQueueMembers();

    this.subject.pipe(debounceTime(300)).subscribe(this.applyFilter.bind(this));
  }

  public ngOnDestroy() {
    this.updateDataSource$.unsubscribe();
  }

  public clearSearch() {
    this.search = '';
    this.applyFilter('');
  }

  public onKeyUp(searchTextValue: string) {
    this.subject.next(searchTextValue);
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
        this.deleteQueueMember(record);
      }
    });
  }

  private applyFilter(filterValue: string) {
    this.dataSource.filter = filterValue.trim().toLowerCase();
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

  private deleteQueueMember(record: QueueMember) {
    const index = this.dataSource.data.findIndex(u => u._id === record._id);
    this.dataSource.data.splice(index, 1);

    this.dataSource.data = [].concat(this.dataSource.data);
    this.table.renderRows();
  }
}
