import { useRef } from 'react';
import { TopBar } from './components/TopBar';
import { ControlsSidebar } from './components/ControlsSidebar';
import { ReportCanvas } from './components/ReportCanvas';
import { EmptyState, ErrorState, CanvasSkeleton } from './components/States';
import { useForm } from './context/FormContext';
import { useFacility } from './hooks/useFacility';

export default function App() {
  const { activeCcn, manual } = useForm();
  const query = useFacility(activeCcn);
  const facility = query.data;
  const canvasRef = useRef<HTMLElement>(null);

  return (
    <div className="min-h-screen">
      <ControlsSidebar facility={facility} isFetching={query.isFetching} />

      <main className="ml-80 flex min-h-screen flex-col">
        <TopBar onPrint={() => window.print()} ccn={facility?.ccn} />

        <div className="flex flex-1 justify-center bg-surface-container p-6 sm:p-12">
          {!activeCcn && <EmptyState />}
          {activeCcn && query.isLoading && <CanvasSkeleton />}
          {activeCcn && query.isError && query.error && (
            <ErrorState error={query.error} onRetry={() => query.refetch()} />
          )}
          {facility && !query.isLoading && (
            <ReportCanvas ref={canvasRef} facility={facility} manual={manual} />
          )}
        </div>
      </main>
    </div>
  );
}
