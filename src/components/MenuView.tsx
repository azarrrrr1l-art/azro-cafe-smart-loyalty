import React, { useState, useMemo } from 'react';
import { Search, Heart, SlidersHorizontal, Plus, Check, Sparkles, X, Coffee } from 'lucide-react';
import { MenuItem, CartItem } from '../types';

interface MenuViewProps {
  menu: MenuItem[];
  onAddToCart: (cartItem: CartItem) => void;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  selectedItemForModal: MenuItem | null;
  setSelectedItemForModal: (item: MenuItem | null) => void;
}

export const MenuView: React.FC<MenuViewProps> = ({
  menu,
  onAddToCart,
  favorites,
  onToggleFavorite,
  selectedItemForModal,
  setSelectedItemForModal
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDietary, setSelectedDietary] = useState<string>('All');

  // Customization modal local state
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedMilk, setSelectedMilk] = useState<string>('');
  const [selectedSyrup, setSelectedSyrup] = useState<string>('');
  const [sweetnessLevel, setSweetnessLevel] = useState<string>('100% Regular');
  const [specialNotes, setSpecialNotes] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);

  const categories = [
    'All',
    'Specialty Espresso',
    'Pour Over & Cold',
    'Signature Lattes',
    'Artisan Pastries',
    'Savory & Brunch'
  ];

  const dietaryOptions = ['All', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Contains Nuts'];

  const filteredMenu = useMemo(() => {
    return menu.filter(item => {
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDietary = selectedDietary === 'All' || item.dietary.includes(selectedDietary as any);
      return matchesCategory && matchesSearch && matchesDietary;
    });
  }, [menu, selectedCategory, searchQuery, selectedDietary]);

  const handleOpenCustomize = (item: MenuItem) => {
    setSelectedItemForModal(item);
    setSelectedSize(item.options?.sizes?.[0]?.name || '');
    setSelectedMilk(item.options?.milks?.[0]?.name || '');
    setSelectedSyrup(item.options?.syrups?.[0]?.name || '');
    setSweetnessLevel('100% Regular');
    setSpecialNotes('');
    setQuantity(1);
  };

  const calculateModalPrice = () => {
    if (!selectedItemForModal) return 0;
    let base = selectedItemForModal.price;
    if (selectedItemForModal.options?.sizes) {
      const sizeObj = selectedItemForModal.options.sizes.find(s => s.name === selectedSize);
      if (sizeObj) base += sizeObj.priceAdd;
    }
    if (selectedItemForModal.options?.milks) {
      const milkObj = selectedItemForModal.options.milks.find(m => m.name === selectedMilk);
      if (milkObj) base += milkObj.priceAdd;
    }
    if (selectedItemForModal.options?.syrups) {
      const syrupObj = selectedItemForModal.options.syrups.find(s => s.name === selectedSyrup);
      if (syrupObj) base += syrupObj.priceAdd;
    }
    return base * quantity;
  };

  const handleConfirmCustomize = () => {
    if (!selectedItemForModal) return;
    const itemTotal = calculateModalPrice();
    const cartItem: CartItem = {
      id: `cart-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      menuItem: selectedItemForModal,
      quantity,
      customization: {
        size: selectedSize || undefined,
        milk: selectedMilk || undefined,
        syrup: selectedSyrup || undefined,
        sweetness: sweetnessLevel,
        notes: specialNotes.trim() || undefined
      },
      itemTotal
    };
    onAddToCart(cartItem);
    setSelectedItemForModal(null);
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#29221D] font-['Playfair_Display',serif]">
            Artisan Cafe Menu
          </h1>
          <p className="text-xs sm:text-sm text-stone-600">
            Carefully crafted single origin extractions, organic house milks, and fresh daily bakes.
          </p>
        </div>

        {/* Search input */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            id="menu-search-input"
            type="text"
            placeholder="Search roasts, drinks, bakes..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-white border border-[#EADFCF] text-xs sm:text-sm text-[#29221D] placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#D97724] shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Category Pills Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map(cat => {
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              id={`cat-pill-${cat.replace(/\s+/g, '-').toLowerCase()}`}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-[#29221D] text-[#FAF7F2] shadow-sm scale-102'
                  : 'bg-white text-stone-700 hover:bg-[#EFE6DA] border border-[#EADFCF]'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Dietary Sub-Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-stone-500 font-semibold flex items-center gap-1 shrink-0">
          <SlidersHorizontal className="w-3 h-3" /> Dietary:
        </span>
        {dietaryOptions.map(diet => (
          <button
            key={diet}
            onClick={() => setSelectedDietary(diet)}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-medium transition-colors ${
              selectedDietary === diet
                ? 'bg-[#E5A93C] text-[#29221D] font-bold shadow-2xs'
                : 'bg-[#FAF7F2] text-stone-600 hover:bg-[#EFE6DA] border border-[#E0D2C0]'
            }`}
          >
            {diet}
          </button>
        ))}
      </div>

      {/* Menu Grid */}
      {filteredMenu.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-[#EADFCF] p-8">
          <Coffee className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <h3 className="font-bold text-base text-[#29221D]">No items matched your filter</h3>
          <p className="text-xs text-stone-500 mt-1">Try resetting your search query or dietary filters.</p>
          <button
            onClick={() => {
              setSelectedCategory('All');
              setSelectedDietary('All');
              setSearchQuery('');
            }}
            className="mt-4 px-4 py-2 rounded-xl bg-[#29221D] text-white text-xs font-bold"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredMenu.map(item => {
            const isFav = favorites.includes(item.id);
            return (
              <div
                key={item.id}
                className="group flex flex-col justify-between rounded-3xl bg-white border border-[#EADFCF] overflow-hidden shadow-xs hover:shadow-md transition-all duration-200"
              >
                {/* Image Section */}
                <div className="relative aspect-[16/11] overflow-hidden bg-stone-100">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  {/* Category badge */}
                  <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-[#29221D]/80 backdrop-blur-xs text-white text-[10px] font-bold">
                    {item.category}
                  </span>

                  {/* Favorite button */}
                  <button
                    id={`fav-btn-${item.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(item.id);
                    }}
                    className="absolute top-2.5 right-2.5 p-2 rounded-full bg-white/90 backdrop-blur-xs text-stone-700 hover:text-rose-600 transition-colors shadow-xs"
                    title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
                  </button>

                  {/* Price Tag */}
                  <span className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-xl bg-white/95 backdrop-blur-xs text-[#29221D] text-xs font-extrabold shadow-xs">
                    ${item.price.toFixed(2)}
                  </span>
                </div>

                {/* Details Section */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-sm text-[#29221D] group-hover:text-[#D97724] transition-colors line-clamp-1">
                        {item.name}
                      </h3>
                      {item.calories && (
                        <span className="text-[10px] text-stone-400 shrink-0 font-medium">
                          {item.calories} kcal
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>

                    {/* Dietary badges */}
                    {item.dietary.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {item.dietary.map(d => (
                          <span
                            key={d}
                            className="px-1.5 py-0.5 rounded-md bg-[#FAF7F2] text-[#6E5D52] text-[9px] font-semibold border border-[#E8DEC8]"
                          >
                            {d}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
                    <button
                      id={`menu-customize-${item.id}`}
                      onClick={() => handleOpenCustomize(item)}
                      className="flex-1 py-2 px-2.5 rounded-xl text-xs font-bold text-[#29221D] bg-[#FAF7F2] hover:bg-[#EFE6DA] border border-[#EADFCF] transition-colors text-center"
                    >
                      {item.options ? 'Customize' : 'Options'}
                    </button>
                    <button
                      id={`menu-quick-add-${item.id}`}
                      onClick={() => {
                        const defaultCartItem: CartItem = {
                          id: `cart-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                          menuItem: item,
                          quantity: 1,
                          customization: item.options?.sizes ? { size: item.options.sizes[0].name } : undefined,
                          itemTotal: item.price
                        };
                        onAddToCart(defaultCartItem);
                      }}
                      className="py-2 px-3.5 rounded-xl text-xs font-bold text-white bg-[#29221D] hover:bg-[#D97724] transition-colors flex items-center gap-1 shadow-xs"
                      title="Quick Add to Cart"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Customization Modal */}
      {selectedItemForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#EADFCF] overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="relative p-5 border-b border-stone-100 flex items-center justify-between bg-[#FAF7F2]">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#A64A00] tracking-wider">
                  Barista Customization
                </span>
                <h3 className="font-bold text-lg text-[#29221D]">
                  {selectedItemForModal.name}
                </h3>
              </div>
              <button
                id="modal-close-btn"
                onClick={() => setSelectedItemForModal(null)}
                className="p-2 rounded-full hover:bg-stone-200 text-stone-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-5 overflow-y-auto flex-1">
              {/* Size selector if available */}
              {selectedItemForModal.options?.sizes && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-stone-800 uppercase tracking-wider block">
                    Choose Size
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedItemForModal.options.sizes.map(size => {
                      const isSel = selectedSize === size.name;
                      return (
                        <button
                          key={size.name}
                          type="button"
                          onClick={() => setSelectedSize(size.name)}
                          className={`p-3 rounded-2xl border text-left transition-all ${
                            isSel
                              ? 'border-[#D97724] bg-[#FAF0E6] text-[#29221D] font-bold shadow-xs'
                              : 'border-stone-200 hover:border-stone-300 text-stone-700'
                          }`}
                        >
                          <div className="text-xs">{size.name}</div>
                          <div className="text-[11px] text-stone-500 mt-0.5">
                            {size.priceAdd > 0 ? `+$${size.priceAdd.toFixed(2)}` : 'Included'}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Milk selector if available */}
              {selectedItemForModal.options?.milks && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-stone-800 uppercase tracking-wider block">
                    Choice of Milk
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedItemForModal.options.milks.map(milk => {
                      const isSel = selectedMilk === milk.name;
                      return (
                        <button
                          key={milk.name}
                          type="button"
                          onClick={() => setSelectedMilk(milk.name)}
                          className={`p-2.5 rounded-2xl border text-center transition-all ${
                            isSel
                              ? 'border-[#D97724] bg-[#FAF0E6] text-[#29221D] font-bold shadow-xs'
                              : 'border-stone-200 hover:border-stone-300 text-stone-700'
                          }`}
                        >
                          <div className="text-xs">{milk.name}</div>
                          <div className="text-[10px] text-stone-500 mt-0.5">
                            {milk.priceAdd > 0 ? `+$${milk.priceAdd.toFixed(2)}` : 'Standard'}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Syrup & Flavor if available */}
              {selectedItemForModal.options?.syrups && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-stone-800 uppercase tracking-wider block">
                    Syrup & Infusion
                  </label>
                  <div className="space-y-2">
                    {selectedItemForModal.options.syrups.map(s => {
                      const isSel = selectedSyrup === s.name;
                      return (
                        <button
                          key={s.name}
                          type="button"
                          onClick={() => setSelectedSyrup(s.name)}
                          className={`w-full p-2.5 rounded-2xl border text-left flex items-center justify-between transition-all ${
                            isSel
                              ? 'border-[#D97724] bg-[#FAF0E6] text-[#29221D] font-bold shadow-xs'
                              : 'border-stone-200 hover:border-stone-300 text-stone-700'
                          }`}
                        >
                          <span className="text-xs">{s.name}</span>
                          <span className="text-[11px] text-stone-500 font-normal">
                            {s.priceAdd > 0 ? `+$${s.priceAdd.toFixed(2)}` : 'Free'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Sweetness Preference */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-800 uppercase tracking-wider block">
                  Sweetness Level
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {['0% Unsweetened', '50% Half Sweet', '100% Regular', '125% Extra Sweet'].map(sweet => (
                    <button
                      key={sweet}
                      type="button"
                      onClick={() => setSweetnessLevel(sweet)}
                      className={`p-2 rounded-xl text-center text-xs transition-all ${
                        sweetnessLevel === sweet
                          ? 'bg-[#29221D] text-white font-bold'
                          : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                      }`}
                    >
                      {sweet.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Special Instructions */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-800 uppercase tracking-wider block">
                  Special Notes for Barista
                </label>
                <input
                  type="text"
                  placeholder="e.g. Extra hot, double cupped, cinnamon dust..."
                  value={specialNotes}
                  onChange={e => setSpecialNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-xs text-[#29221D] placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#D97724]"
                />
              </div>

              {/* Quantity Counter */}
              <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                <span className="text-xs font-bold text-stone-800 uppercase tracking-wider">Quantity</span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 h-8 rounded-full bg-stone-100 text-stone-800 font-bold hover:bg-stone-200 flex items-center justify-center"
                  >
                    -
                  </button>
                  <span className="font-bold text-sm text-[#29221D] min-w-[20px] text-center">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-8 h-8 rounded-full bg-stone-100 text-stone-800 font-bold hover:bg-stone-200 flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-stone-100 bg-[#FAF7F2] flex items-center justify-between">
              <div>
                <span className="text-[10px] text-stone-500 uppercase font-semibold block">Total Price</span>
                <span className="text-xl font-extrabold text-[#29221D]">
                  ${calculateModalPrice().toFixed(2)}
                </span>
              </div>
              <button
                id="modal-add-to-cart-btn"
                onClick={handleConfirmCustomize}
                className="px-6 py-3 rounded-2xl bg-[#D97724] hover:bg-[#C2651B] text-white font-bold text-sm shadow-md active:scale-95 transition-all flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Add to Order</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
