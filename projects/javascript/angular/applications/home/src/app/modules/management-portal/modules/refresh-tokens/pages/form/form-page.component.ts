import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialog, MatSnackBar } from '@angular/material';
import { ActivatedRoute, Router } from '@angular/router';
import { RefreshToken, RefreshTokenService } from '@tenlastic/ng-http';

import { IdentityService } from '../../../../../../core/services';
import { RefreshTokenPromptComponent } from '../../../../../../shared/components';
import { SNACKBAR_DURATION } from '../../../../../../shared/constants';

@Component({
  templateUrl: 'form-page.component.html',
  styleUrls: ['./form-page.component.scss'],
})
export class RefreshTokensFormPageComponent implements OnInit {
  public data: RefreshToken;
  public error: string;
  public form: FormGroup;

  constructor(
    private activatedRoute: ActivatedRoute,
    private formBuilder: FormBuilder,
    public identityService: IdentityService,
    private matDialog: MatDialog,
    private matSnackBar: MatSnackBar,
    private refreshTokenService: RefreshTokenService,
    private router: Router,
  ) {}

  public ngOnInit() {
    this.activatedRoute.paramMap.subscribe(async params => {
      const _id = params.get('_id');
      if (_id !== 'new') {
        this.data = await this.refreshTokenService.findOne(_id);
      }

      this.setupForm();
    });
  }

  public async save() {
    if (this.form.invalid) {
      this.form.get('description').markAsTouched();

      return;
    }

    const values: Partial<RefreshToken> = {
      description: this.form.get('description').value,
    };

    if (this.data._id) {
      this.update(values);
    } else {
      this.create(values);
    }
  }

  private async create(data: Partial<RefreshToken>) {
    let refreshToken: string;

    try {
      const result = await this.refreshTokenService.create(data);
      this.matSnackBar.open('Refresh Token created successfully.', null, {
        duration: SNACKBAR_DURATION,
      });
      refreshToken = result.refreshToken;
    } catch (e) {
      this.error = 'That description is already taken.';
    }

    const dialogRef = this.matDialog.open(RefreshTokenPromptComponent, {
      data: { token: refreshToken },
    });

    dialogRef.afterClosed().subscribe(() => {
      this.router.navigate(['../'], { relativeTo: this.activatedRoute });
    });
  }

  private setupForm(): void {
    this.data = this.data || new RefreshToken();

    this.form = this.formBuilder.group({
      _id: [{ disabled: true, value: this.data._id }],
      description: [this.data.description],
    });

    this.form.valueChanges.subscribe(() => (this.error = null));
  }

  private async update(data: Partial<RefreshToken>) {
    data._id = this.data._id;

    try {
      await this.refreshTokenService.update(data);
      this.matSnackBar.open('Refresh Token updated successfully.', null, {
        duration: SNACKBAR_DURATION,
      });
      this.router.navigate(['../'], { relativeTo: this.activatedRoute });
    } catch (e) {
      this.error = 'That name is already taken.';
    }
  }
}
