import { Newspaper, ArrowUp, Twitter, Facebook, Instagram, Youtube, Linkedin, Mail } from 'lucide-react';
import { useState } from 'react';

export function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const navigate = (path: string) => {
    history.pushState(null, '', path);
    window.dispatchEvent(new Event('popstate'));
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubscribed(true);
    setEmail('');
    setTimeout(() => setSubscribed(false), 3000);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const categoryLinks = [
    { name: 'Politics', slug: 'politics' },
    { name: 'Tech', slug: 'tech' },
    { name: 'Sports', slug: 'sports' },
    { name: 'World', slug: 'world' },
  ];

  const companyLinks = [
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/about' },
    { name: 'Careers', path: '/about' },
    { name: 'Advertise', path: '/about' },
  ];

  const legalLinks = [
    { name: 'Privacy Policy', path: '/privacy' },
    { name: 'Terms of Service', path: '/terms' },
    { name: 'Cookie Policy', path: '/privacy' },
  ];

  const socialLinks = [
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Facebook, href: '#', label: 'Facebook' },
    { icon: Instagram, href: '#', label: 'Instagram' },
    { icon: Youtube, href: '#', label: 'YouTube' },
    { icon: Linkedin, href: '#', label: 'LinkedIn' },
  ];

  return (
    <footer className="bg-surface-dark text-surface-dark-foreground">
      {/* Newsletter Section */}
      <div className="border-b border-surface-dark-foreground/10">
        <div className="container mx-auto px-4 py-10">
          <div className="max-w-2xl mx-auto text-center">
            <Mail className="h-8 w-8 text-primary mx-auto mb-3" />
            <h3 className="font-display text-xl font-bold mb-2">Stay informed</h3>
            <p className="text-surface-dark-foreground/70 text-sm mb-4">
              Get the latest news delivered to your inbox.
            </p>
            {subscribed ? (
              <p className="text-primary font-medium text-sm">Thank you for subscribing! ✓</p>
            ) : (
              <form onSubmit={handleSubscribe} className="flex gap-2 max-w-md mx-auto">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="flex-1 px-4 py-2.5 bg-surface-dark-foreground/5 border border-surface-dark-foreground/10 rounded-lg text-sm text-surface-dark-foreground placeholder:text-surface-dark-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all duration-200"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-primary text-primary-foreground font-medium text-sm rounded-lg hover:opacity-90 transition-all duration-200"
                >
                  Subscribe
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Links */}
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Logo */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <Newspaper className="h-6 w-6 text-primary" />
              <span className="font-display text-lg font-bold">NewsHub</span>
            </div>
            <p className="text-sm text-surface-dark-foreground/60">
              Your trusted source for breaking news and in-depth analysis.
            </p>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-semibold text-sm mb-3">Categories</h4>
            <ul className="space-y-2">
              {categoryLinks.map(link => (
                <li key={link.slug}>
                  <button
                    onClick={() => navigate(`/category/${link.slug}`)}
                    className="text-sm text-surface-dark-foreground/60 hover:text-primary transition-colors duration-200"
                  >
                    {link.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-sm mb-3">Company</h4>
            <ul className="space-y-2">
              {companyLinks.map(link => (
                <li key={link.name}>
                  <button
                    onClick={() => navigate(link.path)}
                    className="text-sm text-surface-dark-foreground/60 hover:text-primary transition-colors duration-200"
                  >
                    {link.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-sm mb-3">Legal</h4>
            <ul className="space-y-2">
              {legalLinks.map(link => (
                <li key={link.name}>
                  <button
                    onClick={() => navigate(link.path)}
                    className="text-sm text-surface-dark-foreground/60 hover:text-primary transition-colors duration-200"
                  >
                    {link.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="font-semibold text-sm mb-3">Follow Us</h4>
            <div className="flex flex-wrap gap-2">
              {socialLinks.map(link => (
                <a
                  key={link.label}
                  href={link.href}
                  aria-label={link.label}
                  className="p-2 border border-surface-dark-foreground/20 rounded-full hover:border-primary hover:text-primary transition-all duration-200"
                >
                  <link.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-surface-dark-foreground/10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <p className="text-xs text-surface-dark-foreground/50">
            © {new Date().getFullYear()} NewsHub. All rights reserved.
          </p>
          <button
            onClick={scrollToTop}
            className="flex items-center gap-1 text-xs text-surface-dark-foreground/50 hover:text-primary transition-colors duration-200"
          >
            <ArrowUp className="h-3.5 w-3.5" />
            Back to top
          </button>
        </div>
      </div>
    </footer>
  );
}
