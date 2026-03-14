import { Clock } from 'lucide-react';

interface AuthorMetaProps {
  author?: { name: string; avatar?: string | null };
  date: string;
  readTime: number;
  size?: 'sm' | 'md';
}

export function AuthorMeta({ author, date, readTime, size = 'sm' }: AuthorMetaProps) {
  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const avatarSize = size === 'sm' ? 'h-6 w-6 text-[10px]' : 'h-8 w-8 text-xs';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  const handleAuthorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (author) {
      const slug = author.name.toLowerCase().replace(/\s+/g, '-');
      history.pushState(null, '', `/author/${slug}`);
      window.dispatchEvent(new Event('popstate'));
    }
  };

  return (
    <div className="flex items-center gap-2">
      {author && (
        <>
          <button onClick={handleAuthorClick} className="flex items-center gap-1.5 hover:opacity-80 transition-opacity duration-200">
            {author.avatar ? (
              <img src={author.avatar} alt={author.name} className={`${avatarSize} rounded-full object-cover`} />
            ) : (
              <div className={`${avatarSize} rounded-full bg-primary flex items-center justify-center`}>
                <span className="font-medium text-primary-foreground">{getInitials(author.name)}</span>
              </div>
            )}
            <span className={`${textSize} font-medium text-foreground`}>{author.name}</span>
          </button>
          <span className="text-muted-foreground">·</span>
        </>
      )}
      <span className={`${textSize} text-muted-foreground`}>{formatDate(date)}</span>
      <span className="text-muted-foreground">·</span>
      <span className={`${textSize} text-muted-foreground flex items-center gap-1`}>
        <Clock className="h-3 w-3" />
        {readTime} min read
      </span>
    </div>
  );
}
