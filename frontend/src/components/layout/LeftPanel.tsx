import { JobContext } from '../ai/JobContext';
import { AIChat } from '../ai/AIChat';
import { TemplateSelector } from '../ai/TemplateSelector';
import { useStore } from '../../store/useStore';

export function LeftPanel() {
  const { activeDesktopLeftView } = useStore();

  if (activeDesktopLeftView === 'templates') {
    return (
      <section className="col-span-3 bg-surface-container-low flex flex-col h-full">
        <TemplateSelector />
      </section>
    );
  }

  return (
    <section className="col-span-3 bg-surface-container-low flex flex-col h-full">
      {/* Top Half: Job Context */}
      <div className="h-1/2 flex flex-col ghost-border border-r-0">
        <JobContext />
      </div>
      {/* Bottom Half: AI Assistant */}
      <div className="h-1/2 flex flex-col">
        <AIChat />
      </div>
    </section>
  );
}
