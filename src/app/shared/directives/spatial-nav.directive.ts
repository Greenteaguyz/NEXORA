import { Directive, ElementRef, HostListener, inject } from '@angular/core';

@Directive({
  selector: '[appSpatialNav]',
  standalone: true
})
export class SpatialNavDirective {
  private el = inject(ElementRef);

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    const key = event.key;
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(key)) {
      return;
    }

    // AC-NAV-002: Ignore if typing inside text input, textarea, or select
    const target = event.target as HTMLElement;
    if (
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLSelectElement ||
      (target && target.isContentEditable)
    ) {
      return;
    }

    const container = this.el.nativeElement as HTMLElement;
    if (!container || !container.querySelectorAll) return;

    const allNodes = Array.from(
      container.querySelectorAll(
        '.game-card, .library-card, .wishlist-card, .game-card-link, a[role="listitem"], .stage-thumb-card'
      )
    ) as HTMLElement[];

    const focusableCards = allNodes.filter(c => c && c.offsetParent !== null);

    if (focusableCards.length === 0) return;

    const activeEl = document.activeElement as HTMLElement;
    const currentIndex = focusableCards.findIndex(
      c => c === activeEl || c.contains(activeEl)
    );

    if (currentIndex === -1) {
      if (['ArrowDown', 'ArrowRight'].includes(key)) {
        focusableCards[0].focus();
        event.preventDefault();
      }
      return;
    }

    const currentCard = focusableCards[currentIndex];
    const currentRect = currentCard.getBoundingClientRect();

    let targetIndex = -1;

    if (key === 'ArrowRight') {
      targetIndex = Math.min(currentIndex + 1, focusableCards.length - 1);
    } else if (key === 'ArrowLeft') {
      targetIndex = Math.max(currentIndex - 1, 0);
    } else if (key === 'ArrowDown') {
      // Find card in next row with closest horizontal center
      let closestDist = Infinity;
      const currentCenterX = currentRect.left + currentRect.width / 2;

      for (let i = currentIndex + 1; i < focusableCards.length; i++) {
        const nextRect = focusableCards[i].getBoundingClientRect();
        if (nextRect.top > currentRect.bottom - 5) {
          const nextCenterX = nextRect.left + nextRect.width / 2;
          const dist = Math.abs(nextCenterX - currentCenterX);
          if (dist < closestDist) {
            closestDist = dist;
            targetIndex = i;
          }
        }
      }
    } else if (key === 'ArrowUp') {
      // Find card in previous row with closest horizontal center
      let closestDist = Infinity;
      const currentCenterX = currentRect.left + currentRect.width / 2;

      for (let i = currentIndex - 1; i >= 0; i--) {
        const prevRect = focusableCards[i].getBoundingClientRect();
        if (prevRect.bottom < currentRect.top + 5) {
          const prevCenterX = prevRect.left + prevRect.width / 2;
          const dist = Math.abs(prevCenterX - currentCenterX);
          if (dist < closestDist) {
            closestDist = dist;
            targetIndex = i;
          }
        }
      }
    }

    if (targetIndex >= 0 && targetIndex !== currentIndex) {
      const targetCard = focusableCards[targetIndex];
      const focusTarget = targetCard.querySelector<HTMLElement>('a, button') || targetCard;
      focusTarget.focus();
      targetCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      event.preventDefault();
    }
  }
}
