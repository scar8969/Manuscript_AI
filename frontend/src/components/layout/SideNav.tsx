import { useStore } from '../../store/useStore';

const navItems = [
  { id: 'editor', icon: 'edit_note', label: 'Editor' },
  { id: 'ai', icon: 'auto_awesome', label: 'AI Features' },
  { id: 'templates', icon: 'dashboard_customize', label: 'Templates' },
] as const;

const bottomItems = [
  { icon: 'settings', label: 'Settings' },
  { icon: 'help', label: 'Help' },
] as const;

export function SideNav() {
  const { activeDesktopLeftView, setActiveDesktopLeftView, setActiveMobileTab } = useStore();

  return (
    <aside className="hidden lg:flex bg-[#111c2d] h-full w-20 flex-col items-center py-6 fixed left-0 top-0 z-40">
      {/* Terminal icon mark */}
      <div className="mb-10 text-white/20">
        <span className="material-symbols-outlined text-3xl">terminal</span>
      </div>

      {/* Main nav items */}
      <nav className="flex flex-col gap-6 items-center flex-1" aria-label="Sidebar navigation">
        {navItems.map((item) => {
          const isActive =
            (item.id === 'ai' && activeDesktopLeftView === 'default' && useStore.getState().activeMobileTab === 'context') ||
            (item.id === 'templates' && activeDesktopLeftView === 'templates') ||
            (item.id === 'editor' && activeDesktopLeftView === 'default' && useStore.getState().activeMobileTab === 'editor');
          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === 'templates') {
                  setActiveDesktopLeftView('templates');
                  setActiveMobileTab('templates');
                } else {
                  setActiveDesktopLeftView('default');
                  setActiveMobileTab(item.id === 'ai' ? 'context' : 'editor');
                }
              }}
              className={`tooltip-wrapper cursor-pointer p-3 transition-all duration-200 focus-ring ${
                isActive
                  ? 'bg-white/10 text-white rounded-lg'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
              data-tooltip={item.label}
              aria-label={item.label}
            >
              <span className="material-symbols-outlined" style={{
                fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0"
              }}>
                {item.icon}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Bottom items */}
      <div className="flex flex-col gap-4 items-center mb-8">
        {bottomItems.map((item) => (
          <button
            key={item.icon}
            className="tooltip-wrapper cursor-pointer text-slate-400 hover:text-white p-3 hover:bg-white/5 transition-all duration-200 focus-ring"
            data-tooltip={item.label}
            aria-label={item.label}
          >
            <span className="material-symbols-outlined">{item.icon}</span>
          </button>
        ))}
      </div>
    </aside>
  );
}
