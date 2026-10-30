import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import AdminLogin from './AdminLogin';
import AdminDashboard from './AdminDashboard';
import { hideBootLoader } from '../bootLoader';

export default function AdminApp() {
  const [session, setSession] = useState<Session | null | undefined>(undefined); // undefined = still loading
  const [profile, setProfile] = useState<{ id: string; name: string; email: string; role: string } | null>(null);
  const [profileError, setProfileError] = useState('');

  useEffect(() => hideBootLoader(), []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) {
      setProfile(null);
      return;
    }
    setProfileError('');
    supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setProfileError('This account has no admin profile. Access denied.');
          return;
        }
        if (data.role !== 'administrator' && data.role !== 'shop_manager') {
          setProfileError('This account does not have admin access.');
          return;
        }
        setProfile({ id: data.id, name: data.name, email: data.email, role: data.role });
      });
  }, [session]);

  if (session === undefined) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-stone-950 text-stone-400">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <AdminLogin />;
  }

  if (profileError) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-stone-950 text-white gap-4 px-4">
        <p className="text-rose-400 font-semibold text-sm text-center max-w-sm">{profileError}</p>
        <button
          onClick={() => supabase.auth.signOut()}
          className="px-4 py-2 bg-stone-800 hover:bg-stone-700 rounded-lg text-xs font-bold"
        >
          Sign Out
        </button>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-stone-950 text-stone-400">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return <AdminDashboard profile={profile} onSignOut={() => supabase.auth.signOut()} />;
}
