import { useState, useEffect } from 'react';
import { Settings, Bookmark, History, LogOut, Trash2, BookmarkX, Clock } from 'lucide-react';
import { Navbar, ArticleCard, Footer, Modal, LoadingSpinner, EmptyState } from '../components';
import { useAuth } from '../context/AuthContext';
import { useToastContext } from '../context/ToastContext';
import { getCategories, getRecentArticles } from '../lib/api';
import type { Article, Category } from '../types';

export function ProfilePage() {
  const { user, logout } = useAuth();
  const { showToast } = useToastContext();
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeTab, setActiveTab] = useState<'saved' | 'history' | 'settings'>('saved');
  const [articles, setArticles] = useState<Article[]>([]);
  const [savedArticles, setSavedArticles] = useState<Article[]>([]);
  const [historyArticles, setHistoryArticles] = useState<Article[]>([]);
  const [settings, setSettings] = useState({ name: '', email: '', notifications: true, newsletter: true });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      history.pushState(null, '', '/auth');
      window.dispatchEvent(new Event('popstate'));
      return;
    }
    setSettings(prev => ({ ...prev, name: user.name, email: user.email }));
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      const [cats, allArticles] = await Promise.all([getCategories(), getRecentArticles(30)]);
      setCategories(cats);
      setArticles(allArticles);
      const saved = JSON.parse(localStorage.getItem('savedArticles') || '[]');
      const hist = JSON.parse(localStorage.getItem('readingHistory') || '[]');
      setSavedArticles(allArticles.filter(a => saved.includes(a.id)));
      setHistoryArticles(allArticles.filter(a => hist.includes(a.id)));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = () => {
    logout();
    localStorage.removeItem('user');
    showToast({ message: 'Account deleted successfully.', type: 'success' });
    history.pushState(null, '', '/');
    window.dispatchEvent(new Event('popstate'));
  };

  const handleSaveSettings = () => {
    localStorage.setItem('userSettings', JSON.stringify(settings));
    showToast({ message: 'Settings saved!', type: 'success' });
  };

  if (loading) return <LoadingSpinner fullPage />;

  const tabs = [
    { id: 'saved' as const, label: 'Saved Articles', icon: Bookmark },
    { id: 'history' as const, label: 'Reading History', icon: History },
    { id: 'settings' as const, label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar categories={categories} />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Profile Header */}
        <div className="flex items-center gap-4 mb-8">
          {user?.avatar ? (
            <img src={user.avatar} alt={user.name} className="h-16 w-16 rounded-full object-cover" />
          ) : (
            <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center">
              <span className="text-xl font-bold text-primary-foreground">{user?.name?.charAt(0).toUpperCase()}</span>
            </div>
          )}
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">{user?.name}</h1>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 border-b border-border">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all duration-200 ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'saved' && (
          savedArticles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {savedArticles.map(a => <ArticleCard key={a.id} article={a} />)}
            </div>
          ) : (
            <EmptyState icon={BookmarkX} title="No saved articles" description="Articles you bookmark will appear here." />
          )
        )}

        {activeTab === 'history' && (
          historyArticles.length > 0 ? (
            <div className="space-y-2">
              {historyArticles.map(a => <ArticleCard key={a.id} article={a} variant="horizontal" />)}
            </div>
          ) : (
            <EmptyState icon={Clock} title="No reading history" description="Articles you read will appear here." />
          )
        )}

        {activeTab === 'settings' && (
          <div className="max-w-lg space-y-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Name</label>
              <input
                value={settings.name}
                onChange={e => setSettings(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-2.5 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all duration-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
              <input
                value={settings.email}
                onChange={e => setSettings(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-4 py-2.5 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all duration-200"
              />
            </div>
            <div className="flex items-center justify-between py-3 border-t border-border">
              <span className="text-sm text-foreground">Email notifications</span>
              <button
                onClick={() => setSettings(prev => ({ ...prev, notifications: !prev.notifications }))}
                className={`w-11 h-6 rounded-full transition-colors duration-200 ${settings.notifications ? 'bg-primary' : 'bg-muted'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-primary-foreground shadow transition-transform duration-200 ${settings.notifications ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>
            <div className="flex gap-3">
              <button onClick={handleSaveSettings} className="px-6 py-2.5 bg-primary text-primary-foreground font-medium rounded-lg hover:opacity-90 transition-all duration-200">
                Save Changes
              </button>
              <button onClick={() => setShowDeleteModal(true)} className="px-6 py-2.5 text-destructive border border-destructive/30 rounded-lg hover:bg-destructive/10 transition-all duration-200 flex items-center gap-2">
                <Trash2 className="h-4 w-4" /> Delete Account
              </button>
            </div>
          </div>
        )}
      </main>

      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Account" size="sm">
        <p className="text-sm text-muted-foreground mb-6">Are you sure you want to delete your account? This action cannot be undone.</p>
        <div className="flex gap-3 justify-end">
          <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 text-sm text-foreground hover:bg-accent rounded-lg transition-all duration-200">
            Cancel
          </button>
          <button onClick={handleDeleteAccount} className="px-4 py-2 text-sm bg-destructive text-destructive-foreground rounded-lg hover:opacity-90 transition-all duration-200">
            Delete Account
          </button>
        </div>
      </Modal>

      <Footer />
    </div>
  );
}
