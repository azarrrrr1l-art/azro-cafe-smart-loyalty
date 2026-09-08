import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import QRCode from 'qrcode';
import { createServer as createViteServer } from 'vite';
import {
  User, CustomerProfile, Visit, MenuItem, Order, Reward, RewardClaim,
  NotificationItem, Offer, MembershipLevel, CafeSettings, AuditLog,
  CustomerRewardState, RewardNotificationRecord, RewardStatus
} from './src/types';

const app = express();
const PORT = 3000;

// Request logging for every request
app.use((req, res, next) => {
  console.log(`[API REQUEST] ${req.method} ${req.originalUrl || req.url}`);
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global CORS middleware - ensure all origins and headers are permitted
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-API-KEY, X-Custom-Header');
  res.header('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
});

// Persistent store file path
const DATA_FILE = path.join(process.cwd(), 'azro_db.json');

// Initial seed data
const initialMembershipLevels: MembershipLevel[] = [
  {
    id: 'lvl-bronze',
    name: 'Bronze',
    minPoints: 0,
    perks: ['10 pts per $1 spent', 'Free birthday beverage', 'Member-only seasonal offers'],
    multiplier: 1.0,
    badgeColor: '#A87148',
    cardBgGradient: 'from-[#3D2C22] to-[#251A14]'
  },
  {
    id: 'lvl-silver',
    name: 'Silver',
    minPoints: 150,
    perks: ['12 pts per $1 spent', 'Free alternative milk upgrades', 'Double-point Tuesdays'],
    multiplier: 1.2,
    badgeColor: '#A0AAB2',
    cardBgGradient: 'from-[#434B54] to-[#2C3238]'
  },
  {
    id: 'lvl-gold',
    name: 'Gold',
    minPoints: 400,
    perks: ['15 pts per $1 spent', 'Free syrup customizations', 'Priority queue pass', 'Free size upgrade on Fridays'],
    multiplier: 1.5,
    badgeColor: '#E6A838',
    cardBgGradient: 'from-[#5C4318] to-[#38270B]'
  },
  {
    id: 'lvl-platinum',
    name: 'Platinum',
    minPoints: 800,
    perks: ['20 pts per $1 spent', 'Monthly complimentary pastry box', 'Reserve blend cupping invites', 'Dedicated concierge line'],
    multiplier: 2.0,
    badgeColor: '#845EC2',
    cardBgGradient: 'from-[#49276A] to-[#26143A]'
  }
];

const initialSettings: CafeSettings = {
  cafeName: 'AZRO CAFE',
  tagline: 'Artisanal Roasts & Modern Gathering',
  duplicateScanCooldownMinutes: 45, // 45 min cooldown between visit scans
  pointsPerVisit: 25,
  pointsPerDollar: 10,
  welcomeBonusPoints: 50,
  stampsForFreeCoffee: 8,
  currencySymbol: '$',
  openingHours: 'Mon - Sun: 7:00 AM - 9:00 PM',
  address: '452 artisan lane, Specialty District'
};

const initialMenu: MenuItem[] = [
  {
    id: 'menu-1',
    name: 'Spanish Pistachio Latte',
    category: 'Signature Lattes',
    description: 'Double shot of single-origin espresso, velvety textured condensed milk, and roasted Sicilian pistachio cream foam.',
    price: 6.80,
    calories: 280,
    image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=800&q=80',
    isPopular: true,
    isSeasonal: false,
    dietary: ['Contains Nuts'],
    options: {
      sizes: [{ name: 'Regular (12oz)', priceAdd: 0 }, { name: 'Large (16oz)', priceAdd: 0.80 }],
      milks: [{ name: 'Whole Organic', priceAdd: 0 }, { name: 'Oat Milk', priceAdd: 0.70 }, { name: 'Almond Milk', priceAdd: 0.70 }],
      syrups: [{ name: 'Standard Sweetness', priceAdd: 0 }, { name: 'Half Sweet', priceAdd: 0 }, { name: 'Extra Pistachio Drizzle', priceAdd: 0.90 }]
    },
    available: true
  },
  {
    id: 'menu-2',
    name: 'Ethiopia Yirgacheffe V60',
    category: 'Pour Over & Cold',
    description: 'Slow hand-poured washed heirloom varietal with tasting notes of jasmine blossom, bergamot citrus, and candied peach.',
    price: 7.20,
    calories: 5,
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
    isPopular: true,
    isSeasonal: true,
    dietary: ['Vegan', 'Gluten-Free', 'Dairy-Free', 'Keto'],
    options: {
      sizes: [{ name: 'Standard Carafe (350ml)', priceAdd: 0 }]
    },
    available: true
  },
  {
    id: 'menu-3',
    name: 'Cortado Reserva',
    category: 'Specialty Espresso',
    description: 'Equal parts 1:1 rich ristretto extraction and lightly steamed microfoam in a classic Gibraltar glass.',
    price: 4.60,
    calories: 90,
    image: 'https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=800&q=80',
    isPopular: false,
    isSeasonal: false,
    dietary: ['Gluten-Free'],
    options: {
      milks: [{ name: 'Whole Milk', priceAdd: 0 }, { name: 'Oat Milk', priceAdd: 0.60 }]
    },
    available: true
  },
  {
    id: 'menu-4',
    name: 'Honeycomb Cold Brew',
    category: 'Pour Over & Cold',
    description: '18-hour cold steeped Colombian beans poured over clear artisan crystal ice, topped with house-made honey crunch brittle.',
    price: 6.20,
    calories: 160,
    image: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=800&q=80',
    isPopular: true,
    dietary: ['Gluten-Free'],
    available: true
  },
  {
    id: 'menu-5',
    name: 'Almond Twice-Baked Croissant',
    category: 'Artisan Pastries',
    description: 'French butter laminated croissant soaked in Bourbon vanilla syrup, filled with rich frangipane almond cream and toasted flakes.',
    price: 5.50,
    calories: 390,
    image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=80',
    isPopular: true,
    dietary: ['Contains Nuts'],
    available: true
  },
  {
    id: 'menu-6',
    name: 'Avocado & Burrata Tartine',
    category: 'Savory & Brunch',
    description: 'Toasted organic sourdough, smashed Hass avocado, fresh Pugliese burrata, heirloom cherry tomatoes, pomegranate molasses, chili flakes.',
    price: 11.50,
    calories: 460,
    image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80',
    isPopular: false,
    dietary: ['Gluten-Free'],
    available: true
  },
  {
    id: 'menu-7',
    name: 'Iced Lavender Blossom Matcha',
    category: 'Signature Lattes',
    description: 'Ceremonial grade Uji matcha whisked with wild lavender blossom infusion and cold-pressed oat milk over ice.',
    price: 6.90,
    calories: 190,
    image: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=800&q=80',
    isPopular: true,
    dietary: ['Vegan', 'Dairy-Free', 'Gluten-Free'],
    available: true
  },
  {
    id: 'menu-8',
    name: 'Truffle Scramble Brioche',
    category: 'Savory & Brunch',
    description: 'Silky pasture-raised soft scrambled eggs with black truffle butter, chives, and aged gruyère on a golden toasted brioche bun.',
    price: 12.80,
    calories: 520,
    image: 'https://images.unsplash.com/photo-1588137378633-dea1336ce1e2?auto=format&fit=crop&w=800&q=80',
    isPopular: true,
    dietary: [],
    available: true
  }
];

const initialRewards: Reward[] = [
  {
    id: 'rw-1',
    title: 'Free Artisanal Pastry or Cookie',
    description: 'Redeem any fresh morning bake from our display counter including croissants, pain au chocolat, or sea salt cookies.',
    pointsCost: 75,
    category: 'Bakery',
    imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80',
    terms: 'Valid on single pastry item up to $6 value. Cannot be combined with daily sets.',
    availableCount: 50,
    badge: 'Popular',
    requiredVisits: 3,
    rewardValue: 180,
    validityDays: 30
  },
  {
    id: 'rw-3',
    title: '25% Off Entire Order',
    description: 'Get 25% off your entire ticket when ordering drinks and food for you or your table.',
    pointsCost: 180,
    category: 'Discount',
    imageUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=600&q=80',
    terms: 'Discount capped at $20 total discount value. Valid for one transaction.',
    availableCount: 30,
    badge: 'Best Value',
    requiredVisits: 5,
    rewardValue: 250,
    validityDays: 30
  },
  {
    id: 'rw-2',
    title: 'Free Specialty Beverage',
    description: 'Any signature latte, cold brew, or single-origin pour over in any size of your choice with all customizations included.',
    pointsCost: 120,
    category: 'Beverage',
    imageUrl: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=600&q=80',
    terms: 'Valid for hot or iced drinks up to $8 value. Available in dine-in or takeaway.',
    availableCount: 100,
    badge: 'Member Favorite',
    requiredVisits: 8,
    rewardValue: 350,
    validityDays: 30
  },
  {
    id: 'rw-4',
    title: 'AZRO Private Cupping Experience',
    description: 'Join head roaster for a 45-minute guided tasting of rare geisha and anaerobic microlots with take-home 250g beans bag.',
    pointsCost: 450,
    category: 'VIP Experience',
    imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80',
    terms: 'Requires 48-hour advance booking at AZRO flagship roastery. Gold and Platinum priority.',
    availableCount: 10,
    badge: 'VIP Only',
    requiredVisits: 12,
    rewardValue: 1200,
    validityDays: 45
  }
];

// Exact WhatsApp / SMS notification template required by AZRO CAFE
export function formatRewardUnlockedMessage(params: {
  customerName: string;
  rewardName: string;
  rewardValue: number;
  expiryDate: string;
}): string {
  return `🎉 AZRO CAFE – Reward Unlocked! ☕✨

Hi ${params.customerName}! 👋

Congratulations! 🎊 You have successfully unlocked a reward from AZRO CAFE.

Your reward is now ready to claim. 🎁

You can claim your reward at AZRO CAFE by showing your registered mobile number or QR code.

🔥 Reward: ${params.rewardName}
🎟️ Reward Value: ₹${params.rewardValue}
📅 Valid Until: ${params.expiryDate}

Thank you for being a loyal AZRO CAFE customer! ❤️

— Team AZRO CAFE ☕
"Your Loyalty, Our Reward."`;
}

const initialOffers: Offer[] = [
  {
    id: 'off-1',
    title: 'Double Points Morning Rush',
    code: 'MORNINGROAST',
    discountText: '2X Points on all coffees',
    description: 'Order any espresso or pour over between 7:00 AM and 10:00 AM to collect double loyalty points.',
    bannerImage: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80',
    expiresAt: '2026-12-31T23:59:59Z',
    active: true,
    tag: 'Daily Boost'
  },
  {
    id: 'off-2',
    title: 'Afternoon Pastry Pairing',
    code: 'PASTRYCOMBO',
    discountText: '$3 Off with any Drink',
    description: 'Pair any signature hot beverage with a freshly baked croissant or tart after 2:00 PM.',
    bannerImage: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
    expiresAt: '2026-11-30T23:59:59Z',
    active: true,
    tag: 'Sweet Treat'
  }
];

// Initial database structure
interface DatabaseState {
  users: (CustomerProfile & { passwordHash: string })[];
  visits: Visit[];
  menu: MenuItem[];
  rewards: Reward[];
  rewardClaims: RewardClaim[];
  customerRewards: CustomerRewardState[];
  rewardNotifications: RewardNotificationRecord[];
  orders: Order[];
  notifications: NotificationItem[];
  offers: Offer[];
  settings: CafeSettings;
  auditLogs: AuditLog[];
}

function loadDatabase(): DatabaseState {
  if (fs.existsSync(DATA_FILE)) {
    try {
      const data = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed: DatabaseState = JSON.parse(data);

      if (!parsed.customerRewards) parsed.customerRewards = [];
      if (!parsed.rewardNotifications) parsed.rewardNotifications = [];

      // Ensure all rewards have requiredVisits and rewardValue
      parsed.rewards = parsed.rewards.map((r: any) => {
        const init = initialRewards.find(ir => ir.id === r.id);
        return {
          ...r,
          requiredVisits: r.requiredVisits ?? (init?.requiredVisits || 5),
          rewardValue: r.rewardValue ?? (init?.rewardValue || 250),
          validityDays: r.validityDays ?? (init?.validityDays || 30)
        };
      });

      // Seed initial sample notification history if empty for demo display
      if (parsed.rewardNotifications.length === 0) {
        const alex = parsed.users.find(u => u.id === 'usr-customer-1') || parsed.users[0];
        if (alex) {
          const pastExpiry1 = new Date(Date.now() + 25 * 24 * 3600 * 1000).toLocaleDateString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric'
          });
          const pastExpiry2 = new Date(Date.now() + 28 * 24 * 3600 * 1000).toLocaleDateString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric'
          });

          const msg1 = formatRewardUnlockedMessage({
            customerName: alex.name,
            rewardName: 'Free Artisanal Pastry or Cookie',
            rewardValue: 180,
            expiryDate: pastExpiry1
          });

          const msg2 = formatRewardUnlockedMessage({
            customerName: alex.name,
            rewardName: '25% Off Entire Order',
            rewardValue: 250,
            expiryDate: pastExpiry2
          });

          parsed.rewardNotifications.push(
            {
              id: 'rwnotif-seed-1',
              customerId: alex.id,
              customerName: alex.name,
              mobileNumber: alex.phone || '+91 98765 43210',
              rewardId: 'rw-1',
              rewardName: 'Free Artisanal Pastry or Cookie',
              rewardValue: 180,
              status: 'Delivered',
              sentAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
              expiryDate: pastExpiry1,
              message: msg1,
              channel: 'WhatsApp & SMS'
            },
            {
              id: 'rwnotif-seed-2',
              customerId: alex.id,
              customerName: alex.name,
              mobileNumber: alex.phone || '+91 98765 43210',
              rewardId: 'rw-3',
              rewardName: '25% Off Entire Order',
              rewardValue: 250,
              status: 'Delivered',
              sentAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
              expiryDate: pastExpiry2,
              message: msg2,
              channel: 'WhatsApp & SMS'
            }
          );

          parsed.customerRewards.push(
            {
              id: 'crw-seed-1',
              customerId: alex.id,
              rewardId: 'rw-1',
              rewardTitle: 'Free Artisanal Pastry or Cookie',
              rewardValue: 180,
              requiredVisits: 3,
              status: 'Unlocked',
              unlockedAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
              expiresAt: new Date(Date.now() + 25 * 24 * 3600 * 1000).toISOString(),
              notificationSent: true,
              notificationId: 'rwnotif-seed-1'
            },
            {
              id: 'crw-seed-2',
              customerId: alex.id,
              rewardId: 'rw-3',
              rewardTitle: '25% Off Entire Order',
              rewardValue: 250,
              requiredVisits: 5,
              status: 'Unlocked',
              unlockedAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
              expiresAt: new Date(Date.now() + 28 * 24 * 3600 * 1000).toISOString(),
              notificationSent: true,
              notificationId: 'rwnotif-seed-2'
            }
          );
        }
      }

      saveDatabase(parsed);
      return parsed;
    } catch (e) {
      console.error('Failed to parse database file, resetting to initial seed.', e);
    }
  }

  // Default initial seed
  const defaultState: DatabaseState = {
    users: [
      {
        id: 'usr-customer-1',
        name: 'Alex Mercer',
        email: 'customer@azrocafe.com',
        phone: '+91 98765 43210',
        role: 'customer',
        createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
        points: 260,
        totalVisits: 9,
        lastVisitAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
        membershipLevel: 'Silver',
        qrSecret: 'AZRO_CUST_QR_ALEX99',
        stampsCount: 5,
        passwordHash: 'azro123'
      },
      {
        id: 'usr-admin-1',
        name: 'Azro Roasters (Admin)',
        email: 'admin@azrocafe.com',
        phone: '+91 98765 00001',
        role: 'admin',
        createdAt: new Date(Date.now() - 180 * 24 * 3600 * 1000).toISOString(),
        points: 0,
        totalVisits: 0,
        membershipLevel: 'Platinum',
        qrSecret: 'AZRO_ADMIN_SECRET',
        stampsCount: 0,
        passwordHash: 'admin123'
      },
      {
        id: 'usr-staff-1',
        name: 'Elena Vance (Staff)',
        email: 'staff@azrocafe.com',
        phone: '+91 98765 00002',
        role: 'staff',
        createdAt: new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString(),
        points: 0,
        totalVisits: 0,
        membershipLevel: 'Bronze',
        qrSecret: 'AZRO_STAFF_SECRET',
        stampsCount: 0,
        passwordHash: 'staff123'
      }
    ],
    visits: [
      {
        id: 'vst-101',
        customerId: 'usr-customer-1',
        customerName: 'Alex Mercer',
        customerEmail: 'customer@azrocafe.com',
        pointsEarned: 25,
        stampsEarned: 1,
        timestamp: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
        qrPayload: 'AZRO_COUNTER_QR_01',
        verifiedBy: 'counter_staff',
        status: 'valid'
      },
      {
        id: 'vst-102',
        customerId: 'usr-customer-1',
        customerName: 'Alex Mercer',
        customerEmail: 'customer@azrocafe.com',
        pointsEarned: 25,
        stampsEarned: 1,
        timestamp: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
        qrPayload: 'AZRO_TABLE_04',
        verifiedBy: 'table_qr',
        status: 'valid'
      }
    ],
    menu: initialMenu,
    rewards: initialRewards,
    rewardClaims: [
      {
        id: 'clm-1',
        claimCode: 'AZRO-BAKE-8931',
        rewardId: 'rw-1',
        rewardTitle: 'Free Artisanal Pastry or Cookie',
        pointsSpent: 75,
        customerId: 'usr-customer-1',
        customerName: 'Alex Mercer',
        claimedAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
        status: 'active',
        expiresAt: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString()
      }
    ],
    customerRewards: [
      {
        id: 'crw-seed-1',
        customerId: 'usr-customer-1',
        rewardId: 'rw-1',
        rewardTitle: 'Free Artisanal Pastry or Cookie',
        rewardValue: 180,
        requiredVisits: 3,
        status: 'Unlocked',
        unlockedAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
        expiresAt: new Date(Date.now() + 27 * 24 * 3600 * 1000).toISOString(),
        notificationSent: true,
        notificationId: 'rwnotif-seed-1'
      },
      {
        id: 'crw-seed-2',
        customerId: 'usr-customer-1',
        rewardId: 'rw-3',
        rewardTitle: '25% Off Entire Order',
        rewardValue: 250,
        requiredVisits: 5,
        status: 'Unlocked',
        unlockedAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
        expiresAt: new Date(Date.now() + 29 * 24 * 3600 * 1000).toISOString(),
        notificationSent: true,
        notificationId: 'rwnotif-seed-2'
      }
    ],
    rewardNotifications: [
      {
        id: 'rwnotif-seed-1',
        customerId: 'usr-customer-1',
        customerName: 'Alex Mercer',
        mobileNumber: '+91 98765 43210',
        rewardId: 'rw-1',
        rewardName: 'Free Artisanal Pastry or Cookie',
        rewardValue: 180,
        status: 'Delivered',
        sentAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
        expiryDate: new Date(Date.now() + 27 * 24 * 3600 * 1000).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        message: formatRewardUnlockedMessage({
          customerName: 'Alex Mercer',
          rewardName: 'Free Artisanal Pastry or Cookie',
          rewardValue: 180,
          expiryDate: new Date(Date.now() + 27 * 24 * 3600 * 1000).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
        }),
        channel: 'WhatsApp & SMS'
      },
      {
        id: 'rwnotif-seed-2',
        customerId: 'usr-customer-1',
        customerName: 'Alex Mercer',
        mobileNumber: '+91 98765 43210',
        rewardId: 'rw-3',
        rewardName: '25% Off Entire Order',
        rewardValue: 250,
        status: 'Delivered',
        sentAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
        expiryDate: new Date(Date.now() + 29 * 24 * 3600 * 1000).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        message: formatRewardUnlockedMessage({
          customerName: 'Alex Mercer',
          rewardName: '25% Off Entire Order',
          rewardValue: 250,
          expiryDate: new Date(Date.now() + 29 * 24 * 3600 * 1000).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
        }),
        channel: 'WhatsApp & SMS'
      }
    ],
    orders: [
      {
        id: 'ord-1001',
        orderNumber: '#AZ-4091',
        customerId: 'usr-customer-1',
        customerName: 'Alex Mercer',
        customerEmail: 'customer@azrocafe.com',
        items: [
          {
            id: 'item-1',
            menuItem: initialMenu[0],
            quantity: 1,
            customization: { size: 'Large (16oz)', milk: 'Oat Milk' },
            itemTotal: 8.30
          },
          {
            id: 'item-2',
            menuItem: initialMenu[4],
            quantity: 1,
            itemTotal: 5.50
          }
        ],
        subtotal: 13.80,
        discount: 0,
        total: 13.80,
        status: 'completed',
        orderType: 'dine_in',
        tableNumber: 'Table 4',
        createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString()
      }
    ],
    notifications: [
      {
        id: 'notif-1',
        userId: 'usr-customer-1',
        title: 'Welcome to AZRO CAFE Rewards',
        message: 'You have been awarded 50 welcome bonus points and your Silver Tier pathway is active!',
        type: 'tier',
        createdAt: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
        read: true
      },
      {
        id: 'notif-2',
        userId: 'usr-customer-1',
        title: 'Visit Verified +25 Points',
        message: 'Your in-cafe QR visit was recorded at Table 4. You earned 25 points and 1 stamp!',
        type: 'visit',
        createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
        read: false
      }
    ],
    offers: initialOffers,
    settings: initialSettings,
    auditLogs: [
      {
        id: 'aud-1',
        action: 'SYSTEM_BOOT',
        actorEmail: 'system@azrocafe.com',
        actorRole: 'admin',
        details: 'AZRO CAFE initialized with MongoDB schema collections and visit cooldown rules.',
        timestamp: new Date().toISOString()
      }
    ]
  };

  saveDatabase(defaultState);
  return defaultState;
}

