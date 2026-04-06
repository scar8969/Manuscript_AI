import { useEffect, useState, useMemo } from 'react';
import { useStore } from '../../store/useStore';
import { api } from '../../services/api';
import { toast } from '../Toast';
import type { Template } from '../../types';

function TemplateCard({ template, onApply, applying }: { template: Template; onApply: (id: string) => void; applying: boolean }) {
  return (
    <div className="p-3 bg-surface-container-lowest hover:bg-surface-container-low transition-all duration-200 animate-fade-in">
      <div className="flex items-start justify-between gap-2">
        <span className="chip bg-secondary-container text-on-secondary-container text-[10px]">
          {template.category}
        </span>
        {template.isDefault && (
          <span className="bg-primary text-on-primary text-[9px] px-1.5 py-0.5 font-bold uppercase tracking-wider rounded-full">
            Default
          </span>
        )}
      </div>

      <h3 className="text-sm font-bold text-on-surface font-['Noto_Serif'] mt-2 leading-tight">
        {template.name}
      </h3>

      {template.description && (
        <p className="text-xs text-on-surface-variant mt-1 line-clamp-2">
          {template.description}
        </p>
      )}

      {template.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {template.tags.slice(0, 4).map((tag) => (
            <span key={tag} className="chip bg-surface-container-high text-on-surface-variant text-[10px]">
              {tag}
            </span>
          ))}
        </div>
      )}

      <button
        onClick={() => onApply(template.id)}
        disabled={applying}
        className="btn-primary text-[10px] px-3 py-1.5 mt-3 w-full flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
      >
        {applying ? (
          <>
            <span className="material-symbols-outlined text-xs animate-spin">refresh</span>
            Applying...
          </>
        ) : (
          <>
            <span className="material-symbols-outlined text-xs">description</span>
            Use Template
          </>
        )}
      </button>
    </div>
  );
}

export function TemplateSelector() {
  const {
    templates, setTemplates, templateLoading, setTemplateLoading,
    applyingTemplateId, setApplyingTemplateId,
    setActiveDesktopLeftView
  } = useStore();

  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setTemplateLoading(true);
    setError(null);
    api.templates.list().then((res) => {
      if (!cancelled) {
        setTemplates(res.data);
        setTemplateLoading(false);
      }
    }).catch((err) => {
      if (!cancelled) {
        setError(err instanceof Error ? err.message : 'Failed to load templates');
        setTemplateLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [setTemplates, setTemplateLoading]);

  const categories = useMemo(() => {
    const cats = new Set(templates.map((t) => t.category));
    return Array.from(cats).sort();
  }, [templates]);

  const filtered = useMemo(() => {
    let list = templates;
    if (activeCategory) {
      list = list.filter((t) => t.category === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          (t.description?.toLowerCase().includes(q)) ||
          t.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    }
    return list;
  }, [templates, activeCategory, search]);

  const handleApply = async (templateId: string) => {
    setApplyingTemplateId(templateId);
    try {
      const full = await api.templates.get(templateId);
      if (full.latex) {
        useStore.getState().setLatexCode(full.latex);
        toast('Template applied', 'success');
        setActiveDesktopLeftView('default');
        useStore.getState().setActiveMobileTab('editor');
      }
    } catch (err) {
      toast('Failed to apply template', 'error');
    } finally {
      setApplyingTemplateId(null);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 ghost-border flex items-center gap-2">
        <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
          dashboard_customize
        </span>
        <span className="font-['Noto_Serif'] text-lg font-bold text-on-surface">Templates</span>
      </div>

      {/* Search */}
      <div className="px-4 pt-3">
        <div className="relative">
          <span className="material-symbols-outlined text-sm text-on-surface-variant absolute left-0 top-1/2 -translate-y-1/2">
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates..."
            className="input-field w-full text-xs pl-6 py-2 outline-none"
          />
        </div>
      </div>

      {/* Category filters */}
      {categories.length > 1 && (
        <div className="px-4 pt-2 flex flex-wrap gap-1.5">
          <button
            onClick={() => setActiveCategory(null)}
            className={`chip text-[10px] px-2.5 py-1 cursor-pointer transition-all duration-200 ${
              !activeCategory
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat === activeCategory ? null : cat)}
              className={`chip text-[10px] px-2.5 py-1 cursor-pointer transition-all duration-200 ${
                activeCategory === cat
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Template list */}
      <div className="flex-1 scroll-area px-4 pt-3 pb-4 overflow-y-auto">
        {templateLoading && (
          <div className="flex flex-col items-center justify-center gap-3 py-16">
            <span className="material-symbols-outlined text-2xl text-on-surface-variant animate-spin">refresh</span>
            <p className="text-xs text-on-surface-variant">Loading templates...</p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center gap-3 py-16">
            <span className="material-symbols-outlined text-2xl text-red-400">warning</span>
            <p className="text-xs text-on-surface-variant">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="btn-secondary text-[10px] px-3 py-1.5 cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {!templateLoading && !error && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 py-16">
            <span className="material-symbols-outlined text-2xl text-on-surface-variant/40">dashboard_customize</span>
            <p className="text-xs text-on-surface-variant">No templates found</p>
          </div>
        )}

        {!templateLoading && !error && (
          <div className="space-y-2">
            {filtered.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onApply={handleApply}
                applying={applyingTemplateId === template.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
