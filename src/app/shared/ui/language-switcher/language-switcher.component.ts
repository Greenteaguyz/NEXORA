import { Component, inject, signal, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService, Language } from '../../../core/services/translation.service';

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './language-switcher.component.html',
  styleUrls: ['./language-switcher.component.css']
})
export class LanguageSwitcherComponent {
  translationService = inject(TranslationService);
  private elementRef = inject(ElementRef);
  
  isOpen = signal(false);

  toggle(event: MouseEvent) {
    event.stopPropagation();
    this.isOpen.set(!this.isOpen());
  }

  setLanguage(lang: Language) {
    this.translationService.setLanguage(lang);
    this.isOpen.set(false);
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent) {
    if (this.isOpen() && !this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.isOpen()) {
      this.isOpen.set(false);
    }
  }
}
