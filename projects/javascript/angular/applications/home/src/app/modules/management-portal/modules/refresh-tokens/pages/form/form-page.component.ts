import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material';
import { ActivatedRoute, Router } from '@angular/router';
import {
  Game,
  RefreshToken,
  RefreshTokenService,
  Release,
  ReleaseService,
} from '@tenlastic/ng-http';

import { IdentityService } from '../../../../../../core/services';
import { RefreshTokenPromptComponent } from '../../../../../../shared/components';

@Component({
  templateUrl: 'form-page.component.html',
  styleUrls: ['./form-page.component.scss'],
})
export class RefreshTokensFormPageComponent implements OnInit {
  public data: RefreshToken;
  public error: string;
  public form: FormGroup;
  public games: Game[];
  public releases: Release[];

  private game: Game;

  constructor(
    private activatedRoute: ActivatedRoute,
    private formBuilder: FormBuilder,
    public identityService: IdentityService,
    private matDialog: MatDialog,
    private refreshTokenService: RefreshTokenService,
    private releaseService: ReleaseService,
    private router: Router,
  ) {}

  public ngOnInit() {
    this.activatedRoute.paramMap.subscribe(async params => {
      const jti = params.get('jti');
      if (jti !== 'new') {
        this.data = await this.refreshTokenService.findOne(jti);
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

    if (this.data.jti) {
      this.update(values);
    } else {
      this.create(values);
    }
  }

  private async create(data: Partial<RefreshToken>) {
    let refreshToken: string;

    try {
      const result = await this.refreshTokenService.create(data);
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
      description: [this.data.description],
      jti: [{ disabled: true, value: this.data.jti }],
    });

    this.form.valueChanges.subscribe(() => (this.error = null));
  }

  private async update(data: Partial<RefreshToken>) {
    data.jti = this.data.jti;

    try {
      await this.refreshTokenService.update(data);
      this.router.navigate(['../'], { relativeTo: this.activatedRoute });
    } catch (e) {
      this.error = 'That name is already taken.';
    }
  }
}
