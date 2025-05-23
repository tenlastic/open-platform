import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl } from '@angular/forms';
import { UserModel, UserQuery, UserService } from '@tenlastic/http';
import { Observable, Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

@Component({
  selector: 'app-autocomplete-user-field',
  styleUrls: ['autocomplete-user-field.component.scss'],
  templateUrl: 'autocomplete-user-field.component.html',
})
export class AutocompleteUserFieldComponent implements OnInit {
  @Input() public control: FormControl;
  @Input() public removeButton: boolean;
  @Input() public removeButtonTooltip: string;
  @Output() public OnRemove = new EventEmitter();

  public $users = new Observable<UserModel[]>();
  public isLoading = false;

  private subject = new Subject<string>();

  constructor(private userQuery: UserQuery, private userService: UserService) {}

  public ngOnInit() {
    this.subject.pipe(debounceTime(300)).subscribe((username) => this.findUsers(username));
  }

  public displayWith(user: UserModel) {
    return user?.displayName;
  }

  public async onFocusOut() {
    // Wait 100ms for autocomplete selection.
    await new Promise((res) => setTimeout(res, 100));

    if (!this.control.value || !this.control.value.username) {
      this.control.setValue(null);
    }
  }

  public onUsernameChanged(searchTextValue: string) {
    this.subject.next(searchTextValue);
  }

  private async findUsers(username: string) {
    this.isLoading = true;

    const regex = new RegExp(`^${username}`, 'i');
    this.$users = this.userQuery.selectAll({ filterBy: (u) => regex.test(u.username) });
    await this.userService.find({
      sort: 'username',
      where: { username: { $regex: `^${username}`, $options: 'i' } },
    });

    this.isLoading = false;
  }
}
