import { Component, Input, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

@Component({
  selector: 'app-data-source-filter',
  styleUrls: ['./data-source-filter.component.scss'],
  templateUrl: './data-source-filter.component.html',
})
export class DataSourceFilterComponent implements OnInit {
  @Input() public dataSource: MatTableDataSource<any>;

  public value: string;

  private subject: Subject<string> = new Subject();

  public ngOnInit() {
    this.subject.pipe(debounceTime(300)).subscribe(this.applyFilter.bind(this));
  }

  public clear() {
    this.applyFilter('');
    this.value = '';
  }

  public setValue(value: string) {
    this.subject.next(value);
  }

  private applyFilter(value: string) {
    this.dataSource.filter = value.trim();
  }
}