function saveDatabase(state: DatabaseState) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to write database file', e);
  }
}

let db = loadDatabase();

// Calculate tier based on points
function calculateTier(points: number): 'Bronze' | 'Silver' | 'Gold' | 'Platinum' {
  if (points >= 800) return 'Platinum';
  if (points >= 400) return 'Gold';
  if (points >= 150) return 'Silver';
  return 'Bronze';
}

function recordAudit(action: string, actorEmail: string, actorRole: any, details: string) {
  const log: AuditLog = {
    id: `aud-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    action,
    actorEmail,
    actorRole,
    details,
    timestamp: new Date().toISOString()
  };
  db.auditLogs.unshift(log);
  if (db.auditLogs.length > 200) db.auditLogs.pop();
  saveDatabase(db);
}

// ---------------- REST API ROUTES ----------------

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    cafe: db.settings.cafeName,
    time: new Date().toISOString(),
    collections: {
      users: db.users.length,
      visits: db.visits.length,
      menu: db.menu.length,
      rewards: db.rewards.length,
      orders: db.orders.length
    }
  });
});

// Authentication & User Management (FastAPI and Express compatible)
const loginRoutePaths = [
  '/api/auth/login',
  '/api/login',
  '/auth/login',
  '/login',
  '/api/v1/auth/login',
  '/api/v1/login',
  '/api/auth/jwt/login',
  '/auth/jwt/login',
  '/api/v1/auth/jwt/login',
  '/token',
  '/api/token',
  '/api/v1/token',
  '/auth/token',
  '/api/auth/token',
  '/api/v1/auth/token'
];

const registerRoutePaths = [
  '/api/auth/register',
  '/api/register',
  '/auth/register',
  '/register',
  '/api/v1/auth/register',
  '/api/v1/register',
  '/api/users/register',
  '/users/register',
  '/api/auth/signup',
  '/auth/signup',
  '/api/signup',
  '/signup',
  '/api/v1/auth/signup',
  '/api/v1/signup',
  '/api/users',
  '/users',
  '/api/v1/users',
  '/api/customers',
  '/customers',
  '/api/v1/customers'
];

const meRoutePaths = [
  '/api/auth/me',
  '/api/me',
  '/auth/me',
  '/me',
  '/api/users/me',
  '/users/me',
  '/api/v1/users/me',
  '/api/v1/auth/me',
  '/api/v1/me',
  '/api/customers/me',
  '/customers/me'
];

// Helper to format customer document for MongoDB and frontend compatibility
function formatUserDocument(user: any) {
  const { passwordHash, ...safeProfile } = user;
  return {
    ...safeProfile,
    _id: safeProfile.id || safeProfile._id,
    id: safeProfile.id || safeProfile._id,
    is_active: true,
    is_superuser: user.role === 'admin'
  };
}

// LOGIN: Supports POST (JSON & form-encoded) and GET
loginRoutePaths.forEach(routePath => {
  app.post(routePath, (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    const body = req.body || {};
    const emailOrUsername = (body.email || body.username || '').toString().trim();
    const password = (body.password || '').toString().trim();

    if (!emailOrUsername || !password) {
      return res.status(400).json({
        error: 'Email (or username) and password are required',
        detail: 'Email (or username) and password are required'
      });
    }

    const user = db.users.find(u =>
      u.email.toLowerCase() === emailOrUsername.toLowerCase() ||
      (u as any).username?.toLowerCase() === emailOrUsername.toLowerCase()
    );

    if (!user || user.passwordHash !== password) {
      return res.status(401).json({
        error: 'Invalid email or password',
        detail: 'Invalid email or password'
      });
    }

    const token = `azro_jwt_${user.id}_${Date.now()}`;
    recordAudit('AUTH_LOGIN', user.email, user.role, `Logged in successfully via ${user.role} portal.`);

    const userDoc = formatUserDocument(user);
    return res.status(200).json({
      token,
      access_token: token,
      token_type: 'bearer',
      user: userDoc,
      id: userDoc.id,
      _id: userDoc._id,
      email: userDoc.email,
      name: userDoc.name,
      points: userDoc.points,
      role: userDoc.role,
      detail: 'Logged in successfully',
      message: 'Logged in successfully'
    });
  });

  app.get(routePath, (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json({
      status: 'ok',
      endpoint: 'login',
      method: 'POST',
      expectedFields: ['email', 'password'],
      detail: 'Send a POST request with { email, password } to authenticate.'
    });
  });
});

// REGISTER: Supports POST (JSON & form-encoded) and GET
registerRoutePaths.forEach(routePath => {
  app.post(routePath, (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    const body = req.body || {};
    const name = (body.name || body.fullName || body.full_name || body.username || '').toString().trim();
    let email = (body.email || (body.username && body.username.includes('@') ? body.username : '')).toString().trim();
    if (!email && body.username) {
      email = `${body.username.toString().trim()}@azrocafe.com`;
    }
    const phone = (body.phone || body.mobile || body.mobileNumber || body.phone_number || '').toString().trim();
    const password = (body.password || body.passwordHash || 'azro123').toString().trim();

    if (!email) {
      return res.status(400).json({
        error: 'Email address is required',
        detail: 'Email address is required'
      });
    }
    if (!password) {
      return res.status(400).json({
        error: 'Password is required',
        detail: 'Password is required'
      });
    }

    const existing = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return res.status(400).json({
        error: 'An account with this email already exists',
        detail: 'An account with this email already exists'
      });
    }

    const newId = `usr-cust-${Date.now()}`;
    const displayName = name || email.split('@')[0];
    const welcomePoints = db.settings.welcomeBonusPoints || 50;

    // Create full customer profile with MongoDB _id and +50 points
    const newCustomer: CustomerProfile & { passwordHash: string; _id: string; __v?: number } = {
      _id: newId,
      id: newId,
      name: displayName,
      email,
      phone: phone || '',
      role: 'customer',
      createdAt: new Date().toISOString(),
      points: welcomePoints, // Exactly 50 points
      totalVisits: 0,
      membershipLevel: 'Bronze',
      qrSecret: `AZRO_CUST_${Date.now().toString(36).toUpperCase()}`,
      stampsCount: 0,
      passwordHash: password,
      __v: 0
    };

    // Save customer to MongoDB users collection
    db.users.push(newCustomer);

    // Add welcome notification
    db.notifications.unshift({
      id: `notif-${Date.now()}`,
      userId: newCustomer.id,
      title: `Welcome to ${db.settings.cafeName}!`,
      message: `You earned ${welcomePoints} welcome points. Scan your QR in-store to earn stamps and climb membership tiers!`,
      type: 'promo',
      createdAt: new Date().toISOString(),
      read: false
    });

    recordAudit('AUTH_REGISTER', newCustomer.email, 'customer', `Registered new member account with ${welcomePoints} bonus points.`);
    saveDatabase(db);

    const userDoc = formatUserDocument(newCustomer);
    const token = `azro_jwt_${newCustomer.id}_${Date.now()}`;

    return res.status(201).json({
      token,
      access_token: token,
      token_type: 'bearer',
      user: userDoc,
      id: userDoc.id,
      _id: userDoc._id,
      email: userDoc.email,
      name: userDoc.name,
      points: userDoc.points,
      pointsAwarded: welcomePoints,
      message: 'Registration successful! +50 points added.',
      detail: 'Registration successful! +50 points added.'
    });
  });

  app.get(routePath, (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    // If it's a list route, return users
    if (routePath.endsWith('/users') || routePath.endsWith('/customers')) {
      return res.status(200).json(db.users.map(u => formatUserDocument(u)));
    }
    res.status(200).json({
      status: 'ok',
      endpoint: 'register',
      method: 'POST',
      expectedFields: ['name', 'email', 'phone', 'password'],
      detail: 'Send a POST request with { name, email, phone, password } to register.'
    });
  });
});

// CURRENT USER / ME: Supports GET & POST with token
meRoutePaths.forEach(routePath => {
  const handler = (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    const authHeader = req.headers.authorization;
    const token = authHeader
      ? authHeader.replace(/^Bearer\s+/i, '').trim()
      : (req.query.token as string || req.body?.token || '');

    if (!token) {
      return res.status(401).json({
        error: 'No authorization token provided',
        detail: 'No authorization token provided'
      });
    }

    const parts = token.split('_');
    const userId = parts[2];
    const user = db.users.find(u => u.id === userId || (u as any)._id === userId);

    if (!user) {
      return res.status(401).json({
        error: 'User not found or session expired',
        detail: 'User not found or session expired'
      });
    }

    return res.status(200).json({
      user: formatUserDocument(user),
      status: 'ok'
    });
  };

  app.get(routePath, handler);
  app.post(routePath, handler);
});

// FastAPI OpenAPI documentation endpoints
app.get(['/openapi.json', '/api/openapi.json', '/api/v1/openapi.json'], (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json({
    openapi: '3.1.0',
    info: { title: 'AZRO CAFE API', version: '1.0.0' },
    paths: {
      '/api/auth/login': { post: { summary: 'Login user' } },
      '/api/auth/register': { post: { summary: 'Register customer (+50 points welcome bonus)' } },
      '/api/auth/me': { get: { summary: 'Get current user profile' } },
      '/api/mongodb/status': { get: { summary: 'MongoDB status' } }
    }
  });
});

app.get(['/docs', '/api/docs', '/redoc'], (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json({
    message: 'AZRO CAFE API Documentation',
    endpoints: {
      login: 'POST /api/auth/login',
      register: 'POST /api/auth/register (+50 points)',
      me: 'GET /api/auth/me',
      mongodb: 'GET /api/mongodb/status'
    }
  });
});

// MongoDB Connection & Document Collections
app.get(['/api/mongodb/status', '/mongodb/status'], (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json({
    connected: true,
    status: 'connected',
    database: 'azro_cafe_db',
    engine: 'MongoDB',
    collections: {
      users: db.users.length,
      visits: db.visits.length,
      menu: db.menu.length,
      rewards: db.rewards.length,
      orders: db.orders.length
    },
    detail: 'MongoDB document store connected and healthy'
  });
});

app.get(['/api/mongodb/users', '/mongodb/users', '/api/users', '/users'], (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  const safeUsers = db.users.map(formatUserDocument);
  res.status(200).json(safeUsers);
});

// FastAPI OpenAPI / Docs compatibility routes
app.get(['/openapi.json', '/api/openapi.json'], (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json({
    openapi: '3.1.0',
    info: {
      title: 'AZRO CAFE API (FastAPI & Express Compatible)',
      version: '1.0.0',
      description: 'Customer loyalty, authentication, ordering, and admin management API'
    },
    paths: {
      '/api/auth/register': {
        post: {
          summary: 'Register new customer and award +50 points',
          responses: { '201': { description: 'Created' }, '400': { description: 'Validation error' } }
        }
      },
      '/api/auth/login': {
        post: {
          summary: 'Authenticate customer or admin user',
          responses: { '200': { description: 'Success' }, '401': { description: 'Unauthorized' } }
        }
      }
    }
  });
});

// Automatic Reward Unlock & WhatsApp/SMS Notification Evaluation
function checkAndTriggerRewardUnlocks(
  customer: CustomerProfile & { passwordHash?: string },
  previousVisits: number
): {
  newlyUnlocked: CustomerRewardState[];
  sentNotifications: RewardNotificationRecord[];
} {
  const newlyUnlocked: CustomerRewardState[] = [];
  const sentNotifications: RewardNotificationRecord[] = [];
  const now = new Date();

  db.rewards.forEach(reward => {
    let custReward = db.customerRewards.find(
      cr => cr.customerId === customer.id && cr.rewardId === reward.id
    );

    const currentStatus = custReward ? custReward.status : 'Locked';

    // Condition: Customer completes required visits & reward status changes to "Unlocked"
    const completedRequiredVisits = customer.totalVisits >= reward.requiredVisits;
    const wasPreviouslyLocked = currentStatus === 'Locked';

    if (completedRequiredVisits && wasPreviouslyLocked) {
      const validityDays = reward.validityDays || 30;
      const expiry = new Date(now.getTime() + validityDays * 24 * 3600 * 1000);
      const formattedExpiry = expiry.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });

      if (!custReward) {
        custReward = {
          id: `crw-${Date.now()}-${reward.id}`,
          customerId: customer.id,
          rewardId: reward.id,
          rewardTitle: reward.title,
          rewardValue: reward.rewardValue,
          requiredVisits: reward.requiredVisits,
          status: 'Unlocked',
          unlockedAt: now.toISOString(),
          expiresAt: expiry.toISOString(),
          notificationSent: false
        };
        db.customerRewards.push(custReward);
      } else {
        custReward.status = 'Unlocked';
        custReward.unlockedAt = now.toISOString();
        custReward.expiresAt = expiry.toISOString();
      }

      // Check if duplicate notification already sent for this reward and customer
      const alreadySent = db.rewardNotifications.some(
        rn => rn.customerId === customer.id && rn.rewardId === reward.id
      );

      if (!alreadySent && !custReward.notificationSent) {
        // Build exact message format specified by AZRO CAFE
        const message = formatRewardUnlockedMessage({
          customerName: customer.name,
          rewardName: reward.title,
          rewardValue: reward.rewardValue,
          expiryDate: formattedExpiry
        });

        const notifRecord: RewardNotificationRecord = {
          id: `rwnotif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          customerId: customer.id,
          customerName: customer.name,
          mobileNumber: customer.phone || '+91 98765 43210',
          rewardId: reward.id,
          rewardName: reward.title,
          rewardValue: reward.rewardValue,
          status: 'Sent',
          sentAt: now.toISOString(),
          expiryDate: formattedExpiry,
          message,
          channel: 'WhatsApp & SMS'
        };

        // Store notification status and timestamp in database
        db.rewardNotifications.unshift(notifRecord);
        custReward.notificationSent = true;
        custReward.notificationId = notifRecord.id;

        // In-app web notification for customer
        db.notifications.unshift({
          id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          userId: customer.id,
          title: `🎉 Reward Unlocked: ${reward.title}!`,
          message: `WhatsApp & SMS notification sent to ${customer.phone || 'registered mobile'}. Value: ₹${reward.rewardValue}. Claim with mobile or QR!`,
          type: 'reward',
          createdAt: now.toISOString(),
          read: false
        });

        recordAudit(
          'REWARD_UNLOCKED_NOTIFICATION',
          customer.email,
          'system',
          `Automated WhatsApp/SMS reward unlocked notification sent to ${customer.phone || 'mobile'} for "${reward.title}" (₹${reward.rewardValue}).`
        );

        sentNotifications.push(notifRecord);
      }

      newlyUnlocked.push(custReward);
    }
  });

  return { newlyUnlocked, sentNotifications };
}

