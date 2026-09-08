import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { MobileNav } from './components/MobileNav';
import { HomeView } from './components/HomeView';
import { MenuView } from './components/MenuView';
import { LoyaltyView } from './components/LoyaltyView';
import { QRScannerModal } from './components/QRScannerModal';
import { RewardsView } from './components/RewardsView';
import { CartDrawer } from './components/CartDrawer';
import { OrdersView } from './components/OrdersView';
import { AdminDashboard } from './components/AdminDashboard';
import { NotificationsDrawer } from './components/NotificationsDrawer';
import { AuthModal } from './components/AuthModal';
import {
  CustomerProfile, MenuItem, CartItem, Order, Reward, Offer,
  MembershipLevel, Visit, NotificationItem, OrderType
} from './types';
import {
  fetchMenu, fetchRewards, fetchOffers, fetchLoyaltyLevels,
  fetchOrders, fetchNotifications, loginUser, registerUser,
  fetchCurrentUser, createOrder, markNotificationRead, markAllNotificationsRead
} from './api';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [currentUser, setCurrentUser] = useState<CustomerProfile | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [levels, setLevels] = useState<MembershipLevel[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);

  // Modals state
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isNotifsOpen, setIsNotifsOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'register'>('login');
  const [selectedItemForModal, setSelectedItemForModal] = useState<MenuItem | null>(null);

  const handleOpenAuth = (mode: 'login' | 'register' = 'login') => {
    setAuthInitialMode(mode);
    setIsAuthOpen(true);
  };

  // Initialize data on mount
  useEffect(() => {
    // Load local stored cart and favorites
    try {
      const savedCart = localStorage.getItem('azro_cart');
      if (savedCart) setCart(JSON.parse(savedCart));

      const savedFavs = localStorage.getItem('azro_favs');
      if (savedFavs) setFavorites(JSON.parse(savedFavs));
    } catch (e) {}

    // Auto-login stored token or default customer for seamless preview
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('azro_token');
      if (storedToken) {
        try {
          const user = await fetchCurrentUser(storedToken);
          if (user) {
            setCurrentUser(user);
            return;
          }
        } catch (e) {}
      }

      // Default demo login as customer Alex Mercer
      try {
        const res = await loginUser('customer@azrocafe.com', 'azro123');
        localStorage.setItem('azro_token', res.token);
        setCurrentUser(res.user);
      } catch (e) {
        console.error('Initial login fallback', e);
      }
    };

    initializeAuth();
    loadAppData();
  }, []);

  // Save cart to local storage
  useEffect(() => {
    try {
      localStorage.setItem('azro_cart', JSON.stringify(cart));
    } catch (e) {}
  }, [cart]);

  // Save favorites to local storage
  useEffect(() => {
    try {
      localStorage.setItem('azro_favs', JSON.stringify(favorites));
    } catch (e) {}
  }, [favorites]);

  // Fetch notifications and orders when currentUser changes
  useEffect(() => {
    if (currentUser) {
      fetchNotifications(currentUser.id)
        .then(setNotifications)
        .catch(console.error);

      fetchOrders(currentUser.role === 'customer' ? currentUser.id : undefined)
        .then(setOrders)
        .catch(console.error);
    }
  }, [currentUser]);

  const loadAppData = async () => {
    try {
      const [menuData, rewardsData, offersData, levelsData, ordersData] = await Promise.all([
        fetchMenu(),
        fetchRewards(),
        fetchOffers(),
        fetchLoyaltyLevels(),
        fetchOrders()
      ]);
      setMenu(menuData);
      setRewards(rewardsData);
      setOffers(offersData);
      setLevels(levelsData);
      setOrders(ordersData);
    } catch (err) {
      console.error('Error fetching cafe data', err);
    }
  };

  // Auth actions
  const handleLogin = async (email: string, pass: string) => {
    const res = await loginUser(email, pass);
    if (res.token) {
      localStorage.setItem('azro_token', res.token);
    }
    if (res.user) {
      setCurrentUser(res.user);
      if (res.user.role === 'admin') {
        setCurrentTab('admin');
      } else {
        setCurrentTab('loyalty');
      }
      await loadAppData();
    }
  };

  const handleRegister = async (name: string, email: string, phone: string, pass: string) => {
    const res = await registerUser(name, email, phone, pass);
    if (res.token) {
      localStorage.setItem('azro_token', res.token);
    }
    if (res.user) {
      setCurrentUser(res.user);
      setCurrentTab('loyalty');
      await loadAppData();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('azro_token');
    setCurrentUser(null);
    setCurrentTab('home');
    setAuthInitialMode('login');
    setIsAuthOpen(true);
  };

  // Cart actions
  const handleAddToCart = (cartItem: CartItem) => {
    setCart(prev => {
      // Check if identical item with same customizations exists
      const existingIdx = prev.findIndex(i =>
        i.menuItem.id === cartItem.menuItem.id &&
        i.customization?.size === cartItem.customization?.size &&
        i.customization?.milk === cartItem.customization?.milk &&
        i.customization?.syrup === cartItem.customization?.syrup &&
        i.customization?.sweetness === cartItem.customization?.sweetness
      );

      if (existingIdx > -1) {
        const updated = [...prev];
        updated[existingIdx].quantity += cartItem.quantity;
        updated[existingIdx].itemTotal += cartItem.itemTotal;
        return updated;
      }
      return [...prev, cartItem];
    });
    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (id: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveFromCart(id);
      return;
    }
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const unitPrice = item.itemTotal / item.quantity;
        return { ...item, quantity: newQty, itemTotal: unitPrice * newQty };
      }
      return item;
    }));
  };

  const handleRemoveFromCart = (id: string) => {
    setCart(prev => prev.filter(i => i.id !== id));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  // Favorites toggle
  const handleToggleFavorite = (id: string) => {
    setFavorites(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Checkout order placement
  const handleCheckout = async (orderType: OrderType, tableNumber?: string, notes?: string) => {
    const orderData = {
      customerId: currentUser ? currentUser.id : undefined,
      items: cart,
      orderType,
      tableNumber,
      notes
    };

    const newOrder = await createOrder(orderData);
    setCart([]);
    setOrders(prev => [newOrder, ...prev]);
    setCurrentTab('orders');

    // Refresh notifications and user points
    if (currentUser) {
      const updatedNotifs = await fetchNotifications(currentUser.id);
      setNotifications(updatedNotifs);
      const updatedUser = await fetchCurrentUser(localStorage.getItem('azro_token') || '');
      if (updatedUser) setCurrentUser(updatedUser);
    }
  };

  // Visit scan callback
  const handleVisitSuccess = (res: any) => {
    if (res.customer) {
      setCurrentUser(res.customer);
    } else if (currentUser && res.pointsAwarded) {
      setCurrentUser({
        ...currentUser,
        points: currentUser.points + res.pointsAwarded,
        stampsCount: res.stampsCount ?? (currentUser.stampsCount + 1),
        totalVisits: currentUser.totalVisits + 1,
        membershipLevel: res.membershipLevel ?? currentUser.membershipLevel
      });
    }

    if (res.visit) {
      setVisits(prev => [res.visit, ...prev]);
    }

    if (currentUser) {
      fetchNotifications(currentUser.id)
        .then(setNotifications)
        .catch(console.error);
    }
  };

  // Points updated from reward claim
  const handlePointsUpdated = (newPoints: number) => {
    if (currentUser) {
      setCurrentUser({ ...currentUser, points: newPoints });
      fetchNotifications(currentUser.id)
        .then(setNotifications)
        .catch(console.error);
    }
  };

  // Notifications handlers
  const handleMarkNotifRead = async (id: string) => {
    await markNotificationRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleMarkAllNotifsRead = async () => {
    if (!currentUser) return;
    await markAllNotificationsRead(currentUser.id);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const cartItemsCount = cart.reduce((sum, i) => sum + i.quantity, 0);
  const unreadNotifsCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2] text-[#29221D]">
      {/* Top Desktop Navigation */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        currentUser={currentUser}
        onOpenAuth={handleOpenAuth}
        onOpenQR={() => setIsQRModalOpen(true)}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenNotifs={() => setIsNotifsOpen(true)}
        cartCount={cartItemsCount}
        unreadNotifsCount={unreadNotifsCount}
        onLogout={handleLogout}
      />

      {/* Main App Content View Switcher */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {currentTab === 'home' && (
          <HomeView
            currentUser={currentUser}
            popularItems={menu}
            offers={offers}
            onOpenQR={() => setIsQRModalOpen(true)}
            onNavigateTab={setCurrentTab}
            onQuickAddToCart={(item) => {
              handleAddToCart({
                id: `cart-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                menuItem: item,
                quantity: 1,
                itemTotal: item.price
              });
            }}
            onSelectItemToCustomize={(item) => setSelectedItemForModal(item)}
          />
        )}

        {currentTab === 'menu' && (
          <MenuView
            menu={menu}
            onAddToCart={handleAddToCart}
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
            selectedItemForModal={selectedItemForModal}
            setSelectedItemForModal={setSelectedItemForModal}
          />
        )}

        {currentTab === 'loyalty' && (
          <LoyaltyView
            currentUser={currentUser}
            levels={levels}
            visits={visits}
            onOpenQR={() => setIsQRModalOpen(true)}
            onOpenAuth={handleOpenAuth}
            onClaimFreeCoffeeStampReward={() => setCurrentTab('rewards')}
          />
        )}

        {currentTab === 'rewards' && (
          <RewardsView
            currentUser={currentUser}
            rewards={rewards}
            onOpenAuth={() => handleOpenAuth('login')}
            onPointsUpdated={handlePointsUpdated}
          />
        )}

        {currentTab === 'orders' && (
          <OrdersView
            orders={orders}
            onRefreshOrders={() => {
              fetchOrders(currentUser?.role === 'customer' ? currentUser.id : undefined)
                .then(setOrders)
                .catch(console.error);
            }}
            onNavigateToMenu={() => setCurrentTab('menu')}
          />
        )}

        {currentTab === 'admin' && (
          <AdminDashboard
            currentUser={currentUser}
            onNavigateHome={() => setCurrentTab('home')}
          />
        )}
      </main>

      {/* Footer info */}
      <footer className="border-t border-[#EADFCF] bg-[#FAF7F2] py-8 text-xs text-stone-500 text-center pb-24 md:pb-8">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p className="font-bold text-[#29221D]">AZRO CAFÉ • Specialty Coffee Roasters & Gathering House</p>
          <p>Single Origin Beans • Dynamic QR Loyalty Engine • Real-Time Barista Queue</p>
          <p className="text-[11px] text-stone-400">© 2026 AZRO CAFE. All rights reserved.</p>
        </div>
      </footer>

      {/* Mobile Bottom Navigation Bar */}
      <MobileNav
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenQR={() => setIsQRModalOpen(true)}
        currentUser={currentUser}
        cartCount={cartItemsCount}
      />

      {/* Modals & Slide-overs */}
      <QRScannerModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        currentUser={currentUser}
        onVisitSuccess={handleVisitSuccess}
        onOpenAuth={() => {
          setIsQRModalOpen(false);
          handleOpenAuth('login');
        }}
      />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveFromCart}
        onClearCart={handleClearCart}
        currentUser={currentUser}
        onCheckout={handleCheckout}
      />

      <NotificationsDrawer
        isOpen={isNotifsOpen}
        onClose={() => setIsNotifsOpen(false)}
        notifications={notifications}
        onMarkRead={handleMarkNotifRead}
        onMarkAllRead={handleMarkAllNotifsRead}
      />

      <AuthModal
        isOpen={isAuthOpen}
        initialMode={authInitialMode}
        onClose={() => setIsAuthOpen(false)}
        onLogin={handleLogin}
        onRegister={handleRegister}
      />
    </div>
  );
}
