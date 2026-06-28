import { useEffect, useState } from 'react';
import { Navbar, Footer } from '../components';
import { AskNewsHub } from '../components/AskNewsHub';
import { getCategories } from '../lib/api';
import type { Category } from '../types';

export function AskPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  useEffect(() => { getCategories().then(setCategories); }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar categories={categories} />
      <main className="container mx-auto px-4 py-10">
        <div className="max-w-3xl mx-auto mb-6">
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">Ask NewsHub</h1>
          <p className="text-muted-foreground">
            AI-powered Q&A grounded in our article corpus. Every answer is cited and verifiable —
            we never hallucinate from training data.
          </p>
        </div>
        <AskNewsHub />
      </main>
      <Footer />
    </div>
  );
}