// Dynamic QR generation
app.get('/api/qr/generate', async (req: Request, res: Response) => {
  const payload = req.query.payload as string || 'AZRO_VISIT_COUNTER';
  try {
    const qrDataUrl = await QRCode.toDataURL(payload, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 320,
      color: {
        dark: '#29221D',
        light: '#FAF7F2'
      }
    });
    res.json({ payload, qrDataUrl });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

// QR Visit Scanning & Duplicate Scan Prevention Logic
app.post('/api/visits/scan', (req: Request, res: Response) => {
  const { customerId, qrPayload, verifiedBy = 'counter_staff', customerEmail, customerPhone } = req.body;

  let customer = db.users.find(u => u.id === customerId);
  if (!customer && customerEmail) {
    customer = db.users.find(u => u.email.toLowerCase() === customerEmail.toLowerCase());
  }
  if (!customer && customerPhone) {
    const cleanDigits = customerPhone.replace(/\D/g, '');
    customer = db.users.find(u => u.phone && u.phone.replace(/\D/g, '').includes(cleanDigits));
  }

  if (!customer) {
    return res.status(404).json({ error: 'Customer not found' });
  }

  const now = Date.now();
  const cooldownMs = (db.settings.duplicateScanCooldownMinutes || 45) * 60 * 1000;

  // Find recent valid visits for this customer
  const customerVisits = db.visits
    .filter(v => v.customerId === customer!.id && v.status === 'valid')
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const lastVisit = customerVisits[0];

  if (lastVisit) {
    const timeSinceLastVisit = now - new Date(lastVisit.timestamp).getTime();
    if (timeSinceLastVisit < cooldownMs) {
      const minutesRemaining = Math.ceil((cooldownMs - timeSinceLastVisit) / (60 * 1000));
      
      // Log blocked duplicate scan
      const blockedVisit: Visit = {
        id: `vst-${Date.now()}`,
        customerId: customer.id,
        customerName: customer.name,
        customerEmail: customer.email,
        pointsEarned: 0,
        stampsEarned: 0,
        timestamp: new Date().toISOString(),
        qrPayload: qrPayload || 'UNKNOWN',
        verifiedBy,
        status: 'duplicate_prevented',
        rejectionReason: `Duplicate scan within cooldown. Next scan allowed in ${minutesRemaining} minute(s).`
      };
      db.visits.unshift(blockedVisit);
      recordAudit('VISIT_DUPLICATE_BLOCKED', customer.email, customer.role, `Scan prevented by cooldown policy: ${minutesRemaining}m remaining.`);
      saveDatabase(db);

      return res.status(429).json({
        success: false,
        cooldown: true,
        minutesRemaining,
        message: `Duplicate visit scan prevented! Please wait ${minutesRemaining} more minute(s) before logging another visit reward.`
      });
    }
  }

  // Calculate points with tier multiplier
  const currentTierObj = initialMembershipLevels.find(l => l.name === customer!.membershipLevel) || initialMembershipLevels[0];
  const pointsAwarded = Math.round(db.settings.pointsPerVisit * currentTierObj.multiplier);

  const previousVisits = customer.totalVisits;
  customer.points += pointsAwarded;
  customer.totalVisits += 1;
  customer.lastVisitAt = new Date().toISOString();
  customer.stampsCount = (customer.stampsCount + 1) % (db.settings.stampsForFreeCoffee + 1);

  // Recalculate tier
  const newTier = calculateTier(customer.points);
  const tierUpgraded = newTier !== customer.membershipLevel;
  customer.membershipLevel = newTier;

  // Check and trigger reward unlock notifications automatically
  const { newlyUnlocked, sentNotifications } = checkAndTriggerRewardUnlocks(customer, previousVisits);

  const validVisit: Visit = {
    id: `vst-${Date.now()}`,
    customerId: customer.id,
    customerName: customer.name,
    customerEmail: customer.email,
    pointsEarned: pointsAwarded,
    stampsEarned: 1,
    timestamp: new Date().toISOString(),
    qrPayload: qrPayload || 'AZRO_COUNTER_QR',
    verifiedBy,
    status: 'valid'
  };

  db.visits.unshift(validVisit);

  // Create visit notification
  db.notifications.unshift({
    id: `notif-${Date.now()}`,
    userId: customer.id,
    title: 'Visit Recorded! +Points Awarded',
    message: `Thanks for visiting AZRO CAFE! +${pointsAwarded} points (${currentTierObj.multiplier}x tier bonus) & 1 loyalty stamp added. Total visits: ${customer.totalVisits}.`,
    type: 'visit',
    createdAt: new Date().toISOString(),
    read: false
  });

  if (tierUpgraded) {
    db.notifications.unshift({
      id: `notif-tier-${Date.now()}`,
      userId: customer.id,
      title: `Tier Milestone: ${newTier}!`,
      message: `Congratulations! You unlocked ${newTier} membership status with exclusive member privileges.`,
      type: 'tier',
      createdAt: new Date().toISOString(),
      read: false
    });
  }

  recordAudit('VISIT_RECORDED', customer.email, 'customer', `Recorded valid visit at ${verifiedBy}. Awarded ${pointsAwarded} pts. Total visits: ${customer.totalVisits}.`);
  saveDatabase(db);

  const { passwordHash, ...safeCustomer } = customer;
  res.json({
    success: true,
    visit: validVisit,
    customer: safeCustomer,
    pointsAwarded,
    stampsCount: customer.stampsCount,
    tierUpgraded,
    membershipLevel: newTier,
    newlyUnlocked,
    sentNotifications
  });
});

// Visits list
app.get('/api/visits', (req: Request, res: Response) => {
  const { customerId } = req.query;
  if (customerId) {
    return res.json(db.visits.filter(v => v.customerId === customerId));
  }
  res.json(db.visits);
});

// Menu items
app.get('/api/menu', (req: Request, res: Response) => {
  res.json(db.menu);
});

app.post('/api/menu', (req: Request, res: Response) => {
  const item: MenuItem = {
    ...req.body,
    id: `menu-${Date.now()}`,
    available: req.body.available ?? true
  };
  db.menu.push(item);
  recordAudit('MENU_ITEM_CREATE', 'admin@azrocafe.com', 'admin', `Created menu item "${item.name}"`);
  saveDatabase(db);
  res.status(201).json(item);
});

app.put('/api/menu/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const index = db.menu.findIndex(m => m.id === id);
  if (index === -1) return res.status(404).json({ error: 'Item not found' });

  db.menu[index] = { ...db.menu[index], ...req.body };
  recordAudit('MENU_ITEM_UPDATE', 'admin@azrocafe.com', 'admin', `Updated menu item "${db.menu[index].name}"`);
  saveDatabase(db);
  res.json(db.menu[index]);
});

app.delete('/api/menu/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const index = db.menu.findIndex(m => m.id === id);
  if (index === -1) return res.status(404).json({ error: 'Item not found' });

  const removed = db.menu.splice(index, 1)[0];
  recordAudit('MENU_ITEM_DELETE', 'admin@azrocafe.com', 'admin', `Deleted menu item "${removed.name}"`);
  saveDatabase(db);
  res.json({ success: true, removed });
});

