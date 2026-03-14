import { useEffect, useState } from 'react';
import { Home } from 'lucide-react';
import { Navbar, Footer, EmptyState } from '../components';
import { getCategories } from '../lib/api';
import type { Category } from '../types';

export function NotFoundPage() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    getCategories().then(setCategories).catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar categories={categories} />
      <EmptyState
        icon={Home}
        title="Page Not Found"
        description="The page you're looking for doesn't exist or has been moved."
        buttonText="Go Home"
        onButtonClick={() => {
          history.pushState(null, '', '/');
          window.dispatchEvent(new Event('popstate'));
        }}
      />
      <Footer />
    </div>
  );
}
