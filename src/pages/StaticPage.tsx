import { useEffect, useState } from 'react';
import { Twitter, Linkedin, Send } from 'lucide-react';
import { Navbar, Footer } from '../components';
import { getCategories } from '../lib/api';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import type { Category } from '../types';

interface StaticPageProps {
  title: string;
  content: React.ReactNode;
}

export function StaticPage({ title, content }: StaticPageProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  useEffect(() => { getCategories().then(setCategories).catch(console.error); }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar categories={categories} />
      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="font-display text-3xl font-bold text-foreground mb-8">{title}</h1>
        <div className="prose max-w-none text-foreground [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-8 [&_h2]:mb-4 [&_p]:text-muted-foreground [&_p]:leading-relaxed [&_p]:mb-4 [&_li]:text-muted-foreground [&_li]:mb-2 [&_ul]:pl-6 [&_ul]:mb-4">
          {content}
        </div>
      </main>
      <Footer />
    </div>
  );
}

const team = [
  { name: 'Pranay Sawant', role: 'Founder & Editor', seed: 'pranay', twitter: '#', linkedin: '#' },
  { name: 'Sarah Johnson', role: 'Senior Reporter', seed: 'sarah-j', twitter: '#', linkedin: '#' },
  { name: 'Mike Torres', role: 'Sports Editor', seed: 'mike-t', twitter: '#', linkedin: '#' },
  { name: 'Lisa Chen', role: 'Entertainment Writer', seed: 'lisa-c', twitter: '#', linkedin: '#' },
];

function ContactForm() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error('Please fill in required fields');
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from('contacts').insert({
        name: form.name, email: form.email, subject: form.subject, message: form.message,
      });
      if (error) throw error;
      toast.success('Message sent! We\'ll get back to you soon.');
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch {
      toast.error('Failed to send message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Name *</label>
          <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            className="w-full px-4 py-2.5 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all" placeholder="Your name" />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Email *</label>
          <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
            className="w-full px-4 py-2.5 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all" placeholder="you@example.com" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">Subject</label>
        <input value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
          className="w-full px-4 py-2.5 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all" placeholder="What's this about?" />
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">Message *</label>
        <textarea value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} rows={4}
          className="w-full px-4 py-2.5 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-none" placeholder="Your message..." />
      </div>
      <button type="submit" disabled={submitting}
        className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground font-medium rounded-lg hover:opacity-90 disabled:opacity-50 transition-all">
        <Send className="h-4 w-4" />
        {submitting ? 'Sending...' : 'Send Message'}
      </button>
    </form>
  );
}

export function AboutPage() {
  return (
    <StaticPage
      title="About NewsHub"
      content={
        <>
          <p>NewsHub is a next-generation digital media platform delivering intelligent, fact-based reporting on the stories that matter most.</p>
          <p>Founded with a mission to provide credible journalism in an era of information overload, NewsHub covers politics, business, technology, world affairs, culture, and more with rigor, clarity, and integrity.</p>
          <h2>Our Mission</h2>
          <p>We believe in the power of quality journalism to inform, enlighten, and empower.</p>
          <h2>Our Values</h2>
          <ul>
            <li><strong>Accuracy:</strong> Every story is fact-checked and verified before publication</li>
            <li><strong>Independence:</strong> We maintain editorial independence</li>
            <li><strong>Transparency:</strong> We distinguish between news and opinion</li>
            <li><strong>Accountability:</strong> We own our mistakes and correct them promptly</li>
          </ul>

          <h2>Our Team</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 not-prose mb-10">
            {team.map(member => (
              <div key={member.name} className="p-6 bg-card border border-border rounded-lg text-center">
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${member.seed}`}
                  alt={member.name}
                  className="h-20 w-20 rounded-full mx-auto mb-3"
                />
                <h3 className="font-display text-lg font-semibold text-foreground">{member.name}</h3>
                <p className="text-sm text-muted-foreground mb-3">{member.role}</p>
                <div className="flex items-center justify-center gap-3">
                  <a href={member.twitter} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all" aria-label="Twitter">
                    <Twitter className="h-4 w-4" />
                  </a>
                  <a href={member.linkedin} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all" aria-label="LinkedIn">
                    <Linkedin className="h-4 w-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>

          <h2>Contact Us</h2>
          <div className="not-prose">
            <ContactForm />
          </div>
        </>
      }
    />
  );
}

export function EditorialPolicyPage() {
  return (
    <StaticPage title="Editorial Policy" content={<>
      <p>Our editorial standards guide everything we publish on NewsHub.</p>
      <h2>Fact-Checking</h2><p>All factual claims undergo rigorous verification.</p>
      <h2>News vs. Opinion</h2><p>We maintain a clear distinction between news and opinion.</p>
      <h2>Corrections</h2><p>We correct mistakes promptly and transparently.</p>
    </>} />
  );
}

export function PrivacyPage() {
  return (
    <StaticPage title="Privacy Policy" content={<>
      <p>Last updated: {new Date().toLocaleDateString()}</p>
      <h2>Information We Collect</h2><p>We collect information you provide directly to us.</p>
      <h2>How We Use Your Information</h2>
      <ul><li>Deliver communications you've requested</li><li>Respond to your questions</li><li>Improve our services</li><li>Comply with legal obligations</li></ul>
      <h2>Data Security</h2><p>We implement appropriate measures to protect your information.</p>
    </>} />
  );
}

export function TermsPage() {
  return (
    <StaticPage title="Terms of Service" content={<>
      <p>Last updated: {new Date().toLocaleDateString()}</p>
      <h2>Acceptance of Terms</h2><p>By accessing NewsHub, you agree to these terms.</p>
      <h2>Use License</h2><p>Permission is granted for personal, non-commercial viewing only.</p>
      <h2>Disclaimer</h2><p>Materials are provided 'as is'. We make no warranties.</p>
    </>} />
  );
}