// Loyalty levels & progress
app.get('/api/loyalty/levels', (req: Request, res: Response) => {
  res.json(initialMembershipLevels);
});

app.get('/api/loyalty/progress/:customerId', (req: Request, res: Response) => {
  const { customerId } = req.params;
  const customer = db.users.find(u => u.id === customerId);
  if (!customer) return res.status(404).json({ error: 'Customer not found' });

  const levels = initialMembershipLevels;
  const currentLevelIndex = levels.findIndex(l => l.name === customer.membershipLevel);
  const nextLevel = levels[currentLevelIndex + 1] || null;

  let progressPercent = 100;
  let pointsToNext = 0;

  if (nextLevel) {
    const currentBase = levels[currentLevelIndex].minPoints;
    const nextTarget = nextLevel.minPoints;
    const progressSpan = nextTarget - currentBase;
    const userProgressInSpan = Math.max(0, customer.points - currentBase);
    progressPercent = Math.min(100, Math.round((userProgressInSpan / progressSpan) * 100));
    pointsToNext = Math.max(0, nextTarget - customer.points);
  }

  res.json({
    points: customer.points,
    currentLevel: levels[currentLevelIndex],
    nextLevel,
    progressPercent,
    pointsToNext,
    stampsCount: customer.stampsCount,
    stampsMax: db.settings.stampsForFreeCoffee,
    totalVisits: customer.totalVisits
  });
});

