import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import { StorefrontModel, StorefrontService } from '@tenlastic/ng-http';

import { PromptComponent } from '../../../../../../shared/components';
import { MediaDialogComponent } from '../../components';

@Component({
  templateUrl: 'multimedia-form-page.component.html',
  styleUrls: ['./multimedia-form-page.component.scss'],
})
export class StorefrontsMultimediaFormPageComponent implements OnInit {
  public data: StorefrontModel;
  public errors: string[] = [];
  public pending = {
    background: [],
    icon: [],
    images: [],
    videos: [],
  };
  public uploadErrors = {
    background: [],
    icon: [],
    images: [],
    videos: [],
  };

  constructor(
    private activatedRoute: ActivatedRoute,
    private matDialog: MatDialog,
    private matSnackBar: MatSnackBar,
    private storefrontService: StorefrontService,
  ) {}

  public async ngOnInit() {
    this.activatedRoute.params.subscribe(async (params) => {
      const storefronts = await this.storefrontService.find(params.namespaceId, { limit: 1 });
      this.data = storefronts[0];
    });
  }

  public async onFieldChanged($event, field: string) {
    const files: any[] = Array.from($event.target.files);
    if (!files.length) {
      return;
    }

    this.pending[field].push(...files);
    this.uploadErrors[field] = [];

    try {
      const { body } = await this.storefrontService
        .upload(this.data.namespaceId, this.data._id, field, files)
        .toPromise();
      this.data = body.record;

      const fieldTitleCase = field.charAt(0).toUpperCase() + field.substring(1);
      this.matSnackBar.open(`${fieldTitleCase} uploaded successfully.`);
    } catch (e) {
      this.uploadErrors[field] = this.handleHttpError(e);
    } finally {
      for (const file of files) {
        const index = this.pending[field].indexOf(file);
        this.pending[field].splice(index, 1);
      }
    }
  }

  public async remove(field: string, index = -1) {
    const dialogRef = this.matDialog.open(PromptComponent, {
      data: {
        buttons: [
          { color: 'primary', label: 'No' },
          { color: 'accent', label: 'Yes' },
        ],
        message: `Are you sure you want to remove this item?`,
      },
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result === 'Yes') {
        if (index >= 0) {
          this.data = await this.storefrontService.update(this.data.namespaceId, this.data._id, {
            _id: this.data._id,
            [field]: this.data[field].filter((f, i) => i !== index),
          });
        } else {
          this.data = await this.storefrontService.update(this.data.namespaceId, this.data._id, {
            [field]: null,
          });
        }

        const fieldTitleCase =
          field.charAt(0).toUpperCase() +
          field.substring(1, field.includes('s') ? field.length - 1 : field.length);
        this.matSnackBar.open(`${fieldTitleCase} removed successfully.`);

        this.uploadErrors[field] = [];
      }
    });
  }

  public view(src: string, type: string = 'image') {
    this.matDialog.open(MediaDialogComponent, { autoFocus: false, data: { src, type } });
  }

  private async handleHttpError(err: HttpErrorResponse) {
    return err.error.errors.map((e) => e.message);
  }
}
