import { useEffect, useState } from 'react';
import { Navbar, Footer } from '../components';
import { getCategories } from '../lib/api';
import type { Category } from '../types';

interface StaticPageProps {
  title: string;
  content: React.ReactNode;
}

export function StaticPage({ title, content }: StaticPageProps) {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    getCategories().then(setCategories).catch(console.error);
  }, []);

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

export function AboutPage() {
  return (
    <StaticPage
      title="About NewsHub"
      content={
        <>
          <p>NewsHub is a next-generation digital media platform delivering intelligent, fact-based reporting on the stories that matter most.</p>
          <p>Founded with a mission to provide credible journalism in an era of information overload, NewsHub covers politics, business, technology, world affairs, culture, and more with rigor, clarity, and integrity.</p>
          <h2>Our Mission</h2>
          <p>We believe in the power of quality journalism to inform, enlighten, and empower. Our team of experienced journalists and analysts work tirelessly to bring you accurate, balanced, and insightful coverage of the events shaping our world.</p>
          <h2>Our Values</h2>
          <ul>
            <li><strong>Accuracy:</strong> Every story is fact-checked and verified before publication</li>
            <li><strong>Independence:</strong> We maintain editorial independence from political and commercial interests</li>
            <li><strong>Transparency:</strong> We clearly distinguish between news reporting and opinion pieces</li>
            <li><strong>Accountability:</strong> We own our mistakes and correct them promptly</li>
          </ul>
        </>
      }
    />
  );
}

export function EditorialPolicyPage() {
  return (
    <StaticPage
      title="Editorial Policy"
      content={
        <>
          <p>Our editorial standards guide everything we publish on NewsHub.</p>
          <h2>Fact-Checking</h2>
          <p>All factual claims in our reporting undergo rigorous verification. We use multiple sources and, where possible, original documents to confirm information before publication.</p>
          <h2>News vs. Opinion</h2>
          <p>We maintain a clear distinction between news reporting and opinion content. Opinion pieces are clearly labeled.</p>
          <h2>Corrections</h2>
          <p>When we make mistakes, we correct them promptly and transparently.</p>
        </>
      }
    />
  );
}

export function PrivacyPage() {
  return (
    <StaticPage
      title="Privacy Policy"
      content={
        <>
          <p>Last updated: {new Date().toLocaleDateString()}</p>
          <h2>Information We Collect</h2>
          <p>We collect information you provide directly to us, such as when you subscribe to our newsletter, create an account, or contact us.</p>
          <h2>How We Use Your Information</h2>
          <ul>
            <li>Deliver our newsletter and other communications you've requested</li>
            <li>Respond to your comments and questions</li>
            <li>Improve our services and user experience</li>
            <li>Comply with legal obligations</li>
          </ul>
          <h2>Data Security</h2>
          <p>We implement appropriate technical and organizational measures to protect your personal information.</p>
        </>
      }
    />
  );
}

export function TermsPage() {
  return (
    <StaticPage
      title="Terms of Service"
      content={
        <>
          <p>Last updated: {new Date().toLocaleDateString()}</p>
          <h2>Acceptance of Terms</h2>
          <p>By accessing and using NewsHub, you accept and agree to be bound by the terms and provision of this agreement.</p>
          <h2>Use License</h2>
          <p>Permission is granted to temporarily access the materials on NewsHub for personal, non-commercial viewing only.</p>
          <h2>Disclaimer</h2>
          <p>The materials on NewsHub are provided on an 'as is' basis. We make no warranties, expressed or implied.</p>
        </>
      }
    />
  );
}
