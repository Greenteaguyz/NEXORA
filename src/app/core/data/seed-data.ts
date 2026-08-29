import { Game } from '../models/game.model';
import { User } from '../models/user.model';
import { LibraryEntry } from '../models/library-entry.model';
import { WishlistEntry } from '../models/wishlist-entry.model';
import { Order } from '../models/order.model';

// Real-Time Dynamic Timestamp Generator: generates timestamps relative to the current live date
const now = Date.now();
export const daysAgo = (days: number, hours = 0, minutes = 0): string => {
  return new Date(now - (days * 86400000) - (hours * 3600000) - (minutes * 60000)).toISOString();
};

export const SEED_USERS: User[] = [
  {
    id: 'usr_alice',
    email: 'alice@nexora.io',
    displayName: 'Alice Vance',
    roles: ['buyer', 'creator'],
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    bio: 'Cyberpunk indie developer & synthwave enthusiast. Creating fast-paced retro action games.',
    createdAt: daysAgo(180, 4)
  },
  {
    id: 'usr_bob',
    email: 'bob@nexora.io',
    displayName: 'Bob Mercer',
    roles: ['buyer'],
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    bio: 'Avid collector of standalone indie RPGs and rogue-lites.',
    createdAt: daysAgo(90, 8)
  },
  {
    id: 'usr_carol',
    email: 'carol@nexora.io',
    displayName: 'Carol PixelForge',
    roles: ['creator'],
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    bio: 'Pixel artist and mechanics designer. 8-bit aesthetic meets modern neon gameplay.',
    createdAt: daysAgo(120, 2)
  }
];

