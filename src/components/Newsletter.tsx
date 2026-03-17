import { Mail } from 'lucide-react';
import { useState } from 'react';
import { useNewsletter } from '../hooks/useNewsletter';

export function Newsletter() {
  const [email, setEmail] = useState('');
  const { subscribe, loading, subscribed } = useNewsletter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await subscribe(email);
    if (!loading) setEmail('');
  };

  return (
    <section className="py-12 bg-card rounded-lg border border-border">
      <div className="max-w-2xl mx-auto text-center px-4">
        <Mail className="h-10 w-10 text-primary mx-auto mb-4" />
        <h2 className="font-display text-2xl font-bold text-foreground mb-2">Stay Informed</h2>
        <p className="text-muted-foreground mb-6">
          Get our daily digest of essential stories delivered to your inbox every morning.
        </p>
        {subscribed ? (
          <p className="text-primary font-medium">Thank you for subscribing! Check your email to confirm.</p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="flex-1 px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-background text-foreground placeholder:text-muted-foreground transition-all duration-200"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:opacity-90 transition-all duration-200 disabled:opacity-50"
            >
              {loading ? 'Subscribing...' : 'Subscribe'}
            </button>
          </form>
        )}
        <p className="text-xs text-muted-foreground mt-4">We respect your privacy. Unsubscribe at any time.</p>
      </div>
    </section>
  );
}
