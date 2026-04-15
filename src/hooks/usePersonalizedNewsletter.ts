import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { generateWithGemini } from '../lib/gemini';
import toast from 'react-hot-toast';

export function usePersonalizedNewsletter() {
  const [loading, setLoading] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState('');

  const subscribeWithPreferences = async (
    email: string,
    name: string | undefined,
    preferredCategories: string[]
  ) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .upsert({
          email,
          name: name || null,
          preferred_categories: preferredCategories,
        }, { onConflict: 'email' });

      if (error) {
        toast.error('Failed to subscribe.');
        return;
      }

      // Generate personalized welcome
      try {
        const { data: articles } = await supabase
          .from('articles')
          .select('title')
          .eq('status', 'published')
          .order('published_at', { ascending: false })
          .limit(5);

        const titles = (articles || []).map(a => a.title).join(', ');
        const msg = await generateWithGemini(
          `Create a personalized newsletter intro for a reader who likes: ${preferredCategories.join(', ')}. Featured articles this week: ${titles}. Write a 2 paragraph personalized intro. Return just the text.`
        );
        setWelcomeMessage(msg);
      } catch {
        setWelcomeMessage('Welcome to NewsHub! We\'ll keep you updated with the latest stories.');
      }

      toast.success('Successfully subscribed with your preferences!');
    } catch {
      toast.error('Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return { subscribeWithPreferences, loading, welcomeMessage };
}
