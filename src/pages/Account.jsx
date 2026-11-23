import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useT } from '../i18n.jsx';
import { useAuth } from '../lib/auth.jsx';
import { supabase } from '../lib/supabase.js';
import { formatAMD } from '../lib/config.js';
import { Input, Msg } from '../components/Form.jsx';

export const authError = (t, error) => {
  const m = (error?.message || '').toLowerCase();
  if (m.includes('invalid login')) return t('auth.err.invalid');
  if (m.includes('not confirmed')) return t('auth.err.confirm');
  if (m.includes('password') && (m.includes('6') || m.includes('8') || m.includes('short'))) return t('auth.err.short');
  return error?.message || t('auth.err.generic');
};

function AuthForms() {
  const t = useT();
  const auth = useAuth();
  const [mode, setMode] = useState('in'); // in | up | forgot
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [info, setInfo] = useState('');
  const go = m => { setMode(m); setErr(''); setInfo(''); };

  const submit = async e => {
    e.preventDefault();
    setErr(''); setInfo('');
    if (mode !== 'forgot' && mode === 'up' && password.length < 8) return setErr(t('auth.err.short'));
    setBusy(true);
    try {
      if (mode === 'in') {
        const { error } = await auth.signIn(email, password);
        if (error) setErr(authError(t, error));
      } else if (mode === 'up') {
        const { data, error } = await auth.signUp(email, password, t.lang);
        if (error) setErr(authError(t, error));
        else if (!data.session) { setInfo(t('auth.checkEmail', { e: email })); setMode('in'); setPassword(''); }
      } else {
        const { error } = await auth.sendReset(email, t.lang);
        if (error) setErr(authError(t, error)); else setInfo(t('auth.resetSent'));
      }
    } finally { setBusy(false); }
  };

  return (
    <div className="auth">
      {mode !== 'forgot' && (
        <div className="seg seg--left" role="tablist">
          <button role="tab" aria-selected={mode === 'in'} className={mode === 'in' ? 'on' : ''} onClick={() => go('in')}>{t('auth.signin')}</button>
          <button role="tab" aria-selected={mode === 'up'} className={mode === 'up' ? 'on' : ''} onClick={() => go('up')}>{t('auth.signup')}</button>
        </div>
      )}
      <form className="form" onSubmit={submit}>
        <Input label={t('auth.email')} type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} />
        {mode !== 'forgot' && (
          <Input label={t('auth.password')} type="password" required minLength={mode === 'up' ? 8 : undefined}
            autoComplete={mode === 'up' ? 'new-password' : 'current-password'} hint={mode === 'up' ? t('auth.pwHint') : null}
            value={password} onChange={e => setPassword(e.target.value)} />
        )}
        <Msg kind="error">{err}</Msg>
        <Msg>{info}</Msg>
        <button className="btn btn--ink" disabled={busy}>
          {mode === 'in' ? t('auth.signin') : mode === 'up' ? t('auth.signup') : t('auth.sendReset')}
        </button>
        {mode === 'in' && <button type="button" className="linkish" onClick={() => go('forgot')}>{t('auth.forgot')}</button>}
        {mode === 'forgot' && <button type="button" className="linkish" onClick={() => go('in')}>{t('auth.back')}</button>}
      </form>
    </div>
  );
}

function Profile() {
  const t = useT();
  const { profile, saveProfile } = useAuth();
  const [f, setF] = useState({ name: '', phone: '', city: '', address: '' });
  const [state, setState] = useState('');
  useEffect(() => { if (profile) setF({ name: profile.name || '', phone: profile.phone || '', city: profile.city || '', address: profile.address || '' }); }, [profile]);
  const bind = k => ({ value: f[k], onChange: e => { setF(v => ({ ...v, [k]: e.target.value })); setState(''); } });
  const save = async e => {
    e.preventDefault();
    setState('busy');
    const { error } = await saveProfile(f);
    setState(error ? error.message : 'saved');
  };
  return (
    <form className="form card-box" onSubmit={save}>
      <h2 className="h3">{t('acc.profile')}</h2>
      <div className="form__grid">
        <Input label={t('f.name')} autoComplete="name" {...bind('name')} />
        <Input label={t('f.phone')} type="tel" autoComplete="tel" {...bind('phone')} />
        <Input label={t('f.city')} autoComplete="address-level2" {...bind('city')} />
        <Input label={t('f.address')} autoComplete="street-address" {...bind('address')} />
      </div>
      {state && state !== 'busy' && state !== 'saved' && <Msg kind="error">{state}</Msg>}
      <button className="btn btn--line" disabled={state === 'busy'}>{state === 'saved' ? t('acc.saved') : t('acc.save')}</button>
    </form>
  );
}

function MyOrders() {
  const t = useT();
  const { user } = useAuth();
  const [orders, setOrders] = useState(null);
  useEffect(() => {
    supabase.from('orders').select('id, number, created_at, items, total, status').eq('user_id', user.id).order('created_at', { ascending: false })
      .then(({ data }) => setOrders(data || []));
  }, [user.id]);
  return (
    <div className="card-box">
      <h2 className="h3">{t('acc.orders')}</h2>
      {orders === null ? <p className="small">…</p>
        : orders.length === 0 ? <p className="small">{t('acc.noOrders')}</p>
          : <ul className="olist">
            {orders.map(o => (
              <li key={o.id}>
                <b>#{o.number}</b>
                <span>{new Date(o.created_at).toLocaleDateString(t.lang === 'hy' ? 'hy-AM' : 'en-GB')}</span>
                <span>{t('acc.items', { n: o.items.reduce((n, i) => n + i.qty, 0) })}</span>
                <span>{formatAMD(o.total, t.lang)}</span>
                <span className={`status status--${o.status}`}>{t(`st.${o.status}`)}</span>
              </li>
            ))}
          </ul>}
    </div>
  );
}

export default function Account() {
  const t = useT();
  const auth = useAuth();

  return (
    <section className="page-pad">
      <div className="wrap narrow">
        <h1 className="h1">{t('auth.title')}</h1>
        {!auth.available ? <p className="lede">{t('auth.unavailable')}</p>
          : !auth.ready ? null
            : !auth.user ? <><p className="lede">{t('auth.lede')}</p><AuthForms /></>
              : <>
                <div className="acc__head">
                  <p className="lede">{t('auth.hello', { e: auth.user.email })}</p>
                  <div className="acc__actions">
                    {auth.isAdmin && <Link className="btn btn--ink" to={t.path('/admin')}>{t('acc.admin')}</Link>}
                    <button className="btn btn--line" onClick={auth.signOut}>{t('auth.signout')}</button>
                  </div>
                </div>
                <MyOrders />
                <Profile />
              </>}
      </div>
    </section>
  );
}
