import { useState } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface UseNewsletterReturn {
  subscribe: (email: string, name?: string) => Promise<void>;
  loading: boolean;
  subscribed: boolean;
}

export function useNewsletter(): UseNewsletterReturn {
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const subscribe = async (email: string, name?: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .insert({ email, name: name || null });

      if (error) {
        if (error.code === '23505') {
          toast.error('This email is already subscribed!');
        } else {
          toast.error('Failed to subscribe. Please try again.');
        }
        return;
      }

      setSubscribed(true);
      toast.success('Successfully subscribed!');
      setTimeout(() => setSubscribed(false), 5000);
    } catch {
      toast.error('Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return { subscribe, loading, subscribed };
}
