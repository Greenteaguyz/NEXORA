import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserRole } from '../../../core/models/user.model';

@Component({
  selector: 'app-role-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './role-badge.component.html',
  styleUrls: ['./role-badge.component.css']
})
export class RoleBadgeComponent {
  @Input({ required: true }) role: UserRole | string = 'buyer';
  @Input() size: 'sm' | 'md' = 'sm';

  get isCreator(): boolean {
    return this.role === 'creator';
  }

  get displayLabel(): string {
    return this.isCreator ? 'Creator' : 'Buyer';
  }
}
