import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material';
import { ActivatedRoute, Router } from '@angular/router';
import { GameInvitation, GameInvitationService, User, UserService } from '@tenlastic/ng-http';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

import {
  IdentityService,
  SelectedGameService,
  SelectedNamespaceService,
} from '../../../../../../core/services';
import { SNACKBAR_DURATION } from '../../../../../../shared/constants';

@Component({
  templateUrl: 'form-page.component.html',
  styleUrls: ['./form-page.component.scss'],
})
export class GameInvitationsFormPageComponent implements OnInit {
  public data: GameInvitation;
  public error: string;
  public form: FormGroup;
  public isLoading = false;
  public users: User[] = [];

  private subject: Subject<string> = new Subject();

  constructor(
    private activatedRoute: ActivatedRoute,
    private formBuilder: FormBuilder,
    private gameInvitationService: GameInvitationService,
    public identityService: IdentityService,
    private matSnackBar: MatSnackBar,
    private router: Router,
    private selectedGameService: SelectedGameService,
    public selectedNamespaceService: SelectedNamespaceService,
    private userService: UserService,
  ) {}

  public async ngOnInit() {
    this.subject.pipe(debounceTime(300)).subscribe(this.findUsers.bind(this));
    this.setupForm();
  }

  public displayWith(user: User) {
    if (user) {
      return user.username;
    }
  }

  public onUsernameChanged(searchTextValue: string) {
    this.subject.next(searchTextValue);
  }

  public async save() {
    if (this.form.invalid) {
      this.form.get('toUser').markAsTouched();

      return;
    }

    const toUser: User = this.form.get('toUser').value;

    const values: Partial<GameInvitation> = {
      gameId: this.selectedGameService.game._id,
      toUserId: toUser._id,
    };

    this.create(values);
  }

  private async create(data: Partial<GameInvitation>) {
    try {
      await this.gameInvitationService.create(data);
      this.matSnackBar.open('Game Invitation created successfully.', null, {
        duration: SNACKBAR_DURATION,
      });
      this.router.navigate(['../'], { relativeTo: this.activatedRoute });
    } catch (e) {
      this.error = 'An error occurred creating Game Invitation.';
    }
  }

  private async findUsers(username: string) {
    this.isLoading = true;

    this.users = await this.userService.find({
      sort: 'username',
      where: {
        username: { $regex: `${username}`, $options: 'i' },
      },
    });

    this.isLoading = false;
  }

  private setupForm(): void {
    this.data = this.data || new GameInvitation();

    this.form = this.formBuilder.group({
      toUser: [null, Validators.required],
    });

    this.form.valueChanges.subscribe(() => (this.error = null));
  }
}
