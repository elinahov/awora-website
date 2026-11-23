import { useEffect } from 'react';
import { Navigate, Outlet, Route, Routes, useLocation, useParams } from 'react-router-dom';
import { DEFAULT_LANG, LANGS, LangProvider, translate } from './i18n.jsx';
import Nav from './components/Nav.jsx';
import Footer from './components/Footer.jsx';
import CartDrawer from './components/CartDrawer.jsx';
import Home from './pages/Home.jsx';
import Catalog from './pages/Catalog.jsx';
import Product from './pages/Product.jsx';
import Guide from './pages/Guide.jsx';
import NotFound from './pages/NotFound.jsx';
import Account from './pages/Account.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import Checkout from './pages/Checkout.jsx';
import AdminLayout from './pages/admin/AdminLayout.jsx';
import Orders from './pages/admin/Orders.jsx';
import OrderDetail from './pages/admin/OrderDetail.jsx';
import Products from './pages/admin/Products.jsx';
import ProductEdit from './pages/admin/ProductEdit.jsx';
import Collections from './pages/admin/Collections.jsx';
import Palette from './pages/admin/Palette.jsx';
import Prices from './pages/admin/Prices.jsx';
import { useMagnet } from './lib/motion.js';

const preferredLang = () => {
  try { const s = localStorage.getItem('awora.lang'); if (LANGS.includes(s)) return s; } catch { /* ignore */ }
  return DEFAULT_LANG;
};

function LangLayout() {
  const { lang } = useParams();
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!LANGS.includes(lang)) return;
    document.documentElement.lang = lang;
    document.title = translate(lang, 'meta.title');
    document.querySelector('meta[name="description"]')?.setAttribute('content', translate(lang, 'meta.desc'));
    try { localStorage.setItem('awora.lang', lang); } catch { /* ignore */ }
  }, [lang]);
  // new page → top; in-page hash → that section (below the fixed nav)
  useEffect(() => {
    if (!hash) { window.scrollTo(0, 0); return; }
    const go = () => { const el = document.getElementById(hash.slice(1)); if (el) window.scrollTo(0, el.getBoundingClientRect().top + scrollY - 72); };
    requestAnimationFrame(go); const t = setTimeout(go, 400); return () => clearTimeout(t);
  }, [pathname, hash]);
  useMagnet();
  if (!LANGS.includes(lang)) return <Navigate to={`/${preferredLang()}${pathname}`} replace />;
  return (
    <LangProvider lang={lang}>
      <Nav />
      <main id="main"><Outlet /></main>
      <Footer />
      <CartDrawer />
      <div className="frame" aria-hidden="true" />
    </LangProvider>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to={`/${preferredLang()}`} replace />} />
      <Route path="/:lang" element={<LangLayout />}>
        <Route index element={<Home />} />
        <Route path="catalog" element={<Catalog />} />
        <Route path="product/:slug" element={<Product />} />
        <Route path="guide" element={<Guide />} />
        <Route path="account" element={<Account />} />
        <Route path="account/reset" element={<ResetPassword />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="orders" replace />} />
          <Route path="orders" element={<Orders />} />
          <Route path="orders/:id" element={<OrderDetail />} />
          <Route path="products" element={<Products />} />
          <Route path="products/:slug" element={<ProductEdit />} />
          <Route path="collections" element={<Collections />} />
          <Route path="palette" element={<Palette />} />
          <Route path="prices" element={<Prices />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
