import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import { Game, GameService, IGame } from '@tenlastic/ng-http';

import { IdentityService, SelectedNamespaceService } from '../../../../../../core/services';
import { PromptComponent } from '../../../../../../shared/components';
import { MediaDialogComponent } from '../../components';

interface PropertyFormGroup {
  key?: string;
  type?: string;
  value?: any;
}

@Component({
  templateUrl: 'form-page.component.html',
  styleUrls: ['./form-page.component.scss'],
})
export class GamesFormPageComponent implements OnInit {
  public accesses = [
    { label: 'Private', value: 'private' },
    { label: 'Public w/ Authorization', value: 'private-public' },
    { label: 'Public', value: 'public' },
  ];
  public data: Game;
  public errors: string[] = [];
  public form: FormGroup;
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
    private formBuilder: FormBuilder,
    private gameService: GameService,
    public identityService: IdentityService,
    private matDialog: MatDialog,
    private matSnackBar: MatSnackBar,
    public selectedNamespaceService: SelectedNamespaceService,
  ) {}

  public async ngOnInit() {
    this.activatedRoute.paramMap.subscribe(async params => {
      const _id = params.get('_id');
      if (_id !== 'new') {
        this.data = await this.gameService.findOne(_id);
      }

      this.setupForm();
    });
  }

  public addUser(formArray: FormArray) {
    formArray.push(this.formBuilder.control(null, [Validators.required]));
  }

  public async onFieldChanged($event, field: string) {
    const files: any[] = Array.from($event.target.files);
    if (!files.length) {
      return;
    }

    this.pending[field].push(...files);
    this.uploadErrors[field] = [];

    try {
      const { body } = await this.gameService.upload(this.data._id, field, files).toPromise();
      this.data = body.record;
    } catch (e) {
      this.uploadErrors[field] = this.handleUploadHttpError(e);
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

    dialogRef.afterClosed().subscribe(async result => {
      if (result === 'Yes') {
        if (index >= 0) {
          this.data[field] = this.data[field].filter((f, i) => i !== index);
          this.data = await this.gameService.update(this.data);
        } else {
          this.data[field] = null;
          this.data = await this.gameService.update(this.data);
        }

        this.uploadErrors[field] = [];
      }
    });
  }

  public async save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const metadata = this.form.get('metadata').value.reduce((accumulator, property) => {
      accumulator[property.key] = this.getJsonFromProperty(property);
      return accumulator;
    }, {});

    const values: Partial<Game> = {
      access: this.form.get('access').value,
      description: this.form.get('description').value,
      metadata,
      namespaceId: this.selectedNamespaceService.namespaceId,
      subtitle: this.form.get('subtitle').value,
      title: this.form.get('title').value,
    };

    try {
      await this.upsert(values);
    } catch (e) {
      this.handleHttpError(e, { namespaceId: 'Namespace', subtitle: 'Subtitle', title: 'Title' });
    }
  }

  public view(src: string, type: string = 'image') {
    this.matDialog.open(MediaDialogComponent, { autoFocus: false, data: { src, type } });
  }

  private getJsonFromProperty(property: PropertyFormGroup): any {
    switch (property.type) {
      case 'boolean':
        return property.value || false;

      case 'number':
        return isNaN(parseFloat(property.value)) ? 0 : parseFloat(property.value);

      default:
        return property.value || '';
    }
  }

  private async handleHttpError(err: HttpErrorResponse, pathMap: any) {
    this.errors = err.error.errors.map(e => {
      if (e.name === 'UniquenessError') {
        const combination = e.paths.length > 1 ? 'combination ' : '';
        const paths = e.paths.map(p => pathMap[p]);
        return `${paths.join(' / ')} ${combination}is not unique: ${e.values.join(' / ')}.`;
      } else {
        return e.message;
      }
    });
  }

  private handleUploadHttpError(err: HttpErrorResponse) {
    return err.error.errors.map(e => e.message);
  }

  private setupForm(): void {
    this.data = this.data || new Game();

    const metadata = [];
    if (this.data.metadata) {
      Object.entries(this.data.metadata).forEach(([key, property]) => {
        let type = 'boolean';
        if (typeof property === 'string' || property instanceof String) {
          type = 'string';
        } else if (typeof property === 'number') {
          type = 'number';
        }

        const formGroup = this.formBuilder.group({
          key: [key, [Validators.required, Validators.pattern(/^[0-9A-Za-z\-]{2,40}$/)]],
          value: [property, Validators.required],
          type,
        });
        metadata.push(formGroup);
      });
    }

    this.form = this.formBuilder.group({
      access: [this.data.access || IGame.Access.Private],
      description: [this.data.description, Validators.required],
      icon: [this.data.icon],
      metadata: this.formBuilder.array(metadata),
      subtitle: [this.data.subtitle],
      title: [this.data.title, Validators.required],
    });

    this.form.valueChanges.subscribe(() => (this.errors = []));
  }

  private async upsert(data: Partial<Game>) {
    if (this.data._id) {
      data._id = this.data._id;
      this.data = await this.gameService.update(data);
    } else {
      this.data = await this.gameService.create(data);
    }

    this.matSnackBar.open('Game saved successfully.');
  }
}
