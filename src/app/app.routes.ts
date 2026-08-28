import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { roleGuard } from './core/auth/role.guard';
import { ownershipGuard } from './core/auth/ownership.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'catalog'
  },
  {
    path: 'catalog',
    loadComponent: () => import('./features/game-catalog/game-catalog.component').then(m => m.GameCatalogComponent),
    title: 'Discover Games — NEXORA'
  },
  {
    path: 'genres',
    loadComponent: () => import('./features/genres/genres.component').then(m => m.GenresComponent),
    title: 'Genres & Categories — NEXORA'
  },
  {
    path: 'games/:id',
    loadComponent: () => import('./features/game-detail/game-detail.component').then(m => m.GameDetailComponent),
    title: 'Game Details — NEXORA'
  },
  {
    path: 'creators/:id',
    loadComponent: () => import('./features/creator-profile/creator-profile.component').then(m => m.CreatorProfileComponent),
    title: 'Creator Profile — NEXORA'
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent),
    title: 'Sign In — NEXORA'
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent),
    title: 'Create Account — NEXORA'
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./features/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent),
    title: 'Reset Password — NEXORA'
  },
  {
    path: 'library',
    canActivate: [authGuard],
    loadComponent: () => import('./features/library/library.component').then(m => m.LibraryComponent),
    title: 'My Game Library — NEXORA'
  },
  {
    path: 'wishlist',
    canActivate: [authGuard],
    loadComponent: () => import('./features/wishlist/wishlist.component').then(m => m.WishlistComponent),
    title: 'My Wishlist — NEXORA'
  },
  {
    path: 'orders',
    canActivate: [authGuard],
    loadComponent: () => import('./features/orders/orders.component').then(m => m.OrdersComponent),
    title: 'Order History — NEXORA'
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent),
    title: 'Account Settings — NEXORA'
  },
  {
    path: 'account/payment',
    canActivate: [authGuard],
    loadComponent: () => import('./features/account-payment/account-payment.component').then(m => m.AccountPaymentComponent),
    title: 'Payment & Wallet — NEXORA'
  },
  {
    path: 'studio',
    canActivate: [authGuard, roleGuard('creator')],
    loadComponent: () => import('./features/creator-studio/creator-studio.component').then(m => m.CreatorStudioComponent),
    title: 'Creator Studio — NEXORA'
  },
  {
    path: 'studio/games/new',
    canActivate: [authGuard, roleGuard('creator')],
    loadComponent: () => import('./features/creator-studio/game-form/game-form.component').then(m => m.GameFormComponent),
    title: 'Publish New Game — NEXORA'
  },
  {
    path: 'studio/games/:id/edit',
    canActivate: [authGuard, roleGuard('creator'), ownershipGuard],
    loadComponent: () => import('./features/creator-studio/game-form/game-form.component').then(m => m.GameFormComponent),
    title: 'Edit Game Listing — NEXORA'
  },
  {
    path: 'support',
    loadComponent: () => import('./features/support/support.component').then(m => m.SupportComponent),
    title: 'Support & FAQ — NEXORA'
  },
  {
    path: 'not-found',
    loadComponent: () => import('./features/not-found/not-found.component').then(m => m.NotFoundComponent),
    title: 'Page Not Found — NEXORA'
  },
  {
    path: '**',
    redirectTo: 'not-found'
  }
];
