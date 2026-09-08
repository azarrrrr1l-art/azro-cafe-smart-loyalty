import {
  CustomerProfile, MenuItem, Order, Reward, RewardClaim,
  NotificationItem, Offer, MembershipLevel, CafeSettings, AuditLog, AnalyticsSummary, Visit,
  RewardNotificationRecord, CustomerRewardState
} from './types';

export const API_BASE = '/api';

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`);
  return res.json();
}

export async function loginUser(email: string, password?: string) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: password || 'azro123' })
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to login');
  }
  return res.json();
}

export async function registerUser(name: string, email: string, phone: string, password?: string) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, phone, password: password || 'azro123' })
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to register');
  }
  return res.json();
}

export async function fetchCurrentUser(token: string) {
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.user as CustomerProfile;
}

export async function fetchMenu(): Promise<MenuItem[]> {
  const res = await fetch(`${API_BASE}/menu`);
  return res.json();
}

export async function addMenuItem(item: Partial<MenuItem>): Promise<MenuItem> {
  const res = await fetch(`${API_BASE}/menu`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item)
  });
  return res.json();
}

export async function updateMenuItem(id: string, updates: Partial<MenuItem>): Promise<MenuItem> {
  const res = await fetch(`${API_BASE}/menu/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });
  return res.json();
}

export async function deleteMenuItem(id: string) {
  const res = await fetch(`${API_BASE}/menu/${id}`, { method: 'DELETE' });
  return res.json();
}

export async function scanVisit(
  customerId?: string,
  qrPayload?: string,
  verifiedBy = 'table_qr',
  customerEmail?: string,
  customerPhone?: string
): Promise<{
  success: boolean;
  cooldown?: boolean;
  minutesRemaining?: number;
  message?: string;
  pointsAwarded?: number;
  customer?: CustomerProfile;
  visit?: Visit;
  stampsCount?: number;
  tierUpgraded?: boolean;
  newlyUnlocked?: any[];
  sentNotifications?: any[];
}> {
  const res = await fetch(`${API_BASE}/visits/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customerId, qrPayload, verifiedBy, customerEmail, customerPhone })
  });
  const data = await res.json();
  if (!res.ok && res.status !== 429) {
    throw new Error(data.error || 'Failed to record visit');
  }
  return data;
}

export async function fetchLoyaltyProgress(customerId: string) {
  const res = await fetch(`${API_BASE}/loyalty/progress/${customerId}`);
  return res.json();
}

export async function fetchLoyaltyLevels(): Promise<MembershipLevel[]> {
  const res = await fetch(`${API_BASE}/loyalty/levels`);
  return res.json();
}

export async function fetchRewards(): Promise<Reward[]> {
  const res = await fetch(`${API_BASE}/rewards`);
  return res.json();
}

export async function claimReward(customerId: string, rewardId: string): Promise<{ success: boolean; claim: RewardClaim; remainingPoints: number }> {
  const res = await fetch(`${API_BASE}/rewards/claim`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customerId, rewardId })
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to claim reward');
  }
  return data;
}

export async function fetchMyClaims(customerId: string): Promise<RewardClaim[]> {
  const res = await fetch(`${API_BASE}/rewards/my-claims/${customerId}`);
  return res.json();
}

export async function verifyClaimCode(claimCode: string, staffEmail = 'staff@azrocafe.com'): Promise<{ success: boolean; message: string; claim: RewardClaim }> {
  const res = await fetch(`${API_BASE}/rewards/verify-claim`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ claimCode, staffEmail })
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to verify claim code');
  }
  return data;
}

export async function fetchOrders(customerId?: string): Promise<Order[]> {
  const url = customerId ? `${API_BASE}/orders?customerId=${customerId}` : `${API_BASE}/orders`;
  const res = await fetch(url);
  return res.json();
}

export async function createOrder(orderData: any): Promise<Order> {
  const res = await fetch(`${API_BASE}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData)
  });
  return res.json();
}

export async function updateOrderStatus(orderId: string, status: string): Promise<Order> {
  const res = await fetch(`${API_BASE}/orders/${orderId}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  return res.json();
}

export async function fetchNotifications(userId: string): Promise<NotificationItem[]> {
  const res = await fetch(`${API_BASE}/notifications/${userId}`);
  return res.json();
}

export async function markNotificationRead(id: string) {
  const res = await fetch(`${API_BASE}/notifications/${id}/read`, { method: 'PUT' });
  return res.json();
}

export async function markAllNotificationsRead(userId: string) {
  const res = await fetch(`${API_BASE}/notifications/mark-all-read/${userId}`, { method: 'PUT' });
  return res.json();
}

export async function fetchOffers(): Promise<Offer[]> {
  const res = await fetch(`${API_BASE}/offers`);
  return res.json();
}

export async function fetchAnalytics(): Promise<AnalyticsSummary> {
  const res = await fetch(`${API_BASE}/analytics`);
  return res.json();
}

export async function fetchAuditLogs(): Promise<AuditLog[]> {
  const res = await fetch(`${API_BASE}/audit-logs`);
  return res.json();
}

export async function fetchSettings(): Promise<CafeSettings> {
  const res = await fetch(`${API_BASE}/settings`);
  return res.json();
}

export async function updateSettings(settings: Partial<CafeSettings>): Promise<CafeSettings> {
  const res = await fetch(`${API_BASE}/settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings)
  });
  return res.json();
}

export async function fetchCustomers(): Promise<CustomerProfile[]> {
  const res = await fetch(`${API_BASE}/customers`);
  return res.json();
}

export async function resetSeedData() {
  const res = await fetch(`${API_BASE}/seed/reset`, { method: 'POST' });
  return res.json();
}

// Reward Notifications API
export async function fetchRewardNotifications(params?: {
  customerId?: string;
  search?: string;
  status?: string;
}): Promise<RewardNotificationRecord[]> {
  const query = new URLSearchParams();
  if (params?.customerId) query.set('customerId', params.customerId);
  if (params?.search) query.set('search', params.search);
  if (params?.status) query.set('status', params.status);
  const res = await fetch(`${API_BASE}/reward-notifications?${query.toString()}`);
  return res.json();
}

export async function fetchCustomerRewards(customerId: string): Promise<any[]> {
  const res = await fetch(`${API_BASE}/customer-rewards/${customerId}`);
  return res.json();
}

export async function sendTestRewardNotification(data: {
  customerName?: string;
  mobileNumber?: string;
  rewardTitle?: string;
  rewardValue?: number;
  customerId?: string;
  rewardId?: string;
}): Promise<{ success: boolean; notification: RewardNotificationRecord }> {
  const res = await fetch(`${API_BASE}/reward-notifications/test`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function resendRewardNotification(id: string): Promise<{ success: boolean; notification: RewardNotificationRecord }> {
  const res = await fetch(`${API_BASE}/reward-notifications/resend/${id}`, {
    method: 'POST'
  });
  return res.json();
}
