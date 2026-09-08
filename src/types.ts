export type UserRole = 'customer' | 'admin' | 'staff';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: string;
}

export interface MembershipLevel {
  id: string;
  name: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  minPoints: number;
  perks: string[];
  multiplier: number;
  badgeColor: string;
  cardBgGradient: string;
}

export interface CustomerProfile extends User {
  points: number;
  totalVisits: number;
  lastVisitAt?: string;
  membershipLevel: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  qrSecret: string;
  stampsCount: number; // 0 to 8 stamps for free coffee
}

export interface Visit {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  pointsEarned: number;
  stampsEarned: number;
  timestamp: string;
  qrPayload: string;
  verifiedBy: string; // 'table_qr' | 'counter_staff' | 'dynamic_scanner'
  status: 'valid' | 'duplicate_prevented' | 'rejected';
  rejectionReason?: string;
}

export interface MenuItem {
  id: string;
  name: string;
  category: 'Specialty Espresso' | 'Pour Over & Cold' | 'Signature Lattes' | 'Artisan Pastries' | 'Savory & Brunch';
  description: string;
  price: number;
  calories?: number;
  image: string;
  isPopular?: boolean;
  isSeasonal?: boolean;
  dietary: ('Vegan' | 'Gluten-Free' | 'Dairy-Free' | 'Keto' | 'Contains Nuts')[];
  options?: {
    sizes?: { name: string; priceAdd: number }[];
    milks?: { name: string; priceAdd: number }[];
    syrups?: { name: string; priceAdd: number }[];
  };
  available: boolean;
}

export interface OrderCustomization {
  size?: string;
  milk?: string;
  syrup?: string;
  sweetness?: string;
  notes?: string;
}

export interface CartItem {
  id: string;
  menuItem: MenuItem;
  quantity: number;
  customization?: OrderCustomization;
  itemTotal: number;
}

export type OrderStatus = 'pending' | 'brewing' | 'ready' | 'completed' | 'cancelled';
export type OrderType = 'dine_in' | 'takeaway' | 'table_qr';

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  status: OrderStatus;
  orderType: OrderType;
  tableNumber?: string;
  notes?: string;
  createdAt: string;
  estimatedMinutes?: number;
}

export interface Reward {
  id: string;
  title: string;
  description: string;
  pointsCost: number;
  category: 'Beverage' | 'Bakery' | 'Discount' | 'VIP Experience';
  imageUrl: string;
  terms: string;
  availableCount: number;
  badge?: string;
  requiredVisits: number; // Number of visits required to unlock (e.g. 3, 5, 8, 12)
  rewardValue: number; // Value in ₹ (e.g. 180, 250, 350, 1200)
  validityDays?: number; // Days valid once unlocked (e.g. 30 days)
}

export type RewardStatus = 'Locked' | 'Unlocked' | 'Claimed' | 'Redeemed';

export interface CustomerRewardState {
  id: string;
  customerId: string;
  rewardId: string;
  rewardTitle: string;
  rewardValue: number;
  requiredVisits: number;
  status: RewardStatus;
  unlockedAt?: string;
  expiresAt?: string;
  notificationSent: boolean;
  notificationId?: string;
  claimCode?: string;
}

export type NotificationDeliveryStatus = 'Sent' | 'Delivered' | 'Pending';

export interface RewardNotificationRecord {
  id: string;
  customerId: string;
  customerName: string;
  mobileNumber: string;
  rewardId: string;
  rewardName: string;
  rewardValue: number;
  status: NotificationDeliveryStatus;
  sentAt: string;
  expiryDate: string;
  message: string;
  channel: 'WhatsApp & SMS' | 'WhatsApp' | 'SMS';
}

export interface RewardClaim {
  id: string;
  claimCode: string; // e.g. AZRO-LATTE-4729
  rewardId: string;
  rewardTitle: string;
  pointsSpent: number;
  customerId: string;
  customerName: string;
  claimedAt: string;
  status: 'active' | 'redeemed' | 'expired';
  expiresAt: string;
  redeemedAt?: string;
  redeemedBy?: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'visit' | 'reward' | 'tier' | 'order' | 'promo';
  createdAt: string;
  read: boolean;
  linkAction?: string;
}

export interface Offer {
  id: string;
  title: string;
  code: string;
  discountText: string;
  description: string;
  bannerImage: string;
  expiresAt: string;
  active: boolean;
  tag: string;
}

export interface AuditLog {
  id: string;
  action: string;
  actorEmail: string;
  actorRole: UserRole;
  details: string;
  timestamp: string;
  ip?: string;
}

export interface CafeSettings {
  cafeName: string;
  tagline: string;
  duplicateScanCooldownMinutes: number; // e.g. 60 min
  pointsPerVisit: number; // e.g. 25
  pointsPerDollar: number; // e.g. 10
  welcomeBonusPoints: number; // e.g. 50
  stampsForFreeCoffee: number; // e.g. 8
  currencySymbol: string;
  openingHours: string;
  address: string;
}

export interface AnalyticsSummary {
  totalRevenue: number;
  totalVisits: number;
  activeCustomers: number;
  rewardsRedeemedCount: number;
  duplicateScansBlocked: number;
  visitsOverTime: { date: string; visits: number; scansBlocked: number }[];
  revenueOverTime: { date: string; amount: number }[];
  popularItems: { name: string; count: number; category: string }[];
  tierDistribution: { tier: string; count: number }[];
}
