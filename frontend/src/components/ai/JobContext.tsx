import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { api } from '../../services/api';
import { toast } from '../Toast';
import type { JobAnalysis } from '../../types';

export function JobContext() {
  const { jobContext, setJobContext, analysis, setAnalysis, analysisStatus, setAnalysisStatus } = useStore();
  const [url, setUrl] = useState(jobContext.url);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'input' | 'analysis'>('input');

  const handleScrape = async () => {
    if (!url.trim()) return;
    setLoading(true);
    try {
      const result = await api.scrape(url);
      setJobContext({
        url: result.job.application_url || url,
        title: result.job.title,
        company: result.company?.name || result.job.company || '',
        description: result.job.description || '',
        location: result.job.location,
        salary: result.job.salary,
        jobType: result.job.job_type
      });
      setUrl('');
      toast('Job details scraped successfully', 'success');
    } catch (err: unknown) {
      toast('Failed to scrape job: ' + (err instanceof Error ? err.message : 'Unknown error'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!jobContext.description.trim()) {
      toast('Please paste a job description first', 'error');
      return;
    }
    setAnalysisStatus('analyzing');
    try {
      const result = await api.analyze(jobContext.description);
      setAnalysis(result as JobAnalysis);
      setAnalysisStatus('success');
      setActiveTab('analysis');
      toast('Job analyzed', 'success');
    } catch (err: unknown) {
      setAnalysisStatus('error');
      toast('Analysis failed: ' + (err instanceof Error ? err.message : 'Unknown error'), 'error');
    }
  };

  const hasJobData = jobContext.title || jobContext.company || jobContext.description;

  return (
    <>
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <h2 className="font-headline text-lg font-bold">Job Context</h2>
        {hasJobData && (
          <span className="px-2 py-0.5 bg-secondary-container text-on-secondary-container text-[10px] font-bold uppercase tracking-widest rounded-full">
            Active
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex px-4 ghost-border" role="tablist" aria-label="Job context tabs">
        <button
          role="tab"
          aria-selected={activeTab === 'input'}
          onClick={() => setActiveTab('input')}
          className={`pb-2 px-4 text-xs font-bold border-b-2 uppercase tracking-wider transition-colors duration-200 cursor-pointer ${
            activeTab === 'input' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-primary'
          }`}
        >
          Input
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'analysis'}
          onClick={() => setActiveTab('analysis')}
          className={`pb-2 px-4 text-xs font-medium uppercase tracking-wider transition-colors duration-200 cursor-pointer ${
            activeTab === 'analysis' ? 'border-b-2 border-primary text-primary font-bold' : 'text-on-surface-variant hover:text-primary'
          }`}
        >
          Analysis
        </button>
      </div>

      {/* Content */}
      <div className="scroll-area flex-1" role="tabpanel">
        <div className="p-4 space-y-4">
          {activeTab === 'input' ? (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="label">Target Job URL</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://careers.techcorp.com/senior-engineer"
                    className="input-field flex-1 text-sm px-3 py-2 outline-none"
                    onKeyDown={(e) => e.key === 'Enter' && handleScrape()}
                    aria-label="Job URL input"
                  />
                  <button
                    onClick={handleScrape}
                    disabled={loading || !url.trim()}
                    className="btn-primary text-on-primary text-xs px-4 py-2 disabled:opacity-50 flex items-center gap-1.5 whitespace-nowrap"
                    aria-label="Scrape job posting"
                  >
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: loading ? "'FILL' 1" : "'FILL' 0" }}>
                      {loading ? 'pending' : 'travel_explore'}
                    </span>
                    {loading ? '...' : 'Scrape'}
                  </button>
                </div>
              </div>

              {hasJobData && (
                <div className="p-3 bg-secondary-container/40 space-y-1.5 animate-fade-in">
                  {jobContext.title && (
                    <p className="text-sm font-semibold text-on-surface">{jobContext.title}</p>
                  )}
                  {jobContext.company && (
                    <p className="text-xs text-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">business</span>
                      {jobContext.company}
                    </p>
                  )}
                  {jobContext.location && (
                    <p className="text-xs text-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">location_on</span>
                      {jobContext.location}
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="label">Job Description Paste</label>
                <textarea
                  value={jobContext.description}
                  onChange={(e) => setJobContext({ description: e.target.value })}
                  className="input-field w-full text-sm px-3 py-2 outline-none h-32 resize-none"
                  placeholder="Paste the text here to analyze keywords..."
                  aria-label="Job description"
                />
              </div>

              <button
                onClick={handleAnalyze}
                disabled={analysisStatus === 'analyzing' || !jobContext.description.trim()}
                className="btn-primary text-on-primary text-xs px-4 py-2.5 w-full disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {analysisStatus === 'analyzing' ? 'pending' : 'psychology'}
                </span>
                {analysisStatus === 'analyzing' ? 'Analyzing...' : 'Analyze Job'}
              </button>
            </div>
          ) : (
            <div className="space-y-5 animate-fade-in">
              {!analysis ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <span className="material-symbols-outlined text-3xl text-on-surface-variant/40 mb-3">analytics</span>
                  <p className="text-sm font-medium text-on-surface-variant">No analysis yet</p>
                  <p className="text-xs text-on-surface-variant/70 mt-1 max-w-[200px]">Paste a job description and click "Analyze Job" to extract keywords</p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="label">Keywords</label>
                    <div className="flex flex-wrap gap-1.5">
                      {analysis.keywords?.map((kw, i) => (
                        <span key={i} className="chip bg-secondary-container text-on-secondary-container">{kw}</span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="label">Required Skills</label>
                    <div className="flex flex-wrap gap-1.5">
                      {analysis.requiredSkills?.map((skill, i) => (
                        <span key={i} className="chip bg-error-container text-error">{skill}</span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="label">Preferred Skills</label>
                    <div className="flex flex-wrap gap-1.5">
                      {analysis.preferredSkills?.map((skill, i) => (
                        <span key={i} className="chip bg-surface-container-high text-on-surface-variant">{skill}</span>
                      ))}
                    </div>
                  </div>

                  {analysis.experienceLevel && (
                    <div className="flex items-center gap-2 p-3 bg-surface-container">
                      <span className="material-symbols-outlined text-primary text-lg">signal_cellular_alt</span>
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Experience Level</p>
                        <p className="text-sm font-medium text-on-surface capitalize">{analysis.experienceLevel}</p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
