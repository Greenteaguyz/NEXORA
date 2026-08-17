import { Game } from '../models/game.model';
import { User } from '../models/user.model';
import { LibraryEntry } from '../models/library-entry.model';
import { WishlistEntry } from '../models/wishlist-entry.model';
import { Order } from '../models/order.model';

export const SEED_USERS: User[] = [
  {
    id: 'usr_alice',
    email: 'alice@nexora.io',
    displayName: 'Alice Vance',
    roles: ['buyer', 'creator'],
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    bio: 'Cyberpunk indie developer & synthwave enthusiast. Creating fast-paced retro action games.',
    createdAt: '2024-01-15T08:00:00.000Z'
  },
  {
    id: 'usr_bob',
    email: 'bob@nexora.io',
    displayName: 'Bob Mercer',
    roles: ['buyer'],
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    bio: 'Avid collector of DRM-free indie RPGs and rogue-lites.',
    createdAt: '2024-03-20T11:30:00.000Z'
  },
  {
    id: 'usr_carol',
    email: 'carol@nexora.io',
    displayName: 'Carol PixelForge',
    roles: ['creator'],
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    bio: 'Pixel artist and mechanics designer. 8-bit aesthetic meets modern neon gameplay.',
    createdAt: '2024-02-10T14:15:00.000Z'
  }
];

