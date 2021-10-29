import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { IUser, User, UserService } from '@tenlastic/ng-http';

import { IdentityService } from '../../../../../../core/services';
import {
  BreadcrumbsComponentBreadcrumb,
  PromptComponent,
} from '../../../../../../shared/components';

@Component({
  templateUrl: 'form-page.component.html',
  styleUrls: ['./form-page.component.scss'],
})
export class UsersFormPageComponent implements OnInit {
  public breadcrumbs: BreadcrumbsComponentBreadcrumb[] = [];
  public data: User;
  public errors: string[] = [];
  public form: FormGroup;
  public loadingMessage: string;
  public roles: any[];

  constructor(
    private activatedRoute: ActivatedRoute,
    private formBuilder: FormBuilder,
    public identityService: IdentityService,
    private matDialog: MatDialog,
    private matSnackBar: MatSnackBar,
    private router: Router,
    private userService: UserService,
  ) {}

  public ngOnInit() {
    this.activatedRoute.paramMap.subscribe(async (params) => {
      this.loadingMessage = 'Loading User...';

      this.roles = Object.keys(IUser.Role).map((key) => ({
        label: key.replace(/([A-Z])/g, ' $1').trim(),
        value: IUser.Role[key],
      }));

      try {
        const _id = params.get('_id');

        this.breadcrumbs = [
          { label: 'Users', link: '../' },
          { label: _id === 'new' ? 'Create User' : 'Edit User' },
        ];

        if (_id !== 'new') {
          this.data = await this.userService.findOne(_id);
        }

        this.setupForm();
      } catch {
        this.router.navigate(['../new'], { relativeTo: this.activatedRoute });
      }

      this.loadingMessage = null;
    });
  }

  public navigateToJson() {
    if (this.form.dirty) {
      const dialogRef = this.matDialog.open(PromptComponent, {
        data: {
          buttons: [
            { color: 'primary', label: 'No' },
            { color: 'accent', label: 'Yes' },
          ],
          message: 'Changes will not be saved. Is this OK?',
        },
      });

      dialogRef.afterClosed().subscribe(async (result) => {
        if (result === 'Yes') {
          this.router.navigate([`json`], { relativeTo: this.activatedRoute });
        }
      });
    } else {
      this.router.navigate([`json`], { relativeTo: this.activatedRoute });
    }
  }

  public async save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const values: Partial<User> = {
      email: this.form.get('email').value,
      roles: this.form.get('roles').value,
      username: this.form.get('username').value,
    };

    try {
      await this.upsert(values);
    } catch (e) {
      this.handleHttpError(e, { email: 'Email Address', username: 'Username' });
    }
  }

  private async handleHttpError(err: HttpErrorResponse, pathMap: any) {
    this.errors = err.error.errors.map((e) => {
      if (e.name === 'UniquenessError') {
        const combination = e.paths.length > 1 ? 'combination ' : '';
        const paths = e.paths.map((p) => pathMap[p]);
        return `${paths.join(' / ')} ${combination}is not unique: ${e.values.join(' / ')}.`;
      } else {
        return e.message;
      }
    });
  }

  private setupForm(): void {
    this.data = this.data || new User();

    this.form = this.formBuilder.group({
      email: [this.data.email, Validators.email],
      roles: [this.data.roles],
      username: [
        this.data.username,
        [Validators.required, Validators.pattern(/^[A-Za-z0-9]+$/), Validators.maxLength(20)],
      ],
    });

    this.form.valueChanges.subscribe(() => (this.errors = []));
  }

  private async upsert(data: Partial<User>) {
    if (this.data._id) {
      data._id = this.data._id;
      await this.userService.update(data);
    } else {
      await this.userService.create(data);
    }

    this.matSnackBar.open('User saved successfully.');
    this.router.navigate(['../'], { relativeTo: this.activatedRoute });
  }
}