export const SEED_GAMES: Game[] = [
  {
    id: 'game_001',
    ownerId: 'usr_alice',
    title: 'Marvel Rivals',
    description: 'A team-based 6v6 superhero shooter. Build team compositions from the Marvel roster, combine abilities, and fight across destructible battlegrounds.',
    tags: ['Action', 'Hero Shooter', 'Third-Person', 'Sci-Fi', 'Tactics', 'PvP'],
    price: 4.99,
    coverImageUrl: 'assets/images/marvel-rivals-capsule.jpg',
    screenshotUrls: [
      'assets/images/marvel-rivals-wide-hero.jpg',
      'assets/images/marvel-rivals-bg.jpg',
      'assets/images/marvel-rivals-ss3.jpg',
      'assets/images/marvel-rivals-poster.jpg'
    ],
    samplePackageUrl: 'assets/sample-packages/marvel-rivals.zip',
    createdAt: daysAgo(14, 2),
    updatedAt: daysAgo(14, 2)
  },
  {
    id: 'game_002',
    ownerId: 'usr_alice',
    title: 'Bloodstrike',
    description: 'Tactical first-person battle royale with movement mechanics, cybernetic loadouts, and weapon customization. Compete in squad combat across compact urban drop zones.',
    tags: ['Action', 'FPS', 'Battle Royale', 'Cyberpunk', 'PvP'],
    price: 0,
    coverImageUrl: 'assets/images/bloodstrike-capsule.jpg',
    screenshotUrls: [
      'assets/images/bloodstrike-ss1.jpg',
      'assets/images/bloodstrike-ss2.jpg',
      'assets/images/bloodstrike-ss3.jpg',
      'assets/images/bloodstrike-ss4.jpg'
    ],
    samplePackageUrl: 'assets/sample-packages/bloodstrike.zip',
    createdAt: daysAgo(28, 4),
    updatedAt: daysAgo(28, 4)
  },
  {
    id: 'game_003',
    ownerId: 'usr_carol',
    title: 'Apex Legends',
    description: 'Squad-based battle royale featuring characters with tactical abilities and weapon customization. Coordinate team movement and survival strategies in the arena.',
    tags: ['Action', 'Hero Shooter', 'Battle Royale', 'Sci-Fi', 'Cyberpunk'],
    price: 0,
    coverImageUrl: 'assets/images/apex-legends-capsule.jpg',
    screenshotUrls: [
      'assets/images/apex-legends-ss1.jpg',
      'assets/images/apex-legends-ss2.jpg',
      'assets/images/apex-legends-ss3.jpg',
      'assets/images/apex-legends-ss4.jpg'
    ],
    samplePackageUrl: 'assets/sample-packages/apex-legends.zip',
    createdAt: daysAgo(42, 6),
    updatedAt: daysAgo(42, 6)
  },
  {
    id: 'game_004',
    ownerId: 'usr_carol',
    title: 'Forza Horizon 6',
    description: 'Open-world racing across dynamic weather environments and festival circuits. Collect, tune, and drive real-world performance cars across highway and off-road tracks.',
    tags: ['Racing', 'Open World', 'Driving', 'Simulation', 'Multiplayer'],
    price: 59.99,
    coverImageUrl: 'assets/images/forza-horizon-6-capsule.jpg',
    screenshotUrls: [
      'assets/images/forza-horizon-6-ss1.jpg',
      'assets/images/forza-horizon-6-ss2.jpg',
      'assets/images/forza-horizon-6-ss3.jpg',
      'assets/images/forza-horizon-6-ss4.jpg'
    ],
    samplePackageUrl: 'assets/sample-packages/forza-horizon-6.zip',
    createdAt: daysAgo(21, 1),
    updatedAt: daysAgo(21, 1)
  },
  {
    id: 'game_005',
    ownerId: 'usr_alice',
    title: "Assassin's Creed",
    description: 'Historical action-adventure focused on stealth, parkour navigation, and melee combat across detailed open-world cities.',
    tags: ['Action', 'Adventure', 'Stealth', 'Open World', 'Historical'],
    price: 39.99,
    coverImageUrl: 'assets/images/assassins-creed-capsule.jpg',
    screenshotUrls: [
      'assets/images/assassins-creed-ss1.jpg',
      'assets/images/assassins-creed-ss2.jpg',
      'assets/images/assassins-creed-ss3.jpg',
      'assets/images/assassins-creed-ss4.jpg'
    ],
    samplePackageUrl: 'assets/sample-packages/assassins-creed.zip',
    createdAt: daysAgo(35, 3),
    updatedAt: daysAgo(35, 3)
  },
  {
    id: 'game_006',
    ownerId: 'usr_carol',
    title: 'God of War',
    description: 'His vengeance against the Gods of Olympus far behind him, Kratos now lives in the realm of Norse deities and monsters. In this harsh, unforgiving world, he must fight to survive and teach his son Atreus to do the same.',
    tags: ['Action', 'Adventure', 'RPG', 'Singleplayer', 'Story Rich'],
    price: 49.99,
    coverImageUrl: 'assets/images/god-of-war-capsule.jpg',
    screenshotUrls: [
      'assets/images/god-of-war-ss1.jpg',
      'assets/images/god-of-war-ss2.jpg',
      'assets/images/god-of-war-ss3.jpg',
      'assets/images/god-of-war-ss4.jpg'
    ],
    samplePackageUrl: 'assets/sample-packages/god-of-war.zip',
    createdAt: daysAgo(18, 5),
    updatedAt: daysAgo(18, 5)
  },
  {
    id: 'game_007',
    ownerId: 'usr_alice',
    title: 'Call of Duty: Warzone',
    description: 'Large-scale combat arena featuring battle royale and extraction modes. Drop into the map, scavenge contracts and weapons, and fight to survive.',
    tags: ['Action', 'Shooter', 'FPS', 'Battle Royale', 'Multiplayer'],
    price: 0,
    coverImageUrl: 'assets/images/call-of-duty-warzone-capsule.jpg',
    screenshotUrls: [
      'assets/images/call-of-duty-warzone-ss1.jpg',
      'assets/images/call-of-duty-warzone-ss2.jpg',
      'assets/images/call-of-duty-warzone-ss3.jpg',
      'assets/images/call-of-duty-warzone-ss4.jpg'
    ],
    samplePackageUrl: 'assets/sample-packages/call-of-duty-warzone.zip',
    createdAt: daysAgo(10, 8),
    updatedAt: daysAgo(10, 8)
  },
  {
    id: 'game_008',
    ownerId: 'usr_carol',
    title: 'Wuthering Waves',
    description: 'Open-world action RPG featuring fast-paced dodge-and-parry combat, traversal mechanics, and character team progression across Solaris-3.',
    tags: ['RPG', 'Action', 'Open World', 'Anime', 'Adventure'],
    price: 0,
    coverImageUrl: 'assets/images/wuthering-waves-capsule.jpg',
    screenshotUrls: [
      'assets/images/wuthering-waves-ss1.jpg',
      'assets/images/wuthering-waves-ss2.jpg',
      'assets/images/wuthering-waves-ss3.jpg',
      'assets/images/wuthering-waves-ss4.jpg'
    ],
    samplePackageUrl: 'assets/sample-packages/wuthering-waves.zip',
    createdAt: daysAgo(7, 4),
    updatedAt: daysAgo(7, 4)
  }
];

export const SEED_LIBRARY_ENTRIES: LibraryEntry[] = [
  {
    id: 'lib_001',
    userId: 'usr_bob',
    gameId: 'game_002',
    acquiredAt: daysAgo(15, 3)
  },
  {
    id: 'lib_002',
    userId: 'usr_bob',
    gameId: 'game_003',
    acquiredAt: daysAgo(8, 5)
  },
  {
    id: 'lib_003',
    userId: 'usr_alice',
    gameId: 'game_001',
    acquiredAt: daysAgo(12, 1)
  }
];

export const SEED_WISHLIST_ENTRIES: WishlistEntry[] = [
  {
    id: 'wsh_001',
    userId: 'usr_alice',
    gameId: 'game_004',
    addedAt: daysAgo(5, 4)
  },
  {
    id: 'wsh_002',
    userId: 'usr_bob',
    gameId: 'game_001',
    addedAt: daysAgo(2, 2)
  }
];

export const SEED_ORDERS: Order[] = [
  {
    id: 'ord_1001',
    userId: 'usr_bob',
    gameId: 'game_001',
    price: 4.99,
    status: 'confirmed',
    createdAt: daysAgo(14, 1)
  }
];
