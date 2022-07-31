import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Article, ArticleService, Storefront, StorefrontService } from '@tenlastic/ng-http';

@Component({
  styleUrls: ['./storefront-page.component.scss'],
  templateUrl: 'storefront-page.component.html',
})
export class StorefrontPageComponent implements OnInit {
  @ViewChild('video') private video: ElementRef;

  public articles: Article[];
  public error: string;
  public get images() {
    return this.storefront.images.filter((i) => i !== this.mainMedia?.src);
  }
  public loadingMessage: string;
  public mainMedia: { src: string; type: 'image' | 'video' };
  public storefront: Storefront;
  public get timestamp() {
    return new Date().getTime();
  }
  public get videos() {
    return this.storefront.videos.filter((i) => i !== this.mainMedia?.src);
  }

  constructor(
    private activatedRoute: ActivatedRoute,
    private articleService: ArticleService,
    private storefrontService: StorefrontService,
  ) {}

  public async ngOnInit() {
    this.activatedRoute.params.subscribe(async (params) => {
      this.loadingMessage = 'Loading Storefront information...';

      const storefronts = await this.storefrontService.find({
        limit: 1,
        where: { namespaceId: params.namespaceId },
      });
      this.storefront = storefronts[0];

      if (this.storefront.videos.length > 0) {
        this.selectMedia(0, 'video', true);
      } else {
        this.selectMedia(0, 'image', true);
      }

      this.articles = await this.articleService.find({
        sort: '-publishedAt',
        where: {
          namespaceId: this.storefront.namespaceId,
          publishedAt: { $exists: true, $ne: null },
        },
      });

      this.loadingMessage = null;
    });
  }

  public async selectMedia(index: number, type: 'image' | 'video' = 'image', muted = false) {
    this.mainMedia = {
      src: type === 'image' ? this.images[index] : this.videos[index],
      type,
    };

    if (type === 'video' && this.video) {
      this.video.nativeElement.load();
      this.video.nativeElement.muted = muted;
      this.video.nativeElement.setAttribute('onloadedmetadata', `this.muted=${muted}`);
    }
  }
}
