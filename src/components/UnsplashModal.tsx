import { useState } from 'react';
import { Search, X, Image as ImageIcon } from 'lucide-react';
import { Modal } from './Modal';

interface UnsplashModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string, alt: string) => void;
}

interface UnsplashImage {
  id: string;
  urls: { regular: string; small: string };
  alt_description: string | null;
  user: { name: string };
}

export function UnsplashModal({ isOpen, onClose, onSelect }: UnsplashModalProps) {
  const [query, setQuery] = useState('');
  const [images, setImages] = useState<UnsplashImage[]>([]);
  const [loading, setLoading] = useState(false);

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=12&client_id=demo`);
      if (res.ok) {
        const data = await res.json();
        setImages(data.results || []);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Search Unsplash" size="lg">
      <div className="flex gap-2 mb-4">
        <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && search()}
          className="flex-1 px-4 py-2.5 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          placeholder="Search free photos..." />
        <button onClick={search} disabled={loading}
          className="px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2">
          <Search className="h-4 w-4" /> {loading ? 'Searching...' : 'Search'}
        </button>
      </div>
      {images.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto">
          {images.map(img => (
            <button key={img.id} onClick={() => { onSelect(img.urls.regular, img.alt_description || `Photo by ${img.user.name}`); onClose(); }}
              className="group relative aspect-video rounded-lg overflow-hidden border border-border hover:border-primary transition-all">
              <img src={img.urls.small} alt={img.alt_description || ''} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                <span className="text-white text-xs truncate">by {img.user.name}</span>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <ImageIcon className="h-12 w-12 mb-3 opacity-50" />
          <p className="text-sm">Search for photos to use as thumbnails</p>
        </div>
      )}
    </Modal>
  );
}