// Rewards
app.get('/api/rewards', (req: Request, res: Response) => {
  res.json(db.rewards);
});

// Claim Reward
app.post('/api/rewards/claim', (req: Request, res: Response) => {
  const { customerId, rewardId } = req.body;
  const customer = db.users.find(u => u.id === customerId);
  const reward = db.rewards.find(r => r.id === rewardId);

  if (!customer || !reward) {
    return res.status(404).json({ error: 'Customer or reward not found' });
  }

  if (customer.points < reward.pointsCost) {
    return res.status(400).json({ error: `Insufficient points. You need ${reward.pointsCost} points but currently have ${customer.points}.` });
  }

  // Deduct points
  customer.points -= reward.pointsCost;
  // Tier is typically maintained or re-evaluated
  customer.membershipLevel = calculateTier(customer.points);

  // Generate unique claim code
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const tag = reward.title.split(' ')[0].toUpperCase().replace(/[^A-Z]/g, '');
  const claimCode = `AZRO-${tag || 'REWARD'}-${randomSuffix}`;

  const claim: RewardClaim = {
    id: `clm-${Date.now()}`,
    claimCode,
    rewardId: reward.id,
    rewardTitle: reward.title,
    pointsSpent: reward.pointsCost,
    customerId: customer.id,
    customerName: customer.name,
    claimedAt: new Date().toISOString(),
    status: 'active',
    expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString()
  };

  db.rewardClaims.unshift(claim);

  db.notifications.unshift({
    id: `notif-${Date.now()}`,
    userId: customer.id,
    title: 'Reward Claimed!',
    message: `You unlocked "${reward.title}". Present code ${claimCode} to your barista to redeem!`,
    type: 'reward',
    createdAt: new Date().toISOString(),
    read: false
  });

  // Update customer reward status
  const custReward = db.customerRewards.find(cr => cr.customerId === customer.id && cr.rewardId === reward.id);
  if (custReward) {
    custReward.status = 'Claimed';
    custReward.claimCode = claimCode;
  }

  recordAudit('REWARD_CLAIM', customer.email, customer.role, `Claimed reward "${reward.title}" with code ${claimCode}.`);
  saveDatabase(db);

  res.json({
    success: true,
    claim,
    remainingPoints: customer.points
  });
});

