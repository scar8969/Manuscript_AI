import { useStore } from '../../store/useStore';

export function StatusBar() {
  const { compileStatus, saveStatus, cursorPosition } = useStore();

  return (
    <footer className="bg-slate-50 text-slate-600 text-[10px] font-medium uppercase tracking-wider fixed bottom-0 w-full h-8 flex items-center justify-between px-4 z-50 ml-20 border-t border-slate-200">
      <div className="flex items-center gap-4">
        <span className={`flex items-center gap-1 ${
          compileStatus === 'success' ? 'text-green-600' :
          compileStatus === 'error' ? 'text-red-600' :
          compileStatus === 'compiling' ? 'text-amber-600' :
          'text-slate-400'
        }`}>
          <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>
            {compileStatus === 'success' ? 'check_circle' :
             compileStatus === 'error' ? 'error' :
             compileStatus === 'compiling' ? 'pending' : 'circle'}
          </span>
          {compileStatus === 'compiling' ? 'Compiling' :
           compileStatus === 'error' ? 'Failed' :
           compileStatus === 'success' ? 'Compile Status: Success' :
           'Ready'}
        </span>
        <span className="text-slate-400">|</span>
        <span>
          {saveStatus === 'saving' ? 'Saving...' :
           saveStatus === 'saved' ? 'Saved' :
           saveStatus === 'error' ? 'Save Failed' : ''}
        </span>
        {saveStatus && <span className="text-slate-400">|</span>}
        <span className="text-slate-600">Line {cursorPosition.line}, Col {cursorPosition.column}</span>
        <span className="text-slate-400">|</span>
        <span className="text-slate-600">UTF-8</span>
      </div>
      <div className="flex items-center gap-6">
        <span className="hover:underline cursor-pointer">Engine: pdfLaTeX</span>
        <span className="text-slate-400">Manuscript AI &copy; 2026</span>
      </div>
    </footer>
  );
}
