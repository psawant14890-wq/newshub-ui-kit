import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { LoadingSpinner } from '../components';

const navigate = (path: string) => {
  history.pushState(null, '', path);
  window.dispatchEvent(new Event('popstate'));
};

export function AuthCallback() {
  useEffect(() => {
    const handleCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          navigate('/auth?error=Authentication failed');
          return;
        }
      }
      navigate('/profile');
    };
    handleCallback();
  }, []);

  return <LoadingSpinner fullPage />;
}
