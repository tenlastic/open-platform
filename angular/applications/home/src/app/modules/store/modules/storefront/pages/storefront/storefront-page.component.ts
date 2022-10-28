import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { StorefrontModel, StorefrontQuery, StorefrontService } from '@tenlastic/http';
import { Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  styleUrls: ['./storefront-page.component.scss'],
  templateUrl: 'storefront-page.component.html',
})
export class StorefrontPageComponent implements OnDestroy, OnInit {
  @ViewChild('video') private video: ElementRef;

  public $storefront: Observable<StorefrontModel>;
  public columns: number;
  public error: string;
  public images: string[] = [];
  public loadingMessage: string;
  public mainMedia: { src: string; type: 'image' | 'video' };
  public storefront: StorefrontModel;
  public get timestamp() {
    return new Date().getTime();
  }
  public videos: string[] = [];

  private setImagesAndVideos$ = new Subscription();

  constructor(
    private activatedRoute: ActivatedRoute,
    private storefrontQuery: StorefrontQuery,
    private storefrontService: StorefrontService,
  ) {}

  public async ngOnInit() {
    this.activatedRoute.params.subscribe(async (params) => {
      this.loadingMessage = 'Loading Storefront information...';

      this.$storefront = this.storefrontQuery
        .selectAll({ filterBy: (s) => s.namespaceId === params.namespaceId })
        .pipe(map((s) => s[0]));

      this.setImagesAndVideos$ = this.$storefront.subscribe((s) => {
        if (!s) {
          return;
        }

        this.images = s.images.filter((i) => i !== this.mainMedia?.src);
        this.videos = s.videos.filter((i) => i !== this.mainMedia?.src);
        this.columns = this.images.length + this.videos.length >= 8 ? 4 : 3;

        if (!this.mainMedia) {
          this.selectMedia(0, s.videos.length > 0 ? 'video' : 'image');
        }
      });

      await this.storefrontService.find(params.namespaceId, { limit: 1 });

      this.loadingMessage = null;
    });
  }

  public ngOnDestroy() {
    this.setImagesAndVideos$.unsubscribe();
  }

  public async selectMedia(index: number, type: 'image' | 'video' = 'image', muted = true) {
    this.mainMedia = { src: type === 'image' ? this.images[index] : this.videos[index], type };

    if (type === 'video' && this.video) {
      this.video.nativeElement.load();
      this.video.nativeElement.muted = muted;
      this.video.nativeElement.setAttribute('onloadedmetadata', `this.muted=${muted}`);
    }
  }
}
