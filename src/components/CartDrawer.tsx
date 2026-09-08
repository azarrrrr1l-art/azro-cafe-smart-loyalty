import React, { useState } from 'react';
import { X, Trash2, ShoppingBag, ArrowRight, Coffee, Sparkles, MapPin } from 'lucide-react';
import { CartItem, CustomerProfile, OrderType } from '../types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQuantity: (id: string, newQty: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
  currentUser: CustomerProfile | null;
  onCheckout: (orderType: OrderType, tableNumber?: string, notes?: string) => Promise<void>;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  currentUser,
  onCheckout
}) => {
  const [orderType, setOrderType] = useState<OrderType>('dine_in');
  const [tableNumber, setTableNumber] = useState<string>('Table 4');
  const [orderNotes, setOrderNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const subtotal = cart.reduce((sum, item) => sum + item.itemTotal, 0);
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  const pointsToEarn = currentUser
    ? Math.round(total * 10 * (currentUser.membershipLevel === 'Platinum' ? 2.0 : currentUser.membershipLevel === 'Gold' ? 1.5 : currentUser.membershipLevel === 'Silver' ? 1.2 : 1.0))
    : Math.round(total * 10);

  const handlePlaceOrder = async () => {
    if (cart.length === 0 || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onCheckout(orderType, orderType === 'dine_in' ? tableNumber : undefined, orderNotes);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl border-l border-[#EADFCF] flex flex-col justify-between">
          {/* Header */}
          <div className="p-5 border-b border-stone-100 flex items-center justify-between bg-[#FAF7F2]">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#D97724]" />
              <h2 className="text-base font-bold text-[#29221D]">Your Order Ticket</h2>
              <span className="text-xs bg-[#29221D] text-white px-2 py-0.5 rounded-full font-semibold">
                {cart.length}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-stone-200 text-stone-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {cart.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <Coffee className="w-12 h-12 text-stone-300 mx-auto" />
                <h3 className="font-bold text-base text-[#29221D]">Your cart is empty</h3>
                <p className="text-xs text-stone-500 max-w-xs mx-auto">
                  Explore our single-origin roasts, signature lattes, and artisan baked goods to get started.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map(item => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#EADFCF] flex items-start gap-3 justify-between"
                  >
                    <div className="space-y-1 flex-1">
                      <h4 className="font-bold text-sm text-[#29221D]">{item.menuItem.name}</h4>
                      
                      {/* Customization Details */}
                      {item.customization && (
                        <div className="text-[11px] text-stone-500 space-y-0.5">
                          {item.customization.size && <div>• Size: {item.customization.size}</div>}
                          {item.customization.milk && <div>• Milk: {item.customization.milk}</div>}
                          {item.customization.syrup && <div>• Syrup: {item.customization.syrup}</div>}
                          {item.customization.sweetness && <div>• Sweetness: {item.customization.sweetness}</div>}
                          {item.customization.notes && <div>• Note: {item.customization.notes}</div>}
                        </div>
                      )}

                      <span className="text-xs font-extrabold text-[#29221D] block pt-1">
                        ${item.itemTotal.toFixed(2)}
                      </span>
                    </div>

                    {/* Quantity & Delete controls */}
                    <div className="flex flex-col items-end gap-2">
                      <button
                        onClick={() => onRemoveItem(item.id)}
                        className="text-stone-400 hover:text-rose-600 p-1"
                        title="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <div className="flex items-center gap-2 bg-white rounded-xl border border-stone-200 px-2 py-1">
                        <button
                          onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                          className="text-stone-600 hover:text-stone-900 font-bold text-xs"
                        >
                          -
                        </button>
                        <span className="text-xs font-bold text-stone-900 min-w-[14px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                          className="text-stone-600 hover:text-stone-900 font-bold text-xs"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Order Settings (Dine in vs Takeaway) */}
            {cart.length > 0 && (
              <div className="pt-4 border-t border-stone-200 space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-800 uppercase tracking-wider block">
                    Order Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setOrderType('dine_in')}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                        orderType === 'dine_in'
                          ? 'border-[#D97724] bg-[#FAF0E6] text-[#A64A00]'
                          : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                      }`}
                    >
                      Dine-in (Table Service)
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrderType('takeaway')}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                        orderType === 'takeaway'
                          ? 'border-[#D97724] bg-[#FAF0E6] text-[#A64A00]'
                          : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                      }`}
                    >
                      Takeaway / Pickup
                    </button>
                  </div>
                </div>

                {orderType === 'dine_in' && (
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-stone-600 uppercase tracking-wider block">
                      Table Number / Location
                    </label>
                    <input
                      type="text"
                      value={tableNumber}
                      onChange={e => setTableNumber(e.target.value)}
                      placeholder="e.g. Table 4, Patio 2"
                      className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D97724]"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-stone-600 uppercase tracking-wider block">
                    Order Instructions (Optional)
                  </label>
                  <input
                    type="text"
                    value={orderNotes}
                    onChange={e => setOrderNotes(e.target.value)}
                    placeholder="e.g. Bring water glasses, leave bag unsealed..."
                    className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D97724]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer / Checkout */}
          {cart.length > 0 && (
            <div className="p-5 border-t border-stone-100 bg-[#FAF7F2] space-y-3">
              {/* Points Preview */}
              <div className="p-2.5 rounded-xl bg-[#FAF0E6] border border-[#EAC9A8] flex items-center justify-between text-xs text-[#A64A00] font-semibold">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#D97724]" />
                  <span>Loyalty Points You'll Earn:</span>
                </span>
                <span className="font-bold">+{pointsToEarn} pts</span>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-1 text-xs text-stone-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Tax (8%)</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-extrabold text-sm text-[#29221D] pt-1 border-t border-stone-200">
                  <span>Total Due</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                id="cart-checkout-btn"
                onClick={handlePlaceOrder}
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-2xl bg-[#D97724] hover:bg-[#C2651B] active:scale-95 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                <span>{isSubmitting ? 'Placing Order...' : 'Send Order to Barista'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
