import { Component, Input } from '@angular/core';

export interface BreadcrumbsComponentBreadcrumb {
  label: string;
  link?: string | string[];
}

@Component({
  selector: 'app-breadcrumbs',
  styleUrls: ['./breadcrumbs.component.scss'],
  templateUrl: './breadcrumbs.component.html',
})
export class BreadcrumbsComponent {
  @Input() public breadcrumbs: BreadcrumbsComponentBreadcrumb[] = [];
}
