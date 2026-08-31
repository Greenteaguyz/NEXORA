import { GiftCard, PaymentMethod, Wallet, WalletTransaction } from '../../models/payment.model';
import { daysAgo } from '../seed-data';

export const SEED_PAYMENT_METHODS: PaymentMethod[] = [
  {
    type: 'card',
    id: 'pm_alice_visa',
    userId: 'usr_alice',
    brand: 'visa',
    holder: 'Alice Vance',
    last4: '4242',
    expiry: '09/28',
    isDefault: true,
    createdAt: daysAgo(60, 3)
  },
  {
    type: 'card',
    id: 'pm_bob_visa',
    userId: 'usr_bob',
    brand: 'visa',
    holder: 'Bob Mercer',
    last4: '1881',
    expiry: '04/27',
    isDefault: true,
    createdAt: daysAgo(45, 6)
  },
  {
    type: 'khqr',
    id: 'pm_bob_khqr',
    userId: 'usr_alice',
    bank: 'ABA',
    handle: 'alicevance@aba',
    isDefault: false,
    createdAt: daysAgo(10, 2)
  }
];


export const SEED_WALLETS: Wallet[] = [
  { userId: 'usr_alice', balance: 24.5 },
  { userId: 'usr_bob', balance: 12.75 },
  { userId: 'usr_carol', balance: 0 }
];

export const SEED_WALLET_TRANSACTIONS: WalletTransaction[] = [
  {
    id: 'txn_seed_alice_topup',
    userId: 'usr_alice',
    amount: 20,
    source: 'top_up',
    label: 'Wallet top-up · Visa •••• 4242',
    createdAt: daysAgo(3, 5)
  },
  {
    id: 'txn_seed_alice_gift',
    userId: 'usr_alice',
    amount: 10,
    source: 'gift_card',
    label: 'Gift card NEXO-KH2M-9Q4P redeemed',
    createdAt: daysAgo(8, 1)
  },
  {
    id: 'txn_seed_bob_topup',
    userId: 'usr_bob',
    amount: 15,
    source: 'top_up',
    label: 'Wallet top-up · Visa •••• 1881',
    createdAt: daysAgo(6, 4)
  }
];

export const SEED_GIFT_CARDS: GiftCard[] = [
  { code: 'NEXO-WELCOME-2026', amount: 5, redeemedBy: null, redeemedAt: null },
  { code: 'NEXO-SUMMER-25USD', amount: 25, redeemedBy: null, redeemedAt: null },
  { code: 'NEXO-PCHUM-10USD', amount: 10, redeemedBy: null, redeemedAt: null }
];
