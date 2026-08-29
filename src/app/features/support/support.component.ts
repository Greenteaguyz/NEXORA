import { Component, inject, OnInit, effect, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { GAMES_DATA } from '../../core/data/tokens';

export interface FaqItem {
  id: string;
  category: 'downloads' | 'creators' | 'privacy' | 'general';
  categoryLabel: string;
  question: string;
  answer: string;
}

export interface TicketCategoryOption {
  value: string;
  label: string;
  desc: string;
  icon: 'gamepad' | 'tools' | 'card' | 'lightbulb';
  color: 'green' | 'blue' | 'cyan' | 'amber';
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
  private route = inject(ActivatedRoute);

  // Form State
  name = '';
  email = '';
  ticketCategory = 'technical';
  subject = '';
  message = '';
  loading = false;
  ticketSubmitted = false;
  generatedTicketId = '';

  // Custom Category Dropdown State
  categoryDropdownOpen = false;

  categories: TicketCategoryOption[] = [
    {
      value: 'technical',
      label: 'Game Download & Offline Play Issue',
      desc: 'Installation errors, offline run issues, or compatibility',
      icon: 'gamepad',
      color: 'green'
    },
    {
      value: 'creator',
      label: 'Creator Studio & Publishing Question',
      desc: 'Game uploads, screenshots, pricing, or developer tools',
      icon: 'tools',
      color: 'blue'
    },
    {
      value: 'billing',
      label: 'Simulated Purchase & Library Question',
      desc: 'Sandbox transactions, library sync, or wishlist states',
      icon: 'card',
      color: 'cyan'
    },
    {
      value: 'feedback',
      label: 'Feedback & Feature Suggestion',
      desc: 'Community ideas, store suggestions, or platform bug reports',
      icon: 'lightbulb',
      color: 'amber'
    }
  ];

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
      categoryLabel: 'Downloads & Ownership',
      question: 'Can I play downloaded games offline?',
      answer: 'Yes. Every game downloaded from NEXORA comes as a standalone installer. There are no mandatory launchers or persistent online checks required to play.'
    },
    {
      id: 'faq-2',
      category: 'downloads',
      categoryLabel: 'Downloads & Ownership',
      question: 'How do paid and free game downloads work?',
      answer: 'Free games can be claimed directly to your Library. Paid games require checkout in the store, after which the installer is available to download anytime.'
    },
    {
      id: 'faq-3',
      category: 'downloads',
      categoryLabel: 'Downloads & Ownership',
      question: 'Can I back up my game installers and save files?',
      answer: 'Yes. Since all game packages are standalone files, you can back up installers or save directories to external drives or cloud storage.'
    },
    {
      id: 'faq-4',
      category: 'creators',
      categoryLabel: 'Creator Studio',
      question: 'How do creators publish, update, and manage games?',
      answer: 'Creators can use Creator Studio to publish game listings, upload screenshots, set prices, and update tags. You can enable Creator mode anytime in your Account Settings.'
    },
    {
      id: 'faq-5',
      category: 'creators',
      categoryLabel: 'Creator Studio',
      question: 'What is NEXORA’s revenue share for indie developers?',
      answer: 'NEXORA uses a 90/10 revenue split. Developers keep 90% of game sales, and 10% covers platform maintenance.'
    },
    {
      id: 'faq-6',
      category: 'privacy',
      categoryLabel: 'Privacy & Storage',
      question: 'Where is my library, wishlist, and profile data stored?',
      answer: 'In this prototype, your profile, library, wishlist, and game listings are stored locally in your browser via IndexedDB and LocalStorage.'
    },
    {
      id: 'faq-7',
      category: 'privacy',
      categoryLabel: 'Privacy & Storage',
      question: 'Are any real credit card charges made during testing?',
      answer: 'No. All transactions on this demo storefront are simulated with test balances and mock cards. No real money or payment gateways are billed.'
    },
    {
      id: 'faq-8',
      category: 'general',
      categoryLabel: 'Platform & Compatibility',
      question: 'Which operating systems are supported for games?',
      answer: 'Most catalog games support 64-bit Windows 10/11 (.exe) and Linux / SteamOS (.AppImage). Check the store page of each game for specific system requirements.'
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

    this.route.fragment.subscribe(fragment => {
      if (fragment === 'privacy') {
        setTimeout(() => {
          const el = document.getElementById('privacy');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 150);
      }
    });
  }

  get selectedCategoryItem(): TicketCategoryOption {
    return this.categories.find(c => c.value === this.ticketCategory) || this.categories[0];
  }

  toggleCategoryDropdown(): void {
    this.categoryDropdownOpen = !this.categoryDropdownOpen;
  }

  selectCategory(val: string): void {
    this.ticketCategory = val;
    this.categoryDropdownOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.custom-category-select')) {
      this.categoryDropdownOpen = false;
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
