import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import {
  Authorization,
  AuthorizationService,
  Game,
  GameQuery,
  GameService,
  IAuthorization,
} from '@tenlastic/ng-http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { IdentityService, SelectedNamespaceService } from '../../../../../../core/services';
import {
  BreadcrumbsComponentBreadcrumb,
  PromptComponent,
} from '../../../../../../shared/components';

@Component({
  templateUrl: 'form-page.component.html',
  styleUrls: ['./form-page.component.scss'],
})
export class AuthorizationsFormPageComponent implements OnInit {
  public breadcrumbs: BreadcrumbsComponentBreadcrumb[] = [];
  public data: Authorization;
  public errors: string[] = [];
  public form: FormGroup;
  public statuses = [
    { label: 'Granted', value: IAuthorization.AuthorizationStatus.Granted },
    { label: 'Revoked', value: IAuthorization.AuthorizationStatus.Revoked },
  ];

  constructor(
    private activatedRoute: ActivatedRoute,
    private authorizationService: AuthorizationService,
    private formBuilder: FormBuilder,
    public identityService: IdentityService,
    private matDialog: MatDialog,
    private matSnackBar: MatSnackBar,
    private router: Router,
    public selectedNamespaceService: SelectedNamespaceService,
  ) {}

  public async ngOnInit() {
    this.breadcrumbs = [
      { label: 'Authorizations', link: '../' },
      { label: 'Create Authorization' },
    ];

    this.setupForm();
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

    const values: Partial<Authorization> = {
      namespaceId: this.form.get('namespaceId').value,
      status: this.form.get('status').value,
      userId: this.form.get('user').value._id,
    };

    try {
      await this.create(values);
    } catch (e) {
      this.handleHttpError(e, { namespaceId: 'Namespace', userId: 'User' });
    }
  }

  private async handleHttpError(err: HttpErrorResponse, pathMap: any) {
    this.errors = err.error.errors.map((e) => {
      if (e.name === 'UniqueError') {
        const combination = e.paths.length > 1 ? 'combination ' : '';
        const paths = e.paths.map((p) => pathMap[p]);
        return `${paths.join(' / ')} ${combination}is not unique: ${e.values.join(' / ')}.`;
      } else {
        return e.message;
      }
    });
  }

  private async create(data: Partial<Authorization>) {
    await this.authorizationService.create(data);

    this.matSnackBar.open('Authorization saved successfully.');
    this.router.navigate(['../'], { relativeTo: this.activatedRoute });
  }

  private setupForm(): void {
    this.data = this.data || new Authorization();

    this.form = this.formBuilder.group({
      namespaceId: [this.selectedNamespaceService.namespaceId, Validators.required],
      status: [this.data.status || IAuthorization.AuthorizationStatus.Granted, Validators.required],
      user: [null, Validators.required],
    });

    this.form.valueChanges.subscribe(() => (this.errors = []));
  }
}