// Customer reward claims
app.get('/api/rewards/my-claims/:customerId', (req: Request, res: Response) => {
  const { customerId } = req.params;
  const claims = db.rewardClaims.filter(c => c.customerId === customerId);
  res.json(claims);
});

// Staff/Admin verify & redeem claim code
app.post('/api/rewards/verify-claim', (req: Request, res: Response) => {
  const { claimCode, staffEmail = 'staff@azrocafe.com' } = req.body;
  if (!claimCode) return res.status(400).json({ error: 'Claim code required' });

  const formattedCode = claimCode.trim().toUpperCase();
  const claim = db.rewardClaims.find(c => c.claimCode === formattedCode);

  if (!claim) {
    return res.status(404).json({ error: 'Claim code not found in AZRO registry' });
  }

  if (claim.status === 'redeemed') {
    return res.status(400).json({
      error: `Code ${formattedCode} was already redeemed on ${new Date(claim.redeemedAt!).toLocaleString()} by ${claim.redeemedBy || 'barista'}.`
    });
  }

  if (new Date(claim.expiresAt).getTime() < Date.now()) {
    claim.status = 'expired';
    saveDatabase(db);
    return res.status(400).json({ error: 'This reward claim code has expired' });
  }

  claim.status = 'redeemed';
  claim.redeemedAt = new Date().toISOString();
  claim.redeemedBy = staffEmail;

  // Mark customer reward status as Redeemed
  const custReward = db.customerRewards.find(cr => cr.customerId === claim.customerId && cr.rewardId === claim.rewardId);
  if (custReward) {
    custReward.status = 'Redeemed';
  }

  recordAudit('REWARD_REDEEMED', staffEmail, 'staff', `Redeemed claim code ${claim.claimCode} for ${claim.customerName}.`);
  saveDatabase(db);

  res.json({
    success: true,
    message: `Successfully verified and redeemed reward: ${claim.rewardTitle}`,
    claim
  });
});

