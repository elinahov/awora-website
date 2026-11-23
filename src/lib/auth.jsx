import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase.js';

const AuthCtx = createContext(null);

// Email + password accounts through Supabase Auth. `isAdmin` comes from the `admins` table (rpc is_admin).
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(!supabase);
  const [isAdmin, setIsAdmin] = useState(false);
  const [roleReady, setRoleReady] = useState(false);
  const [profile, setProfile] = useState(null);
  const [recovery, setRecovery] = useState(false);
  const user = session?.user || null;

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (event === 'PASSWORD_RECOVERY') setRecovery(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const uid = user?.id;
  useEffect(() => {
    if (!supabase || !uid) { setIsAdmin(false); setProfile(null); setRoleReady(true); return; }
    let alive = true;
    setRoleReady(false);
    (async () => {
      const [a, p] = await Promise.all([
        supabase.rpc('is_admin'),
        supabase.from('profiles').select('*').eq('id', uid).maybeSingle()
      ]);
      if (!alive) return;
      setIsAdmin(!!a.data);
      setProfile(p.data || null);
      setRoleReady(true);
    })();
    return () => { alive = false; };
  }, [uid]);

  const origin = typeof location !== 'undefined' ? location.origin : '';
  const signIn = (email, password) => supabase.auth.signInWithPassword({ email, password });
  const signUp = (email, password, lang) => supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${origin}/${lang}/account` } });
  const signOut = () => supabase.auth.signOut();
  const sendReset = (email, lang) => supabase.auth.resetPasswordForEmail(email, { redirectTo: `${origin}/${lang}/account/reset` });
  const updatePassword = async password => {
    const r = await supabase.auth.updateUser({ password });
    if (!r.error) setRecovery(false);
    return r;
  };
  const saveProfile = useCallback(async patch => {
    const row = { ...profile, ...patch, id: uid, updated_at: new Date().toISOString() };
    const r = await supabase.from('profiles').upsert(row).select().single();
    if (!r.error) setProfile(r.data);
    return r;
  }, [profile, uid]);

  return (
    <AuthCtx.Provider value={{
      available: !!supabase, ready, roleReady, session, user, isAdmin, profile, recovery,
      signIn, signUp, signOut, sendReset, updatePassword, saveProfile
    }}>{children}</AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
