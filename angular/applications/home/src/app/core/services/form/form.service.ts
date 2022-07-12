import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { Model } from '@tenlastic/ng-http';
import { PromptComponent } from '../../../shared/components';

@Injectable({ providedIn: 'root' })
export class FormService {
  constructor(
    private activatedRoute: ActivatedRoute,
    private matDialog: MatDialog,
    private matSnackBar: MatSnackBar,
    private router: Router,
  ) {}

  public async handleHttpError(err: HttpErrorResponse, pathMap?: { [key: string]: string }) {
    return err.error.errors.map((e) => {
      if (e.name === 'CastError' || e.name === 'ValidatorError') {
        const path = pathMap ? pathMap[e.path] : e.path;
        return `(${path}) ${e.message}`;
      } else if (e.name === 'UniqueError') {
        const combination = e.paths.length > 1 ? 'combination ' : '';
        const paths = pathMap ? e.paths.map((p) => pathMap[p]) : e.paths;
        return `${paths.join(' / ')} ${combination}is not unique: ${e.values.join(' / ')}.`;
      } else {
        return e.message;
      }
    });
  }

  public navigateToForm(form: FormGroup) {
    if (form.dirty) {
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
          this.router.navigateByUrl(this.getUrl(this.router.url.concat('/', '../')));
        }
      });
    } else {
      this.router.navigateByUrl(this.getUrl(this.router.url.concat('/', '../')));
    }
  }

  public navigateToJson(form: FormGroup) {
    if (form.dirty) {
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
          this.router.navigateByUrl(this.getUrl(this.router.url.concat('/', 'json')));
        }
      });
    } else {
      this.router.navigateByUrl(this.getUrl(this.router.url.concat('/', 'json')));
    }
  }

  public async upsert<T extends Model>(
    service: { create: (data: Partial<T>) => Promise<T>; update: (data: Partial<T>) => Promise<T> },
    values: Partial<T>,
    options?: { name?: string; path?: string },
  ) {
    const result = values._id ? await service.update(values) : await service.create(values);

    const name = options?.name ?? result.constructor.name;
    this.matSnackBar.open(`${name} saved successfully.`);

    const path = options?.path ?? '../';
    const url = this.getUrl(this.router.url.concat('/', path, result._id));
    this.router.navigateByUrl(url);

    return result;
  }

  private getUrl(url: string) {
    url = url
      .split('/')
      .reduce((a, v) => {
        if (v === '.') {
          return a;
        } else if (v === '..') {
          a.pop();
        } else {
          a.push(v);
        }

        return a;
      }, [])
      .join('/');

    return url.endsWith('/') ? url.substring(0, url.length - 1) : url;
  }
}