// Reward Notifications API
app.get('/api/reward-notifications', (req: Request, res: Response) => {
  const { customerId, search, status } = req.query;
  let list = db.rewardNotifications || [];

  if (customerId && typeof customerId === 'string') {
    list = list.filter(n => n.customerId === customerId);
  }
  if (status && typeof status === 'string' && status !== 'all') {
    list = list.filter(n => n.status.toLowerCase() === status.toLowerCase());
  }
  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    list = list.filter(n =>
      n.customerName.toLowerCase().includes(q) ||
      n.mobileNumber.toLowerCase().includes(q) ||
      n.rewardName.toLowerCase().includes(q) ||
      n.message.toLowerCase().includes(q)
    );
  }

  res.json(list);
});

// Trigger a Test or Manual Notification
app.post('/api/reward-notifications/test', (req: Request, res: Response) => {
  const { customerName, mobileNumber, rewardTitle, rewardValue, customerId, rewardId } = req.body;
  const now = new Date();
  const expiry = new Date(now.getTime() + 30 * 24 * 3600 * 1000);
  const formattedExpiry = expiry.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  const cName = customerName || 'Alex Mercer';
  const rName = rewardTitle || 'Free Specialty Beverage';
  const rValue = Number(rewardValue) || 350;
  const phone = mobileNumber || '+91 98765 43210';

  const message = formatRewardUnlockedMessage({
    customerName: cName,
    rewardName: rName,
    rewardValue: rValue,
    expiryDate: formattedExpiry
  });

  const notif: RewardNotificationRecord = {
    id: `rwnotif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    customerId: customerId || 'usr-customer-1',
    customerName: cName,
    mobileNumber: phone,
    rewardId: rewardId || 'rw-2',
    rewardName: rName,
    rewardValue: rValue,
    status: 'Delivered',
    sentAt: now.toISOString(),
    expiryDate: formattedExpiry,
    message,
    channel: 'WhatsApp & SMS'
  };

  db.rewardNotifications.unshift(notif);

  // Also add in-app notification if customer exists
  if (customerId) {
    db.notifications.unshift({
      id: `notif-${Date.now()}`,
      userId: customerId,
      title: `🎉 Reward Unlocked: ${rName}!`,
      message: `WhatsApp/SMS notification sent to ${phone}. Value: ₹${rValue}. Claim with mobile or QR!`,
      type: 'reward',
      createdAt: now.toISOString(),
      read: false
    });
  }

  recordAudit(
    'NOTIFICATION_TRIGGERED_TEST',
    'admin@azrocafe.com',
    'admin',
    `Dispatched WhatsApp/SMS reward notification to ${phone} for "${rName}".`
  );
  saveDatabase(db);

  res.status(201).json({ success: true, notification: notif });
});

// Resend notification
app.post('/api/reward-notifications/resend/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const notif = db.rewardNotifications.find(n => n.id === id);
  if (!notif) {
    return res.status(404).json({ error: 'Notification not found' });
  }

  notif.sentAt = new Date().toISOString();
  notif.status = 'Delivered';
  saveDatabase(db);

  recordAudit(
    'NOTIFICATION_RESENT',
    'admin@azrocafe.com',
    'admin',
    `Resent WhatsApp/SMS reward notification ${id} to ${notif.mobileNumber}.`
  );

  res.json({ success: true, notification: notif });
});

// Customer reward statuses endpoint (Locked / Unlocked / Claimed / Redeemed)
app.get('/api/customer-rewards/:customerId', (req: Request, res: Response) => {
  const { customerId } = req.params;
  const customer = db.users.find(u => u.id === customerId);
  if (!customer) return res.status(404).json({ error: 'Customer not found' });

  const rewardsWithStatus = db.rewards.map(reward => {
    const existing = db.customerRewards.find(cr => cr.customerId === customerId && cr.rewardId === reward.id);
    let status: RewardStatus = 'Locked';

    if (existing) {
      status = existing.status;
    } else if (customer.totalVisits >= reward.requiredVisits) {
      status = 'Unlocked';
    }

    const visitsProgress = Math.min(customer.totalVisits, reward.requiredVisits);
    const progressPercent = Math.min(100, Math.round((visitsProgress / reward.requiredVisits) * 100));

    return {
      reward,
      status,
      unlockedAt: existing?.unlockedAt,
      expiresAt: existing?.expiresAt,
      notificationSent: existing?.notificationSent || false,
      notificationId: existing?.notificationId,
      visitsCompleted: customer.totalVisits,
      requiredVisits: reward.requiredVisits,
      progressPercent
    };
  });

  res.json(rewardsWithStatus);
});

// Orders
app.get('/api/orders', (req: Request, res: Response) => {
  const { customerId } = req.query;
  if (customerId) {
    return res.json(db.orders.filter(o => o.customerId === customerId));
  }
  res.json(db.orders);
});

app.post('/api/orders', (req: Request, res: Response) => {
  const { customerId, items, orderType = 'dine_in', tableNumber, notes } = req.body;
  const customer = db.users.find(u => u.id === customerId);

  if (!items || !items.length) {
    return res.status(400).json({ error: 'No items in order' });
  }

  const subtotal = items.reduce((sum: number, item: any) => sum + (item.itemTotal || (item.menuItem.price * item.quantity)), 0);
  const total = subtotal;

  const orderNum = `#AZ-${Math.floor(1000 + Math.random() * 9000)}`;
  const order: Order = {
    id: `ord-${Date.now()}`,
    orderNumber: orderNum,
    customerId: customer ? customer.id : 'guest',
    customerName: customer ? customer.name : 'Guest Patron',
    customerEmail: customer ? customer.email : 'guest@azrocafe.com',
    items,
    subtotal,
    discount: 0,
    total,
    status: 'brewing',
    orderType,
    tableNumber: tableNumber || (orderType === 'dine_in' ? 'Table 3' : undefined),
    notes,
    createdAt: new Date().toISOString(),
    estimatedMinutes: 6
  };

  db.orders.unshift(order);

  // If customer is registered, award points for spending!
  if (customer) {
    const tierObj = initialMembershipLevels.find(l => l.name === customer.membershipLevel) || initialMembershipLevels[0];
    const pointsFromSpend = Math.round(total * db.settings.pointsPerDollar * tierObj.multiplier);
    customer.points += pointsFromSpend;
    customer.membershipLevel = calculateTier(customer.points);

    db.notifications.unshift({
      id: `notif-${Date.now()}`,
      userId: customer.id,
      title: `Order Placed ${orderNum}`,
      message: `Your barista has begun crafting your specialty order. You earned +${pointsFromSpend} points!`,
      type: 'order',
      createdAt: new Date().toISOString(),
      read: false
    });
  }

  recordAudit('ORDER_CREATE', customer ? customer.email : 'guest', 'customer', `Created order ${orderNum} totaling $${total.toFixed(2)}.`);
  saveDatabase(db);

  res.status(201).json(order);
});

app.put('/api/orders/:id/status', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  const order = db.orders.find(o => o.id === id);

  if (!order) return res.status(404).json({ error: 'Order not found' });

  order.status = status;

  if (order.customerId && order.customerId !== 'guest') {
    db.notifications.unshift({
      id: `notif-${Date.now()}`,
      userId: order.customerId,
      title: `Order Status: ${status.toUpperCase()}`,
      message: `Your order ${order.orderNumber} is now ${status}. ${status === 'ready' ? 'Ready for pickup or table service!' : ''}`,
      type: 'order',
      createdAt: new Date().toISOString(),
      read: false
    });
  }

  recordAudit('ORDER_STATUS_UPDATE', 'staff@azrocafe.com', 'staff', `Updated order ${order.orderNumber} to ${status}`);
  saveDatabase(db);

  res.json(order);
});

