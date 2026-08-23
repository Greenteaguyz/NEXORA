import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './layout/header/header.component';
import { FooterComponent } from './layout/footer/footer.component';
import { ToastComponent } from './shared/ui/toast/toast.component';
import { CommandPaletteComponent } from './shared/ui/command-palette/command-palette.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent, ToastComponent, CommandPaletteComponent],
  template: `
    <a href="#main-content" class="skip-to-content">Skip to main content</a>
    <app-header></app-header>
    <main id="main-content" class="main-content" tabindex="-1">
      <router-outlet></router-outlet>
    </main>
    <app-footer></app-footer>
    <app-toast></app-toast>
    <app-command-palette></app-command-palette>
  `
})
export class AppComponent {}
