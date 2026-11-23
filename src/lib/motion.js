import { useEffect } from 'react';

export const reducedMotion = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
export const isMobile = () => innerWidth < 900;
export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;

// Adds .in to every .reveal / [data-fade] inside the page once it scrolls into view.
export function useReveal(deps = []) {
  useEffect(() => {
    const els = [...document.querySelectorAll('.reveal:not(.in),[data-fade]:not(.in)')];
    if (!('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('in')); return; }
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }),
      { rootMargin: '0px 0px -8% 0px', threshold: .08 });
    els.forEach(e => io.observe(e));
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

// Buttons marked .magnet lean a little toward the pointer (desktop only).
export function useMagnet() {
  useEffect(() => {
    if (reducedMotion() || !matchMedia('(pointer:fine)').matches) return;
    let cur = null;
    const reset = el => { el.style.translate = ''; };
    const move = e => {
      const el = e.target.closest?.('.magnet');
      if (cur && cur !== el) { reset(cur); cur = null; }
      if (!el) return;
      cur = el;
      const r = el.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) / r.width, dy = (e.clientY - (r.top + r.height / 2)) / r.height;
      el.style.translate = `${(dx * 10).toFixed(1)}px ${(dy * 8).toFixed(1)}px`;
    };
    addEventListener('pointermove', move);
    return () => { removeEventListener('pointermove', move); if (cur) reset(cur); };
  }, []);
}
