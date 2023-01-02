import { Injectable } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ApiError } from '@tenlastic/http';
import { PromptComponent } from '../../../shared/components';

@Injectable({ providedIn: 'root' })
export class FormService {
  constructor(private matDialog: MatDialog, private router: Router) {}

  public handleHttpError(err: ApiError, pathMap?: { [key: string]: string }) {
    return err.errors.map((e) => {
      if (e.name === 'CastError' || e.name === 'ValidatorError') {
        const path = (pathMap && pathMap[e.path]) ?? e.path;

        return `(${path}) ${e.message}`;
      } else if (e.name === 'DuplicateKeyError') {
        const combination = e.paths.length > 1 ? 'combination ' : '';
        const paths = pathMap ? e.paths.map((p) => pathMap[p]) : e.paths;

        return `${paths.join(' / ')} ${combination}is not unique.`;
      } else if (e.name === 'DuplicateKeyIndexError') {
        const paths = pathMap ? e.paths.map((p) => pathMap[p]) : e.paths;

        return (
          `Error building unique index: ${paths.join(' / ')}. ` +
          `Records already contain duplicate values: ${e.values.join(' / ')}.`
        );
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
