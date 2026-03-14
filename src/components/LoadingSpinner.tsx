import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  fullPage?: boolean;
}

const sizeMap = {
  sm: 'h-5 w-5',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
};

export function LoadingSpinner({ size = 'md', fullPage = false }: LoadingSpinnerProps) {
  const spinner = (
    <Loader2 className={`${sizeMap[size]} text-primary animate-spin`} />
  );

  if (fullPage) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        {spinner}
      </div>
    );
  }

  return spinner;
}
