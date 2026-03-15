import { useState, useEffect } from 'react';
import { Settings, Bookmark, History, Trash2, BookmarkX, Clock, Lock } from 'lucide-react';
import { Navbar, ArticleCard, Footer, Modal, LoadingSpinner, EmptyState } from '../components';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { getCategories, getRecentArticles } from '../lib/api';
import toast from 'react-hot-toast';
import type { Article, Category } from '../types';

export function ProfilePage() {
  const { user, signOut } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeTab, setActiveTab] = useState<'saved' | 'history' | 'settings'>('saved');
  const [articles, setArticles] = useState<Article[]>([]);
  const [savedArticles, setSavedArticles] = useState<Article[]>([]);
  const [historyArticles, setHistoryArticles] = useState<Article[]>([]);
  const [settings, setSettings] = useState({ name: '', email: '', newPassword: '', confirmPassword: '' });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const userEmail = user?.email || '';
  const userAvatar = user?.user_metadata?.avatar_url;

  useEffect(() => {
    // Check URL for tab parameter
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab === 'saved' || tab === 'history' || tab === 'settings') {
      setActiveTab(tab);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    setSettings(prev => ({ ...prev, name: userName, email: userEmail }));
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      const [cats, allArticles] = await Promise.all([getCategories(), getRecentArticles(30)]);
      setCategories(cats);
      setArticles(allArticles);

      // Load saved articles from Supabase
      if (user) {
        const { data: savedData } = await supabase
          .from('saved_articles')
          .select('*')
          .eq('user_id', user.id)
          .order('saved_at', { ascending: false });

        if (savedData) {
          const savedSlugs = savedData.map(s => s.article_slug);
          setSavedArticles(allArticles.filter(a => savedSlugs.includes(a.slug)));
        }

        const { data: historyData } = await supabase
          .from('reading_history')
          .select('*')
          .eq('user_id', user.id)
          .order('read_at', { ascending: false })
          .limit(20);

        if (historyData) {
          const historySlugs = historyData.map(h => h.article_slug);
          setHistoryArticles(allArticles.filter(a => historySlugs.includes(a.slug)));
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigate = (path: string) => {
    history.pushState(null, '', path);
    window.dispatchEvent(new Event('popstate'));
  };

  const handleDeleteAccount = async () => {
    await signOut();
    toast.success('Account deleted successfully.');
    navigate('/');
  };

  const handleSaveSettings = async () => {
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: settings.name }
      });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Profile updated!');
      }
    } catch {
      toast.error('Failed to update profile.');
    }
  };

  const handleChangePassword = async () => {
    if (!settings.newPassword || settings.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }
    if (settings.newPassword !== settings.confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    try {
      const { error } = await supabase.auth.updateUser({ password: settings.newPassword });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Password updated!');
        setSettings(prev => ({ ...prev, newPassword: '', confirmPassword: '' }));
      }
    } catch {
      toast.error('Failed to update password.');
    }
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
          {userAvatar ? (
            <img src={userAvatar} alt={userName} className="h-16 w-16 rounded-full object-cover" />
          ) : (
            <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center">
              <span className="text-xl font-bold text-primary-foreground">{userName.charAt(0).toUpperCase()}</span>
            </div>
          )}
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">{userName}</h1>
            <p className="text-sm text-muted-foreground">{userEmail}</p>
            {user?.created_at && (
              <p className="text-xs text-muted-foreground">Joined {new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
            )}
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
            {/* Edit Profile */}
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
                disabled
                className="w-full px-4 py-2.5 border border-border rounded-lg bg-muted text-muted-foreground cursor-not-allowed"
              />
            </div>
            <button onClick={handleSaveSettings} className="px-6 py-2.5 bg-primary text-primary-foreground font-medium rounded-lg hover:opacity-90 transition-all duration-200">
              Save Changes
            </button>

            {/* Change Password */}
            <div className="pt-6 border-t border-border">
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <Lock className="h-4 w-4" /> Change Password
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">New Password</label>
                  <input
                    type="password"
                    value={settings.newPassword}
                    onChange={e => setSettings(prev => ({ ...prev, newPassword: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all duration-200"
                    placeholder="Minimum 8 characters"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Confirm New Password</label>
                  <input
                    type="password"
                    value={settings.confirmPassword}
                    onChange={e => setSettings(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all duration-200"
                    placeholder="••••••••"
                  />
                </div>
                <button onClick={handleChangePassword} className="px-6 py-2.5 bg-primary text-primary-foreground font-medium rounded-lg hover:opacity-90 transition-all duration-200">
                  Update Password
                </button>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="pt-6 border-t border-border">
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