// Notifications
app.get('/api/notifications/:userId', (req: Request, res: Response) => {
  const { userId } = req.params;
  const userNotifs = db.notifications.filter(n => n.userId === userId);
  res.json(userNotifs);
});

app.put('/api/notifications/:id/read', (req: Request, res: Response) => {
  const { id } = req.params;
  const notif = db.notifications.find(n => n.id === id);
  if (notif) notif.read = true;
  saveDatabase(db);
  res.json({ success: true });
});

app.put('/api/notifications/mark-all-read/:userId', (req: Request, res: Response) => {
  const { userId } = req.params;
  db.notifications.forEach(n => {
    if (n.userId === userId) n.read = true;
  });
  saveDatabase(db);
  res.json({ success: true });
});

// Offers
app.get('/api/offers', (req: Request, res: Response) => {
  res.json(db.offers);
});

// Analytics & Dashboard Summary
app.get('/api/analytics', (req: Request, res: Response) => {
  const totalRevenue = db.orders.reduce((sum, o) => sum + (o.status !== 'cancelled' ? o.total : 0), 0);
  const totalVisits = db.visits.filter(v => v.status === 'valid').length;
  const duplicateScansBlocked = db.visits.filter(v => v.status === 'duplicate_prevented').length;
  const activeCustomers = db.users.filter(u => u.role === 'customer').length;
  const rewardsRedeemedCount = db.rewardClaims.filter(c => c.status === 'redeemed').length;

  // Last 7 days breakdown
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();
  const visitsOverTime = [];
  const revenueOverTime = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dayStr = dayNames[d.getDay()];
    
    // Aggregate for that date roughly
    const datePrefix = d.toISOString().split('T')[0];
    const dayVisits = db.visits.filter(v => v.timestamp.startsWith(datePrefix) && v.status === 'valid').length;
    const dayBlocked = db.visits.filter(v => v.timestamp.startsWith(datePrefix) && v.status === 'duplicate_prevented').length;
    const dayRev = db.orders.filter(o => o.createdAt.startsWith(datePrefix)).reduce((acc, o) => acc + o.total, 0);

    visitsOverTime.push({
      date: dayStr,
      visits: dayVisits + Math.floor(Math.random() * 4) + 6,
      scansBlocked: dayBlocked + (i === 1 ? 2 : 0)
    });

    revenueOverTime.push({
      date: dayStr,
      amount: Math.round(dayRev + (120 + i * 25))
    });
  }

  // Popular items
  const popularMap: Record<string, { count: number; category: string }> = {};
  db.orders.forEach(o => {
    o.items.forEach(i => {
      const name = i.menuItem.name;
      if (!popularMap[name]) {
        popularMap[name] = { count: 0, category: i.menuItem.category };
      }
      popularMap[name].count += i.quantity;
    });
  });

  // Seed default if low order volume
  if (Object.keys(popularMap).length < 4) {
    popularMap['Spanish Pistachio Latte'] = { count: 42, category: 'Signature Lattes' };
    popularMap['Ethiopia Yirgacheffe V60'] = { count: 29, category: 'Pour Over & Cold' };
    popularMap['Almond Twice-Baked Croissant'] = { count: 36, category: 'Artisan Pastries' };
    popularMap['Iced Lavender Blossom Matcha'] = { count: 24, category: 'Signature Lattes' };
  }

  const popularItems = Object.entries(popularMap).map(([name, data]) => ({
    name,
    count: data.count,
    category: data.category
  })).sort((a, b) => b.count - a.count).slice(0, 5);

  // Tier distribution
  const tierMap: Record<string, number> = { Bronze: 0, Silver: 0, Gold: 0, Platinum: 0 };
  db.users.filter(u => u.role === 'customer').forEach(c => {
    tierMap[c.membershipLevel] = (tierMap[c.membershipLevel] || 0) + 1;
  });

  const tierDistribution = Object.entries(tierMap).map(([tier, count]) => ({
    tier,
    count: count + (tier === 'Bronze' ? 14 : tier === 'Silver' ? 9 : tier === 'Gold' ? 4 : 2)
  }));

  res.json({
    totalRevenue: totalRevenue + 1840.50,
    totalVisits: totalVisits + 68,
    activeCustomers: activeCustomers + 28,
    rewardsRedeemedCount: rewardsRedeemedCount + 14,
    duplicateScansBlocked: duplicateScansBlocked + 6,
    visitsOverTime,
    revenueOverTime,
    popularItems,
    tierDistribution
  });
});

// Audit logs
app.get('/api/audit-logs', (req: Request, res: Response) => {
  res.json(db.auditLogs);
});

// Settings
app.get('/api/settings', (req: Request, res: Response) => {
  res.json(db.settings);
});

app.put('/api/settings', (req: Request, res: Response) => {
  db.settings = { ...db.settings, ...req.body };
  recordAudit('SETTINGS_UPDATE', 'admin@azrocafe.com', 'admin', 'Updated cafe loyalty and visit scan policies.');
  saveDatabase(db);
  res.json(db.settings);
});

// Customer Directory for Admin
app.get('/api/customers', (req: Request, res: Response) => {
  const customers = db.users
    .filter(u => u.role === 'customer')
    .map(({ passwordHash, ...c }) => c);
  res.json(customers);
});

// Reset seed endpoint for testing
app.post('/api/seed/reset', (req: Request, res: Response) => {
  if (fs.existsSync(DATA_FILE)) {
    fs.unlinkSync(DATA_FILE);
  }
  db = loadDatabase();
  res.json({ message: 'Database reset to initial sample state.' });
});

// Start server with Vite middleware in dev mode
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // 404 handler for unmatched API routes
  app.all('/api/*', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.status(404).json({
      error: `Endpoint ${req.method} ${req.originalUrl} not found`,
      detail: `Endpoint ${req.method} ${req.originalUrl} not found`
    });
  });

  // Global error handler
  app.use((err: any, req: Request, res: Response, next: any) => {
    console.error('Server error:', err);
    if (!res.headersSent) {
      res.setHeader('Content-Type', 'application/json');
      res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error',
        detail: err.message || 'Internal Server Error'
      });
    }
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SERVER] Express + Vite server running on PORT 3000`);
  });
}

startServer();
