import { SearchConsoleMetrics } from '../components/SearchConsoleMetrics';

export default function GSCPreviewPage() {
  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      <div className="mx-auto max-w-6xl">
        <SearchConsoleMetrics />
      </div>
    </div>
  );
}
