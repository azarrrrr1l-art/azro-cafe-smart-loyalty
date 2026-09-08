import React from 'react';
import { Coffee, Clock, CheckCircle2, AlertCircle, Sparkles, MapPin, RefreshCw } from 'lucide-react';
import { Order, OrderStatus } from '../types';

interface OrdersViewProps {
  orders: Order[];
  onRefreshOrders: () => void;
  onNavigateToMenu: () => void;
}

export const OrdersView: React.FC<OrdersViewProps> = ({
  orders,
  onRefreshOrders,
  onNavigateToMenu
}) => {
  const activeOrders = orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled');
  const pastOrders = orders.filter(o => o.status === 'completed' || o.status === 'cancelled');

  const getStatusStep = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return 1;
      case 'brewing': return 2;
      case 'ready': return 3;
      case 'completed': return 4;
      default: return 0;
    }
  };

  return (
    <div className="space-y-8 pb-24">
      {/* Title & Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#29221D] font-['Playfair_Display',serif]">
            Active & Past Orders
          </h1>
          <p className="text-xs sm:text-sm text-stone-600">
            Track real-time extraction, artisan preparation, and table dispatch.
          </p>
        </div>
        <button
          onClick={onRefreshOrders}
          className="p-2.5 rounded-xl bg-white border border-[#EADFCF] text-stone-700 hover:text-stone-900 shadow-2xs hover:bg-[#FAF7F2] transition-colors"
          title="Refresh orders status"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Active Live Orders Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-[#29221D] flex items-center gap-2">
          <Coffee className="w-5 h-5 text-[#D97724]" />
          <span>Active In-Progress Orders ({activeOrders.length})</span>
        </h2>

        {activeOrders.length === 0 ? (
          <div className="p-8 rounded-3xl bg-white border border-[#EADFCF] text-center space-y-3 shadow-xs">
            <Coffee className="w-10 h-10 text-stone-300 mx-auto" />
            <h3 className="font-bold text-sm text-[#29221D]">No active orders right now</h3>
            <p className="text-xs text-stone-500 max-w-xs mx-auto">
              Place an order from our artisan menu and watch its real-time preparation status here.
            </p>
            <button
              onClick={onNavigateToMenu}
              className="px-4 py-2 rounded-xl bg-[#29221D] text-white text-xs font-bold mt-2"
            >
              Order Ahead
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {activeOrders.map(order => {
              const step = getStatusStep(order.status);
              return (
                <div
                  key={order.id}
                  className="rounded-3xl bg-white border-2 border-[#D97724]/40 p-6 shadow-sm space-y-5"
                >
                  {/* Top order summary */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-base font-extrabold text-[#29221D]">
                          {order.orderNumber}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-[#FAF0E6] text-[#A64A00] text-xs font-bold capitalize">
                          {order.orderType === 'dine_in' ? `Dine-in • ${order.tableNumber || 'Table'}` : 'Takeaway'}
                        </span>
                      </div>
                      <span className="text-[11px] text-stone-500">
                        Placed {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-stone-500 block">Total Paid</span>
                      <span className="font-extrabold text-base text-[#29221D]">
                        ${order.total.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Status Progress Stepper */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className={step >= 1 ? 'text-[#D97724]' : 'text-stone-400'}>1. Received</span>
                      <span className={step >= 2 ? 'text-[#D97724]' : 'text-stone-400'}>2. Brewing & Baking</span>
                      <span className={step >= 3 ? 'text-emerald-700' : 'text-stone-400'}>3. Ready for You</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="relative w-full h-2.5 rounded-full bg-stone-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#D97724] to-[#E5A93C] transition-all duration-500"
                        style={{
                          width: step === 1 ? '30%' : step === 2 ? '65%' : '100%'
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-stone-500 pt-0.5">
                      <span>Est. time: ~{order.estimatedMinutes || 5} mins</span>
                      <span className="font-semibold text-stone-700">
                        {order.status === 'brewing' ? 'Barista is currently pulling espresso shots' :
                         order.status === 'ready' ? 'Ready at pickup counter / being served to table' : 'Queued'}
                      </span>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="space-y-2 pt-2 border-t border-stone-100 text-xs">
                    <div className="font-bold text-stone-700">Items:</div>
                    <div className="space-y-1.5">
                      {order.items.map(item => (
                        <div key={item.id} className="flex items-start justify-between text-stone-600">
                          <div>
                            <span className="font-semibold text-[#29221D]">{item.quantity}x {item.menuItem.name}</span>
                            {item.customization && (
                              <span className="text-[11px] text-stone-500 block">
                                {[item.customization.size, item.customization.milk, item.customization.syrup].filter(Boolean).join(' • ')}
                              </span>
                            )}
                          </div>
                          <span className="font-medium">${item.itemTotal.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Past Order Receipts */}
      <div className="space-y-4 pt-6 border-t border-stone-200">
        <h2 className="text-lg font-bold text-[#29221D] flex items-center gap-2">
          <Clock className="w-5 h-5 text-stone-500" />
          <span>Past Order History</span>
        </h2>

        {pastOrders.length === 0 ? (
          <p className="text-xs text-stone-400 py-4">No completed past orders yet.</p>
        ) : (
          <div className="divide-y divide-stone-100 rounded-3xl bg-white border border-[#EADFCF] overflow-hidden">
            {pastOrders.map(order => (
              <div key={order.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-[#29221D]">{order.orderNumber}</span>
                    <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 text-[10px] font-semibold uppercase">
                      {order.status}
                    </span>
                  </div>
                  <p className="text-stone-500">
                    {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {order.items.length} item(s)
                  </p>
                </div>

                <div className="text-right flex sm:flex-col items-center sm:items-end justify-between">
                  <span className="font-bold text-sm text-[#29221D]">${order.total.toFixed(2)}</span>
                  <span className="text-[11px] text-emerald-700 font-semibold">Points credited</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
