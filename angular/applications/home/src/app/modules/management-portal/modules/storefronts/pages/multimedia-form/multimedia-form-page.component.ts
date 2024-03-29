import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import { ApiError, StorefrontModel, StorefrontService } from '@tenlastic/http';

import { PromptComponent } from '../../../../../../shared/components';
import { MediaDialogComponent } from '../../components';

@Component({
  templateUrl: 'multimedia-form-page.component.html',
  styleUrls: ['./multimedia-form-page.component.scss'],
})
export class StorefrontsMultimediaFormPageComponent implements OnInit {
  public get data() {
    return this._data;
  }
  public set data(value) {
    const data = new StorefrontModel(value);
    const timestamp = Date.now();

    data.background = data.background ? `${data.background}?timestamp=${timestamp}` : null;
    data.icon = data.icon ? `${data.icon}?timestamp=${timestamp}` : null;
    data.logo = data.logo ? `${data.logo}?timestamp=${timestamp}` : null;

    this._data = data;
  }
  public pending: { [key: string]: Blob[] } = {
    background: [],
    icon: [],
    images: [],
    logo: [],
    videos: [],
  };
  public uploadErrors = {
    background: [],
    icon: [],
    images: [],
    logo: [],
    videos: [],
  };

  private _data: StorefrontModel;

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
    const files: Blob[] = Array.from($event.target.files);
    if (!files.length) {
      return;
    }

    $event.target.value = '';
    this.uploadErrors[field] = [];

    return Promise.all(files.map((f) => this.upload(field, f)));
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
        let _id: string;
        if (index >= 0) {
          const url = this.data[field][index];
          _id = url.substring(url.lastIndexOf('/') + 1);
        }

        const { namespaceId } = this.data;
        this.data = await this.storefrontService.pull(namespaceId, this.data._id, field, _id);

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

  private async handleHttpError(err: ApiError) {
    return err.errors.map((e) => e.message);
  }

  private async upload(field: string, file: Blob) {
    const fieldTitleCase = field.charAt(0).toUpperCase() + field.substring(1);

    if (file.size > 25 * 1000 * 1000) {
      this.uploadErrors[field] = ['File size must be smaller than 25MB.'];
      return;
    }

    this.pending[field].push(file);

    try {
      const formData = new FormData();
      formData.append(field, file);

      const storefront = await this.storefrontService.upload(
        this.data.namespaceId,
        this.data._id,
        field,
        formData,
      );

      this.data = storefront;
      this.matSnackBar.open(`${fieldTitleCase} uploaded successfully.`);
    } catch (e) {
      this.uploadErrors[field] = await this.handleHttpError(e);

      const index = this.pending[field].indexOf(file);
      this.pending[field].splice(index, 1);

      this.matSnackBar.open(`${fieldTitleCase} upload failed.`);
    } finally {
      const index = this.pending[field].indexOf(file);
      this.pending[field].splice(index, 1);
    }
  }
}
