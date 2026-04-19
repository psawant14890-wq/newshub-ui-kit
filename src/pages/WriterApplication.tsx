import { useState } from 'react';
import { Send, CheckCircle } from 'lucide-react';
import { Navbar, Footer } from '../components';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

const TOPICS = ['Politics', 'Technology', 'Sports', 'Business', 'Entertainment', 'Science', 'Health', 'World', 'Lifestyle', 'Opinion'];

export function WriterApplication() {
  const { user } = useAuth();
  const [bio, setBio] = useState('');
  const [samples, setSamples] = useState('');
  const [topics, setTopics] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const toggleTopic = (t: string) => setTopics(p => p.includes(t) ? p.filter(x => x !== t) : [...p, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast.error('Please log in first'); return; }
    if (!bio.trim() || !samples.trim() || topics.length === 0) {
      toast.error('Please complete all fields'); return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from('writer_applications').insert({
        user_id: user.id,
        email: user.email,
        bio,
        writing_samples: samples,
        topics,
        status: 'pending',
      });
      if (error) throw error;
      setSubmitted(true);
      toast.success('Application submitted!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar categories={[]} />
      <main className="container mx-auto px-4 py-12 max-w-2xl">
        {submitted ? (
          <div className="text-center py-12">
            <CheckCircle className="h-16 w-16 text-primary mx-auto mb-4" />
            <h1 className="font-display text-3xl font-bold text-foreground mb-3">Application Submitted!</h1>
            <p className="text-muted-foreground">We'll review and get back to you within 48 hours.</p>
          </div>
        ) : (
          <>
            <h1 className="font-display text-3xl font-bold text-foreground mb-2">Become a Writer</h1>
            <p className="text-muted-foreground mb-8">Share your voice with our community.</p>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Why do you want to write? *</label>
                <textarea value={bio} onChange={e => setBio(e.target.value)} rows={5}
                  className="w-full px-4 py-2.5 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="Tell us about your background and motivation..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Writing Samples *</label>
                <textarea value={samples} onChange={e => setSamples(e.target.value)} rows={6}
                  className="w-full px-4 py-2.5 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="Paste samples or links to your previous work..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Topics of Interest *</label>
                <div className="flex flex-wrap gap-2">
                  {TOPICS.map(t => (
                    <button type="button" key={t} onClick={() => toggleTopic(t)}
                      className={`px-3 py-1.5 text-sm rounded-full border transition-all ${
                        topics.includes(t) ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-foreground border-border hover:border-primary'
                      }`}>{t}</button>
                  ))}
                </div>
              </div>
              <button type="submit" disabled={submitting}
                className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground font-medium rounded-lg hover:opacity-90 transition-all disabled:opacity-50">
                <Send className="h-4 w-4" /> {submitting ? 'Submitting...' : 'Submit Application'}
              </button>
            </form>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
