import {
  CustomerProfile, MenuItem, Order, Reward, RewardClaim,
  NotificationItem, Offer, MembershipLevel, CafeSettings, AuditLog, AnalyticsSummary, Visit,
  RewardNotificationRecord, CustomerRewardState
} from './types';

// Base API configuration with fallback to relative /api
const envApi = (typeof import.meta !== 'undefined' && (import.meta as any).env)
  ? ((import.meta as any).env.VITE_API_URL || (import.meta as any).env.VITE_API_BASE_URL || (import.meta as any).env.VITE_BACKEND_URL)
  : undefined;

export const API_BASE = (envApi && typeof envApi === 'string' && envApi.trim() !== '')
  ? envApi.trim().replace(/\/+$/, '')
  : '/api';

/**
 * Safe JSON parser that prevents "Unexpected token '<', 'The page c...' is not valid JSON" errors
 * when the server responds with HTML or an unformatted error.
 */
async function parseJsonResponse(res: Response, fallbackError = 'Request failed') {
  const contentType = res.headers.get('content-type') || '';
  let data: any = null;

  if (contentType.includes('application/json')) {
    try {
      data = await res.json();
    } catch {
      data = null;
    }
  }

  if (data === null) {
    try {
      const text = await res.text();
      try {
        data = JSON.parse(text);
      } catch {
        data = { error: text || res.statusText || fallbackError };
      }
    } catch {
      data = { error: fallbackError };
    }
  }

  if (!res.ok) {
    const errorMsg = data?.error || data?.detail || data?.message || `${fallbackError} (${res.status})`;
    throw new Error(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
  }

  return data;
}

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`, {
    headers: { 'Accept': 'application/json' }
  });
  return parseJsonResponse(res, 'Health check failed');
}

export async function loginUser(email: string, password?: string) {
  const payload = {
    email,
    username: email,
    password: password || 'azro123'
  };
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };

  const primaryUrl = `${API_BASE}/auth/login`;
  let res: Response;
  try {
    res = await fetch(primaryUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
  } catch (err) {
    if (API_BASE !== '/api') {
      res = await fetch('/api/auth/login', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
    } else {
      throw err;
    }
  }

  // If 404 returned, attempt fallback endpoints
  if (res.status === 404) {
    const candidates = ['/api/auth/login', '/api/login', '/auth/login', '/login', '/api/auth/jwt/login', '/token'];
    for (const url of candidates) {
      if (url === primaryUrl) continue;
      try {
        const altRes = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        });
        if (altRes.ok) {
          return parseJsonResponse(altRes, 'Failed to sign in');
        }
      } catch {}
    }
  }

  return parseJsonResponse(res, 'Failed to sign in');
}

export async function registerUser(name: string, email: string, phone: string, password?: string) {
  const payload = {
    name,
    fullName: name,
    full_name: name,
    email,
    username: email,
    phone,
    mobile: phone,
    password: password || 'azro123'
  };
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };

  const primaryUrl = `${API_BASE}/auth/register`;
  let res: Response;
  try {
    res = await fetch(primaryUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
  } catch (err) {
    if (API_BASE !== '/api') {
      res = await fetch('/api/auth/register', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
    } else {
      throw err;
    }
  }

  // If 404 returned, attempt fallback endpoints
  if (res.status === 404) {
    const candidates = ['/api/auth/register', '/api/register', '/auth/register', '/register', '/api/users'];
    for (const url of candidates) {
      if (url === primaryUrl) continue;
      try {
        const altRes = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        });
        if (altRes.ok) {
          return parseJsonResponse(altRes, 'Failed to register');
        }
      } catch {}
    }
  }

  return parseJsonResponse(res, 'Failed to register');
}

export async function fetchCurrentUser(token: string) {
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/json'
  };
  let res = await fetch(`${API_BASE}/auth/me`, { headers });
  if (res.status === 404) {
    const candidates = ['/api/auth/me', '/api/me', '/auth/me', '/me', '/api/users/me'];
    for (const url of candidates) {
      if (url === `${API_BASE}/auth/me`) continue;
      try {
        const altRes = await fetch(url, { headers });
        if (altRes.ok) {
          res = altRes;
          break;
        }
      } catch {}
    }
  }
  if (!res.ok) return null;
  const data = await parseJsonResponse(res, 'Failed to fetch user profile');
  return (data.user || data) as CustomerProfile;
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
