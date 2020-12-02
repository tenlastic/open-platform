import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatSnackBar } from '@angular/material';
import { Game, GameService } from '@tenlastic/ng-http';

import { IdentityService, SelectedNamespaceService } from '../../../../../../core/services';
import { PromptComponent } from '../../../../../../shared/components';
import { MediaDialogComponent } from '../../components';

@Component({
  templateUrl: 'form-page.component.html',
  styleUrls: ['./form-page.component.scss'],
})
export class GamesFormPageComponent implements OnInit {
  public data: Game;
  public errors: string[] = [];
  public form: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    private gameService: GameService,
    public identityService: IdentityService,
    private matDialog: MatDialog,
    private matSnackBar: MatSnackBar,
    public selectedNamespaceService: SelectedNamespaceService,
  ) {}

  public async ngOnInit() {
    const games = await this.gameService.find({
      where: {
        namespaceId: this.selectedNamespaceService.namespaceId,
      },
    });

    this.data = games[0];
    this.setupForm();
  }

  public async onFieldChanged($event, field: string, isArray: boolean = false) {
    const files: any[] = Array.from($event.target.files);
    if (!files.length) {
      return;
    }

    const { body } = await this.gameService.upload(this.data._id, field, files).toPromise();
    this.data = body.record;
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
          const value = this.data[field].filter((f, i) => i !== index);
          this.data = await this.gameService.update({ ...this.data, [field]: value });
        } else {
          this.data = await this.gameService.update({ ...this.data, [field]: null });
        }
      }
    });
  }

  public async save() {
    if (this.form.invalid) {
      this.form.get('description').markAsTouched();
      this.form.get('subtitle').markAsTouched();
      this.form.get('title').markAsTouched();

      return;
    }

    const values: Partial<Game> = {
      description: this.form.get('description').value,
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

  private setupForm(): void {
    this.data = this.data || new Game();

    this.form = this.formBuilder.group({
      description: [this.data.description, Validators.required],
      icon: [this.data.icon],
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

    this.matSnackBar.open('Game Information saved successfully.');
  }
}
