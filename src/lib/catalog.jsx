import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase.js';
import { mergePricing } from './config.js';
import * as seed from '../data/seed.js';

const fallback = {
  colors: seed.COLORS, combos: seed.COMBOS, collections: seed.COLLECTIONS, products: seed.PRODUCTS,
  pricing: mergePricing(null), source: 'seed'
};

const CatalogCtx = createContext({ ...fallback, reload: () => {} });

// Reads catalog tables from Supabase when configured; otherwise (or on error) uses the bundled seed.
// `initial` lets the build-time prerender pass catalog data it fetched (see scripts/prerender.mjs).
export function CatalogProvider({ children, initial }) {
  const [data, setData] = useState(initial || fallback);
  const load = useCallback(async () => {
    if (!supabase) return;
    try {
      const [c, k, l, p, s] = await Promise.all([
        supabase.from('colors').select('*').order('sort'),
        supabase.from('combos').select('*').order('sort'),
        supabase.from('collections').select('*').order('sort'),
        supabase.from('products').select('*').eq('published', true).order('sort'),
        supabase.from('settings').select('value').eq('key', 'pricing').maybeSingle()
      ]);
      const err = [c, k, l, p].find(r => r.error);
      if (err) throw err.error;
      if (!p.data.length) return;
      setData({
        colors: c.data, combos: k.data, collections: l.data, products: p.data,
        pricing: mergePricing(s.error ? null : s.data?.value), source: 'supabase'
      });
    } catch (e) {
      console.warn('[awora] Supabase unavailable, using bundled catalog.', e);
    }
  }, []);
  useEffect(() => { load(); }, [load]);
  return <CatalogCtx.Provider value={{ ...data, reload: load }}>{children}</CatalogCtx.Provider>;
}

export const useCatalog = () => useContext(CatalogCtx);
