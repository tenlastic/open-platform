import { Component, Input, OnInit } from '@angular/core';
import { AbstractControl, FormControl } from '@angular/forms';
import { User, UserQuery, UserService } from '@tenlastic/ng-http';
import { Observable, Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

@Component({
  selector: 'app-autocomplete-user-field',
  styleUrls: ['autocomplete-user-field.component.scss'],
  templateUrl: 'autocomplete-user-field.component.html',
})
export class AutocompleteUserFieldComponent implements OnInit {
  @Input() public control: FormControl;

  public $users = new Observable<User[]>();
  public isLoading = false;
  public get isRequired() {
    if (!this.control.validator) {
      return false;
    }

    const validator = this.control.validator({} as AbstractControl);
    return validator?.required;
  }

  private subject = new Subject<string>();

  constructor(private userQuery: UserQuery, private userService: UserService) {}

  public ngOnInit() {
    this.subject.pipe(debounceTime(300)).subscribe((username) => this.findUsers(username));
  }

  public displayWith(user: User) {
    return user?.username;
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

    this.$users = this.userQuery.selectAll({ filterBy: (u) => u.username.startsWith(username) });
    await this.userService.find({
      sort: 'username',
      where: {
        username: { $regex: `^${username}`, $options: 'i' },
      },
    });

    this.isLoading = false;
  }
}
