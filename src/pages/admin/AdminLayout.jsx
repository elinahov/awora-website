import { Navigate, NavLink, Outlet } from 'react-router-dom';
import { useT } from '../../i18n.jsx';
import { useAuth } from '../../lib/auth.jsx';

// /:lang/admin — only for users listed in the `admins` table (RLS enforces this on every write too).
export default function AdminLayout() {
  const t = useT();
  const auth = useAuth();

  let body;
  if (!auth.available) body = <p className="lede">Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to use the admin panel.</p>;
  else if (!auth.ready || (auth.user && !auth.roleReady)) body = <p className="small">Loading…</p>;
  else if (!auth.user) return <Navigate to={t.path('/account')} replace />;
  else if (!auth.isAdmin) body = <p className="lede">This account ({auth.user.email}) doesn't have admin access.</p>;
  else body = (
    <>
      <nav className="admin__tabs" aria-label="Admin">
        {[['orders', 'Orders'], ['products', 'Products'], ['collections', 'Collections'], ['palette', 'Colors & combos'], ['prices', 'Prices']]
          .map(([to, label]) => <NavLink key={to} to={to}>{label}</NavLink>)}
      </nav>
      <Outlet />
    </>
  );

  return (
    <section className="page-pad admin" lang="en">
      <div className="wrap">
        <div className="admin__head">
          <h1 className="h2">Admin</h1>
          {auth.user && <span className="small">{auth.user.email}</span>}
        </div>
        {body}
      </div>
    </section>
  );
}
