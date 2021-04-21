import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Article } from '@tenlastic/ng-http';

export interface ArticleDialogComponentData {
  article: Article;
}

@Component({
  styleUrls: ['article-dialog.component.scss'],
  templateUrl: 'article-dialog.component.html',
})
export class ArticleDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ArticleDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ArticleDialogComponentData,
  ) {
    dialogRef.addPanelClass('article-dialog-component');
  }
}
