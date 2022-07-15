import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({ selector: '[highlight]' })
export class HighlightDirective {
  private static elements = new Set<Element>();

  constructor(private elementRef: ElementRef) {}

  @HostListener('mouseenter')
  private onMouseEnter() {
    let element = this.elementRef.nativeElement as Element;
    element.classList.add('highlight');

    HighlightDirective.elements.add(element);

    while (element.parentNode) {
      element = element.parentNode as Element;

      if (HighlightDirective.elements.has(element)) {
        element.classList.remove('highlight');
      }
    }
  }

  @HostListener('mouseleave')
  private onMouseLeave() {
    let element = this.elementRef.nativeElement as Element;
    element.classList.remove('highlight');

    HighlightDirective.elements.delete(element);

    while (element.parentNode) {
      element = element.parentNode as Element;

      if (HighlightDirective.elements.has(element)) {
        element.classList.add('highlight');
      }
    }
  }
}
