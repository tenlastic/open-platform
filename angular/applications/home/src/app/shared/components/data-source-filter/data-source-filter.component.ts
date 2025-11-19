import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

@Component({
  selector: 'app-data-source-filter',
  standalone: false,
  styleUrls: ['./data-source-filter.component.scss'],
  templateUrl: './data-source-filter.component.html',
})
export class DataSourceFilterComponent implements OnInit {
  @Output() public OnValueSet = new EventEmitter<string>();

  public value: string;

  private subject: Subject<string> = new Subject();

  public ngOnInit() {
    this.subject.pipe(debounceTime(300)).subscribe((v) => this.applyFilter(v));
  }

  public clear() {
    this.applyFilter('');
    this.value = '';
  }

  public setValue(value: string) {
    this.subject.next(value);
  }

  private applyFilter(value: string) {
    this.value = value.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    this.OnValueSet.emit(this.value);
  }
}
