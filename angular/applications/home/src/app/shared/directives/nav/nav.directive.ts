import { Directive, ElementRef, HostListener, OnDestroy, OnInit } from '@angular/core';

@Directive({ selector: '[appNav]' })
export class NavDirective implements OnDestroy, OnInit {
  constructor(private elementRef: ElementRef) {}

  public ngOnInit() {
    let element = this.elementRef.nativeElement as Element;
    element.classList.add('last');

    while (element.parentNode) {
      element = element.parentNode as Element;

      if (element.hasAttribute && element.hasAttribute('appNav')) {
        element.classList.remove('last');
      }

      const siblings = element.parentNode ? Array.from(element.parentNode.childNodes) : [];
      for (let i = 0; i < siblings.length; i++) {
        const sibling = siblings[i] as Element;

        if (sibling.hasAttribute && sibling.hasAttribute('appNav')) {
          sibling.classList.remove('last');
        }
      }
    }
  }

  public ngOnDestroy() {
    let element = this.elementRef.nativeElement as Element;

    while (element.parentNode) {
      element = element.parentNode as Element;

      if (element.hasAttribute && element.hasAttribute('appNav')) {
        element.classList.add('last');
        return;
      }

      const siblings = element.parentNode ? Array.from(element.parentNode.childNodes) : [];
      for (let i = 0; i < siblings.length; i++) {
        const sibling = siblings[i] as Element;

        if (sibling.hasAttribute && sibling.hasAttribute('appNav')) {
          sibling.classList.add('last');
          return;
        }
      }
    }
  }
}
