interface CategoryBadgeProps {
  category: string;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

const categoryColorMap: Record<string, { bg: string; text: string; hover: string }> = {
  politics: { bg: 'bg-category-politics/10', text: 'text-category-politics', hover: 'hover:bg-category-politics/20' },
  tech: { bg: 'bg-category-tech/10', text: 'text-category-tech', hover: 'hover:bg-category-tech/20' },
  sports: { bg: 'bg-category-sports/10', text: 'text-category-sports', hover: 'hover:bg-category-sports/20' },
  world: { bg: 'bg-category-world/10', text: 'text-category-world', hover: 'hover:bg-category-world/20' },
  entertainment: { bg: 'bg-category-entertainment/10', text: 'text-category-entertainment', hover: 'hover:bg-category-entertainment/20' },
  business: { bg: 'bg-primary/10', text: 'text-primary', hover: 'hover:bg-primary/20' },
};

const sizeClasses = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-3 py-1',
  lg: 'text-base px-4 py-1.5',
};

export function CategoryBadge({ category, size = 'sm', onClick }: CategoryBadgeProps) {
  const slug = category.toLowerCase();
  const colors = categoryColorMap[slug] || categoryColorMap.business;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick) {
      onClick();
    } else {
      history.pushState(null, '', `/category/${slug}`);
      window.dispatchEvent(new Event('popstate'));
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center font-medium rounded-full transition-all duration-200 ${colors.bg} ${colors.text} ${colors.hover} ${sizeClasses[size]}`}
    >
      {category}
    </button>
  );
}
