interface SkeletonCardProps {
  count?: number;
}

function SingleSkeleton() {
  return (
    <div className="rounded-lg overflow-hidden bg-card border border-border">
      <div className="aspect-video bg-muted animate-skeleton" />
      <div className="p-4 space-y-3">
        <div className="h-4 w-16 bg-muted rounded-full animate-skeleton" />
        <div className="space-y-2">
          <div className="h-5 w-full bg-muted rounded animate-skeleton" />
          <div className="h-5 w-3/4 bg-muted rounded animate-skeleton" />
        </div>
        <div className="space-y-1.5">
          <div className="h-3 w-full bg-muted rounded animate-skeleton" />
          <div className="h-3 w-2/3 bg-muted rounded animate-skeleton" />
        </div>
        <div className="flex items-center gap-2 pt-1">
          <div className="h-6 w-6 rounded-full bg-muted animate-skeleton" />
          <div className="h-3 w-20 bg-muted rounded animate-skeleton" />
          <div className="h-3 w-16 bg-muted rounded animate-skeleton" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonCard({ count = 1 }: SkeletonCardProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <SingleSkeleton key={i} />
      ))}
    </>
  );
}
