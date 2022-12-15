import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
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
  public get columns() {
    return this.images?.length + this.videos?.length >= 8 ? 4 : 3;
  }
  public error: string;
  public get images() {
    return this.storefront?.images.filter((i) => i !== this.mainMedia?.src);
  }
  public loadingMessage: string;
  public mainMedia: { src: string; type: 'image' | 'video' };
  public get timestamp() {
    return new Date().getTime();
  }
  public get videos() {
    return this.storefront?.videos.filter((v) => v !== this.mainMedia?.src);
  }

  private setImagesAndVideos$ = new Subscription();
  private storefront: StorefrontModel;

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private storefrontQuery: StorefrontQuery,
    private storefrontService: StorefrontService,
  ) {}

  public async ngOnInit() {
    this.activatedRoute.params.subscribe(async (params) => {
      this.loadingMessage = 'Loading Storefront information...';

      this.$storefront = this.storefrontQuery.selectEntity(params.namespaceId);

      this.setImagesAndVideos$ = this.$storefront.subscribe((s) => {
        this.storefront = s;

        if (!this.mainMedia && this.storefront) {
          this.selectMedia(0, this.storefront.videos.length > 0 ? 'video' : 'image');
        }
      });

      try {
        await this.storefrontService.find(params.namespaceId, { limit: 1 });
      } catch (e) {
        this.router.navigate(['../'], { relativeTo: this.activatedRoute });
      }

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