export const SEED_GAMES: Game[] = [
  {
    id: 'game_001',
    ownerId: 'usr_alice',
    title: 'Neon Drift: 2088',
    description: 'High-speed synthwave hovercraft racing across neon-lit dystopian megacities. Customize your rig, master gravity-defying tracks, and outrun the grid enforcers.',
    tags: ['Cyberpunk', 'Racing', 'Arcade', 'Synthwave'],
    price: 4.99,
    coverImageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80',
    screenshotUrls: [
      'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200&auto=format&fit=crop&q=80'
    ],
    samplePackageUrl: 'assets/sample-packages/neon-drift-2088.zip',
    createdAt: '2024-04-01T10:00:00.000Z',
    updatedAt: '2024-04-01T10:00:00.000Z'
  },
  {
    id: 'game_002',
    ownerId: 'usr_alice',
    title: 'Cyber Heist: Protocol Zero',
    description: 'Turn-based tactical cyber-espionage infiltration sim. Hack defense nodes, disable security drones, and exfiltrate classified megacorp data vaults.',
    tags: ['Strategy', 'Cyberpunk', 'Tactics', 'Hacking'],
    price: 0,
    coverImageUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80',
    screenshotUrls: [
      'https://images.unsplash.com/photo-1563089145-599997674d42?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200&auto=format&fit=crop&q=80'
    ],
    samplePackageUrl: 'assets/sample-packages/cyber-heist.zip',
    createdAt: '2024-04-10T12:00:00.000Z',
    updatedAt: '2024-04-10T12:00:00.000Z'
  },
  {
    id: 'game_003',
    ownerId: 'usr_carol',
    title: 'Pixel Odyssey',
    description: 'A charming 16-bit retro metroidvania exploring forgotten ancient ruins buried deep underneath the digital frontier.',
    tags: ['Platformer', 'Pixel Art', 'Retro', 'Adventure'],
    price: 0,
    coverImageUrl: 'https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?w=800&auto=format&fit=crop&q=80',
    screenshotUrls: [
      'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200&auto=format&fit=crop&q=80'
    ],
    samplePackageUrl: 'assets/sample-packages/pixel-odyssey.zip',
    createdAt: '2024-05-01T09:30:00.000Z',
    updatedAt: '2024-05-01T09:30:00.000Z'
  },
  {
    id: 'game_004',
    ownerId: 'usr_carol',
    title: 'Shadow Circuit',
    description: 'An intense rogue-like bullet-hell set inside a corrupted AI neural core. Dodge laser waves, collect memory shards, and reboot the system.',
    tags: ['Rogue-like', 'Action', 'Sci-Fi', 'Bullet Hell'],
    price: 3.49,
    coverImageUrl: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800&auto=format&fit=crop&q=80',
    screenshotUrls: [
      'https://images.unsplash.com/photo-1563089145-599997674d42?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&auto=format&fit=crop&q=80'
    ],
    samplePackageUrl: 'assets/sample-packages/shadow-circuit.zip',
    createdAt: '2024-05-15T15:20:00.000Z',
    updatedAt: '2024-05-15T15:20:00.000Z'
  },
  {
    id: 'game_005',
    ownerId: 'usr_alice',
    title: 'Echoes of the Void',
    description: 'Deep space psychological horror and puzzle exploration aboard an abandoned research satellite orbiting a dying singularity.',
    tags: ['Horror', 'Sci-Fi', 'Puzzle', 'Atmospheric'],
    price: 6.99,
    coverImageUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=800&auto=format&fit=crop&q=80',
    screenshotUrls: [
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80'
    ],
    samplePackageUrl: 'assets/sample-packages/echoes-of-the-void.zip',
    createdAt: '2024-06-01T18:00:00.000Z',
    updatedAt: '2024-06-01T18:00:00.000Z'
  },
  {
    id: 'game_006',
    ownerId: 'usr_carol',
    title: 'Grid Runner: Overdrive',
    description: 'Endless rhythm-based runner with pulsating synthwave tracks and dynamic speed hurdles. Test your reflexes on the global leaderboard.',
    tags: ['Arcade', 'Rhythm', 'Cyberpunk', 'Music'],
    price: 0,
    coverImageUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&auto=format&fit=crop&q=80',
    screenshotUrls: [
      'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&auto=format&fit=crop&q=80'
    ],
    samplePackageUrl: 'assets/sample-packages/grid-runner.zip',
    createdAt: '2024-06-12T14:40:00.000Z',
    updatedAt: '2024-06-12T14:40:00.000Z'
  },
  {
    id: 'game_007',
    ownerId: 'usr_alice',
    title: 'Quantum Shift',
    description: 'Mind-bending first-person puzzle game where you manipulate quantum probability fields to traverse impossible spatial geometries.',
    tags: ['Puzzle', 'Sci-Fi', 'First-Person', 'Indie'],
    price: 0,
    coverImageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
    screenshotUrls: [
      'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&auto=format&fit=crop&q=80'
    ],
    samplePackageUrl: 'assets/sample-packages/quantum-shift.zip',
    createdAt: '2024-07-01T10:15:00.000Z',
    updatedAt: '2024-07-01T10:15:00.000Z'
  },
  {
    id: 'game_008',
    ownerId: 'usr_carol',
    title: 'Vaporwave Dungeon',
    description: 'Isometric hack-and-slash crawler drenched in pastel vaporwave aesthetics and lo-fi beats. Upgrade weapons and defeat surreal glitch bosses.',
    tags: ['RPG', 'Action', 'Hack and Slash', 'Retro'],
    price: 2.99,
    coverImageUrl: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=800&auto=format&fit=crop&q=80',
    screenshotUrls: [
      'https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?w=800&auto=format&fit=crop&q=80'
    ],
    samplePackageUrl: 'assets/sample-packages/vaporwave-dungeon.zip',
    createdAt: '2024-07-15T16:00:00.000Z',
    updatedAt: '2024-07-15T16:00:00.000Z'
  },
  {
    id: 'game_009',
    ownerId: 'usr_carol',
    title: 'Cyber Tavern Simulator',
    description: 'Manage an underground cyberpunk bar in Neo-Kyoto. Mix synthetic cocktails, listen to rogue android stories, and keep the peace.',
    tags: ['Simulation', 'Cyberpunk', 'Story Rich', 'Casual'],
    price: 0,
    coverImageUrl: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=800&auto=format&fit=crop&q=80',
    screenshotUrls: [
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80'
    ],
    samplePackageUrl: 'assets/sample-packages/cyber-tavern.zip',
    createdAt: '2024-08-01T11:00:00.000Z',
    updatedAt: '2024-08-01T11:00:00.000Z'
  },
  {
    id: 'game_010',
    ownerId: 'usr_alice',
    title: 'Byte Mech: Arena',
    description: 'Fast-paced multiplayer arena mech brawler. Customize weapons, armor plating, and thrusters for intense competitive combat.',
    tags: ['Action', 'Sci-Fi', 'Mechs', 'Arcade'],
    price: 0,
    coverImageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80',
    screenshotUrls: [
      'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80'
    ],
    samplePackageUrl: 'assets/sample-packages/byte-mech.zip',
    createdAt: '2024-08-10T13:30:00.000Z',
    updatedAt: '2024-08-10T13:30:00.000Z'
  }
];

export const SEED_LIBRARY_ENTRIES: LibraryEntry[] = [
  {
    id: 'lib_001',
    userId: 'usr_bob',
    gameId: 'game_002',
    acquiredAt: '2024-05-01T10:00:00.000Z'
  },
  {
    id: 'lib_002',
    userId: 'usr_bob',
    gameId: 'game_003',
    acquiredAt: '2024-05-05T14:30:00.000Z'
  },
  {
    id: 'lib_003',
    userId: 'usr_alice',
    gameId: 'game_001',
    acquiredAt: '2024-04-02T09:00:00.000Z'
  }
];

export const SEED_WISHLIST_ENTRIES: WishlistEntry[] = [
  {
    id: 'wsh_001',
    userId: 'usr_alice',
    gameId: 'game_004',
    addedAt: '2024-06-01T12:00:00.000Z'
  },
  {
    id: 'wsh_002',
    userId: 'usr_bob',
    gameId: 'game_001',
    addedAt: '2024-06-10T15:00:00.000Z'
  }
];

export const SEED_ORDERS: Order[] = [
  {
    id: 'ord_1001',
    userId: 'usr_bob',
    gameId: 'game_001',
    price: 4.99,
    status: 'confirmed',
    createdAt: '2024-05-10T16:20:00.000Z'
  }
];
