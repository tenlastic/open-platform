import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Storefront, StorefrontQuery, StorefrontService } from '@tenlastic/ng-http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-storefront-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
})
export class LayoutComponent implements OnInit {
  public $storefront: Observable<Storefront>;

  constructor(
    private activatedRoute: ActivatedRoute,
    private storefrontQuery: StorefrontQuery,
    private storefrontService: StorefrontService,
  ) {}

  public async ngOnInit() {
    this.activatedRoute.params.subscribe(async (params) => {
      this.$storefront = this.storefrontQuery
        .selectAll({ filterBy: (s) => s.namespaceId === params.namespaceId })
        .pipe(map((s) => s[0]));

      await this.storefrontService.find({ limit: 1, where: { namespaceId: params.namespaceId } });
    });
  }
}
