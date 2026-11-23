import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useT } from '../i18n.jsx';
import { useAuth } from '../lib/auth.jsx';
import { Input, Msg } from '../components/Form.jsx';
import { authError } from './Account.jsx';

// Landing page for the password-reset email link. Supabase signs the user in from the link, then they set a new password.
export default function ResetPassword() {
  const t = useT();
  const auth = useAuth();
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [done, setDone] = useState(false);

  const submit = async e => {
    e.preventDefault();
    if (pw.length < 8) return setErr(t('auth.err.short'));
    setBusy(true); setErr('');
    const { error } = await auth.updatePassword(pw);
    setBusy(false);
    if (error) setErr(authError(t, error)); else setDone(true);
  };

  return (
    <section className="page-pad">
      <div className="wrap narrow">
        <h1 className="h1">{t('auth.reset.title')}</h1>
        {!auth.available ? <p className="lede">{t('auth.unavailable')}</p>
          : !auth.ready ? null
            : done ? <><Msg>{t('auth.reset.done')}</Msg><Link className="btn btn--ink" to={t.path('/account')}>{t('auth.title')}</Link></>
              : !auth.session ? <><p className="lede">{t('auth.reset.expired')}</p><Link className="btn btn--line" to={t.path('/account')}>{t('auth.back')}</Link></>
                : <form className="form auth" onSubmit={submit}>
                  <Input label={t('auth.newPassword')} type="password" autoComplete="new-password" required minLength={8} hint={t('auth.pwHint')} value={pw} onChange={e => setPw(e.target.value)} />
                  <Msg kind="error">{err}</Msg>
                  <button className="btn btn--ink" disabled={busy}>{t('auth.reset.save')}</button>
                </form>}
      </div>
    </section>
  );
}
