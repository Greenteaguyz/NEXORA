import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';
import { GAMES_DATA } from '../../core/data/tokens';

interface FaqItem {
  id: string;
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
  private authService = inject(AuthService);
  private gamesData = inject(GAMES_DATA);

  name = '';
  email = '';
  subject = '';
  message = '';
  loading = false;
  ticketSubmitted = false;
  generatedTicketId = '';

  openFaqId: string | null = 'faq-1';

  faqs: FaqItem[] = [
    {
      id: 'faq-1',
      question: 'Are all games on NEXORA really DRM-free?',
      answer: 'Yes! Every game downloaded from NEXORA is completely DRM-free. You receive the standalone install archive, and you own the file directly. No continuous DRM checks or mandatory third-party launchers are required.'
    },
    {
      id: 'faq-2',
      question: 'How do paid and free downloads work?',
      answer: 'Free games can be claimed directly with a single click. Paid games require a one-time simulated purchase confirmation, after which the game is permanently bound to your personal library with instant download access.'
    },
    {
      id: 'faq-3',
      question: 'How do creators publish and edit games?',
      answer: 'Creators can access the Creator Studio to publish new game listings, upload screenshot galleries, set prices, and update metadata. You can toggle your account to Creator mode anytime in Register or Account Settings.'
    },
    {
      id: 'faq-4',
      question: 'Where is my library and purchase data stored?',
      answer: 'For this platform preview, all data is safely persisted in your browser’s IndexedDB and LocalStorage. You can clear or reset to the default seed catalog at any time.'
    }
  ];

  ngOnInit(): void {
    const user = this.authService.currentUser();
    if (user) {
      this.name = user.displayName;
      this.email = user.email;
    }
  }

  toggleFaq(id: string): void {
    this.openFaqId = this.openFaqId === id ? null : id;
  }

  submitTicket(): void {
    if (!this.email || !this.subject || !this.message) return;

    this.loading = true;
    setTimeout(() => {
      this.loading = false;
      this.ticketSubmitted = true;
      this.generatedTicketId = 'NX-' + Math.floor(100000 + Math.random() * 900000);
      this.subject = '';
      this.message = '';
    }, 500);
  }

  resetDatabase(): void {
    if (confirm('Are you sure you want to reset all mock marketplace games back to the original default seed state?')) {
      this.gamesData.resetToDefaultSeed().subscribe(() => {
        alert('NEXORA mock seed data restored successfully!');
      });
    }
  }
}
