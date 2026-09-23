/**
 * Shopping cart state.
 *
 * The cart is held in the browser and mirrored into localStorage so it
 * survives a page reload. The figures it shows are an ESTIMATE only: the
 * authoritative price is recomputed by the server at checkout, so a tampered
 * localStorage entry can change what the visitor sees but not what they pay.
 *
 * A reducer is used rather than several pieces of `useState` because every
 * mutation has to be followed by the same "persist to storage" step, and a
 * single switch keeps the transitions in one readable place.
 */
import { createContext, useContext, useEffect, useMemo, useReducer, useCallback } from 'react';

const CART_KEY = 'shopsphere.cart';
const MAX_QTY_PER_ITEM = 10;   // mirrors the server-side rule
const MAX_DISTINCT_ITEMS = 20;

const CartContext = createContext(null);

/** Reads the persisted cart, discarding anything that is not well formed. */
function loadCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((line) => line && typeof line.productId === 'string'
        && Number.isInteger(line.quantity) && line.quantity > 0)
      .slice(0, MAX_DISTINCT_ITEMS)
      .map((line) => ({ ...line, quantity: Math.min(line.quantity, MAX_QTY_PER_ITEM) }));
  } catch {
    // Corrupt or unavailable storage must not stop the app from loading.
    return [];
  }
}

function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD': {
      const { product, quantity } = action;
      const existing = state.find((line) => line.productId === product._id);

      if (existing) {
        const capped = Math.min(existing.quantity + quantity, MAX_QTY_PER_ITEM, product.stockCount);
        return state.map((line) =>
          line.productId === product._id ? { ...line, quantity: capped } : line);
      }
      if (state.length >= MAX_DISTINCT_ITEMS) return state;

      return [...state, {
        productId: product._id,
        title: product.title,
        price: product.price,
        imageUrl: product.imageUrl,
        stockCount: product.stockCount,
        quantity: Math.min(quantity, MAX_QTY_PER_ITEM, product.stockCount),
      }];
    }

    case 'SET_QUANTITY': {
      const quantity = Math.max(1, Math.min(action.quantity, MAX_QTY_PER_ITEM));
      return state.map((line) =>
        line.productId === action.productId ? { ...line, quantity } : line);
    }

    case 'REMOVE':
      return state.filter((line) => line.productId !== action.productId);

    case 'CLEAR':
      return [];

    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const [items, dispatch] = useReducer(cartReducer, undefined, loadCart);

  // Persist on every change so a reload or a second tab picks the cart up.
  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(items));
    } catch {
      /* storage full or unavailable — the cart still works for this session */
    }
  }, [items]);

  const addItem = useCallback((product, quantity = 1) => {
    dispatch({ type: 'ADD', product, quantity });
  }, []);

  const setQuantity = useCallback((productId, quantity) => {
    dispatch({ type: 'SET_QUANTITY', productId, quantity });
  }, []);

  const removeItem = useCallback((productId) => {
    dispatch({ type: 'REMOVE', productId });
  }, []);

  const clearCart = useCallback(() => dispatch({ type: 'CLEAR' }), []);

  const derived = useMemo(() => {
    const itemCount = items.reduce((sum, line) => sum + line.quantity, 0);
    const estimatedTotal = items.reduce((sum, line) => sum + line.price * line.quantity, 0);
    return { itemCount, estimatedTotal };
  }, [items]);

  const value = useMemo(() => ({
    items,
    ...derived,
    addItem,
    setQuantity,
    removeItem,
    clearCart,
    /** The payload shape the checkout API expects. */
    toOrderItems: () => items.map(({ productId, quantity }) => ({ productId, quantity })),
    isInCart: (productId) => items.some((line) => line.productId === productId),
  }), [items, derived, addItem, setQuantity, removeItem, clearCart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used inside a <CartProvider>.');
  return context;
}
