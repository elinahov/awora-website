import { createContext, useContext, useEffect, useState } from 'react';

const KEY = 'awora.cart.v1';
const CartCtx = createContext(null);

const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } };

// Browser cart (localStorage). Items keep their full configuration; checkout sends them to /api/order.
export function CartProvider({ children }) {
  const [items, setItems] = useState(load);
  const [open, setOpen] = useState(false);
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* private mode */ } }, [items]);

  const add = (item) => setItems(list => {
    const same = list.find(i => i.code === item.code);
    if (same) return list.map(i => i === same ? { ...i, qty: i.qty + item.qty } : i);
    return [...list, { ...item, id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}` }];
  });
  const setQty = (id, qty) => setItems(list => list.map(i => i.id === id ? { ...i, qty: Math.max(1, qty) } : i));
  const remove = id => setItems(list => list.filter(i => i.id !== id));
  const clear = () => setItems([]);
  const count = items.reduce((n, i) => n + i.qty, 0);
  const total = items.reduce((n, i) => n + i.qty * i.price, 0);

  return <CartCtx.Provider value={{ items, add, setQty, remove, clear, count, total, open, setOpen }}>{children}</CartCtx.Provider>;
}

export const useCart = () => useContext(CartCtx);
