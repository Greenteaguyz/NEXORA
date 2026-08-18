import { Component, inject, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';
import { GAMES_DATA } from '../../core/data/tokens';

export interface FaqItem {
  id: string;
  category: 'downloads' | 'creators' | 'privacy' | 'general';
  categoryLabel: string;
  question: string;
  answer: string;
}

@Component({
  selector: 'app-support',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './support.component.html',
  styleUrls: ['./support.component.css']
})
export class SupportComponent implements OnInit {
  authService = inject(AuthService);
  private gamesData = inject(GAMES_DATA);

  // Form State
  name = '';
  email = '';
  ticketCategory = 'technical';
  subject = '';
  message = '';
  loading = false;
  ticketSubmitted = false;
  generatedTicketId = '';

  // Interactive FAQ State
  openFaqId: string | null = 'faq-1';
  searchQuery = '';
  selectedCategory = 'all';

  // Seed Reset Notification State
  resetNotification: string | null = null;

  faqs: FaqItem[] = [
    {
      id: 'faq-1',
      category: 'downloads',
      categoryLabel: 'Downloads & DRM',
      question: 'Are all games on NEXORA really 100% DRM-free?',
      answer: 'Yes! Every game downloaded from NEXORA is completely DRM-free. You receive the standalone install archive, and you own the file directly. No continuous DRM checks, no mandatory third-party background launchers, and no telemetry are required.'
    },
    {
      id: 'faq-2',
      category: 'downloads',
      categoryLabel: 'Downloads & DRM',
      question: 'How do paid and free game downloads work?',
      answer: 'Free games can be claimed and downloaded instantly with a single click. Paid games require a one-time simulated purchase confirmation in this prototype, after which the package is permanently bound to your personal Library with direct offline download access.'
    },
    {
      id: 'faq-3',
      category: 'downloads',
      categoryLabel: 'Downloads & DRM',
      question: 'Can I back up my game installers and save files?',
      answer: 'Absolutely. Because all packages are standalone, you can back up zip installers or save directories to external hard drives, USB drives, or personal cloud storage without losing access.'
    },
    {
      id: 'faq-4',
      category: 'creators',
      categoryLabel: 'Creator Studio',
      question: 'How do creators publish, update, and manage games?',
      answer: 'Verified creators can access the Creator Studio to publish new game titles, upload high-resolution screenshot galleries, configure pricing, manage tags, and deploy updates. You can toggle your role to Creator mode anytime via registration or account switcher.'
    },
    {
      id: 'faq-5',
      category: 'creators',
      categoryLabel: 'Creator Studio',
      question: 'What is NEXORA’s revenue share for indie developers?',
      answer: 'NEXORA operates on an industry-leading 90/10 revenue split. Developers keep 90% of all gross sales directly, with no hidden hosting fees or distribution surcharges.'
    },
    {
      id: 'faq-6',
      category: 'privacy',
      categoryLabel: 'Privacy & Storage',
      question: 'Where is my library, wishlist, and profile data stored?',
      answer: 'For this platform preview, all user sessions, library states, wishlists, and created game listings are safely persisted locally in your browser using IndexedDB & LocalStorage.'
    },
    {
      id: 'faq-7',
      category: 'privacy',
      categoryLabel: 'Privacy & Storage',
      question: 'Are any real credit card charges made during testing?',
      answer: 'No. All monetary transactions across the NEXORA marketplace prototype are 100% simulated sandbox mock purchases. No real payment gateways or credit cards are ever billed.'
    },
    {
      id: 'faq-8',
      category: 'general',
      categoryLabel: 'Platform & Compatibility',
      question: 'Which operating systems are supported for games?',
      answer: 'NEXORA games feature dedicated standalone binaries for 64-bit Windows 10/11 and native Linux (x86_64 distributions such as Ubuntu, Debian, Arch, and Fedora).'
    }
  ];

  constructor() {
    effect(() => {
      const user = this.authService.currentUser();
      if (user) {
        this.name = user.displayName;
        this.email = user.email;
      } else {
        this.name = '';
        this.email = '';
      }
    });
  }

  ngOnInit(): void {
    const user = this.authService.currentUser();
    if (user) {
      this.name = user.displayName;
      this.email = user.email;
    }
  }

  get filteredFaqs(): FaqItem[] {
    const q = this.searchQuery.trim().toLowerCase();
    return this.faqs.filter(faq => {
      const matchesCategory = this.selectedCategory === 'all' || faq.category === this.selectedCategory;
      const matchesSearch = !q || 
        faq.question.toLowerCase().includes(q) || 
        faq.answer.toLowerCase().includes(q) ||
        faq.categoryLabel.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }

  setCategory(cat: string): void {
    this.selectedCategory = cat;
  }

  clearSearch(): void {
    this.searchQuery = '';
  }

  toggleFaq(id: string): void {
    this.openFaqId = this.openFaqId === id ? null : id;
  }

  quickFilter(category: 'downloads' | 'creators' | 'privacy'): void {
    this.selectedCategory = category;
    this.searchQuery = '';
    const firstMatch = this.faqs.find(f => f.category === category);
    if (firstMatch) {
      this.openFaqId = firstMatch.id;
    }
    const faqElement = document.getElementById('faq-section');
    if (faqElement) {
      faqElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  submitTicket(): void {
    if (!this.email || !this.subject || !this.message) return;

    this.loading = true;
    setTimeout(() => {
      this.loading = false;
      this.ticketSubmitted = true;
      this.generatedTicketId = 'NX-' + Math.floor(100000 + Math.random() * 900000);
    }, 450);
  }

  resetTicketForm(): void {
    this.ticketSubmitted = false;
    this.subject = '';
    this.message = '';
    this.ticketCategory = 'technical';
    const user = this.authService.currentUser();
    if (user) {
      this.name = user.displayName;
      this.email = user.email;
    }
  }

  resetDatabase(): void {
    if (confirm('Are you sure you want to reset all mock marketplace games back to the original default seed state?')) {
      this.gamesData.resetToDefaultSeed().subscribe(() => {
        this.resetNotification = 'Marketplace seed database successfully restored to default!';
        setTimeout(() => {
          this.resetNotification = null;
        }, 4000);
      });
    }
  }
}
