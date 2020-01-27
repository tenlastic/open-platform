import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material';
import { ActivatedRoute, Router } from '@angular/router';
import { IdentityService } from '@tenlastic/ng-authentication';
import { Game, GameService } from '@tenlastic/ng-http';

import { SelectedNamespaceService } from '../../../../core/services';
import { PromptComponent } from '../../../../shared/components';
import { MediaDialogComponent } from '../../components';

@Component({
  templateUrl: 'form-page.component.html',
  styleUrls: ['./form-page.component.scss'],
})
export class GamesFormPageComponent implements OnInit {
  public data: Game;
  public error: string;
  public form: FormGroup;

  constructor(
    private activatedRoute: ActivatedRoute,
    private formBuilder: FormBuilder,
    private gameService: GameService,
    public identityService: IdentityService,
    private matDialog: MatDialog,
    private router: Router,
    public selectedNamespaceService: SelectedNamespaceService,
  ) {}

  public ngOnInit() {
    this.activatedRoute.paramMap.subscribe(async params => {
      const slug = params.get('slug');

      if (slug !== 'new') {
        this.data = await this.gameService.findOne(slug);
      }

      this.setupForm();
    });
  }

  public async onFieldChanged($event, field: string, isArray: boolean = false) {
    const files: any[] = Array.from($event.target.files);
    if (!files.length) {
      return;
    }

    const response = await this.gameService
      .upload(this.data.slug, { [field]: files[0] })
      .toPromise();

    this.data = await this.gameService.update({
      ...this.data,
      [field]: isArray ? this.data[field].concat(response.body[field]) : response.body[field],
    });
  }

  public async remove(field: string, index = -1) {
    const dialogRef = this.matDialog.open(PromptComponent, {
      data: {
        buttons: [
          { background: 'accent', label: 'No' },
          { color: 'white', label: 'Yes' },
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
      this.form.get('slug').markAsTouched();
      this.form.get('subtitle').markAsTouched();
      this.form.get('title').markAsTouched();

      return;
    }

    const values: Partial<Game> = {
      description: this.form.get('description').value,
      namespaceId: this.selectedNamespaceService.namespaceId,
      slug: this.form.get('slug').value,
      subtitle: this.form.get('subtitle').value,
      title: this.form.get('title').value,
    };

    if (this.data._id) {
      this.update(values);
    } else {
      this.create(values);
    }
  }

  public view(src: string, type: string = 'image') {
    this.matDialog.open(MediaDialogComponent, { autoFocus: false, data: { src, type } });
  }

  private async create(data: Partial<Game>) {
    try {
      const response = await this.gameService.create(data);
      this.router.navigate(['../', response._id], { relativeTo: this.activatedRoute });
    } catch (e) {
      this.error = 'That slug is already taken.';
    }
  }

  private setupForm(): void {
    this.data = this.data || new Game();

    this.form = this.formBuilder.group({
      description: [this.data.description, Validators.required],
      iconUrl: [this.data.icon],
      slug: [this.data.slug, Validators.required],
      subtitle: [this.data.subtitle],
      title: [this.data.title, Validators.required],
    });

    this.form.valueChanges.subscribe(() => (this.error = null));
  }

  private async update(data: Partial<Game>) {
    data._id = this.data._id;

    try {
      this.data = await this.gameService.update(data);
    } catch (e) {
      this.error = 'That slug is already taken.';
    }
  }
}
