import { Component, Input, Output, EventEmitter, HostListener, OnInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Game } from '../../../core/models/game.model';

@Component({
  selector: 'app-purchase-confirm-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './purchase-confirm-modal.component.html',
  styleUrls: ['./purchase-confirm-modal.component.css']
})
export class PurchaseConfirmModalComponent implements OnInit {
  @Input({ required: true }) game!: Game;
  @Input() processing = false;

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  @ViewChild('confirmBtn') confirmBtn?: ElementRef<HTMLButtonElement>;

  ngOnInit(): void {
    // Prevent background scrolling while modal is open
    document.body.style.overflow = 'hidden';
    setTimeout(() => {
      this.confirmBtn?.nativeElement.focus();
    }, 50);
  }

  ngOnDestroy(): void {
    document.body.style.overflow = '';
  }

  onConfirm(): void {
    if (this.processing) return;
    this.confirm.emit();
  }

  onCancel(): void {
    if (this.processing) return;
    this.cancel.emit();
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.onCancel();
    }
  }
}
