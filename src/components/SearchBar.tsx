import React, { useState, useRef, useEffect } from 'react';
import { MonthData, PostItem } from '../types';
import { TAG_CONFIGS, CONFERENCE_CONFIGS } from '../data/initialData';
import { Search, X, Calendar } from 'lucide-react';

interface SearchResult {
  post: PostItem;
  monthIndex: number;
  monthName: string;
}

interface SearchBarProps {
  months: MonthData[];
  onSelectResult: (monthIndex: number, postId: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ months, onSelectResult }) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const q = query.toLowerCase().trim();
    const found: SearchResult[] = [];

    months.forEach((month) => {
      month.items.forEach((post) => {
        const postTags = post.tags?.length ? post.tags : (post.tag ? [post.tag] : ['social']);
        const matchesTitle = post.title.toLowerCase().includes(q);
        const matchesDesc = post.description?.toLowerCase().includes(q);
        const matchesTag = postTags.some((t) => TAG_CONFIGS[t]?.label.toLowerCase().includes(q));
        const matchesConf = CONFERENCE_CONFIGS[post.conference]?.label.toLowerCase().includes(q);

        if (matchesTitle || matchesDesc || matchesTag || matchesConf) {
          found.push({ post, monthIndex: month.index, monthName: month.name });
        }
      });
    });

    setResults(found.slice(0, 8));
    setIsOpen(true);
  }, [query, months]);

  const handleSelect = (result: SearchResult) => {
    onSelectResult(result.monthIndex, result.post.id);
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-xs">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          placeholder="Поиск постов..."
          className="w-full pl-9 pr-8 py-2 rounded-full border border-slate-200 bg-slate-50 text-xs font-medium text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-300 transition-all"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setIsOpen(false); }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Dropdown Results */}
      {isOpen && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden z-50 animate-fade-in-up">
          {results.length === 0 ? (
            <div className="p-4 text-center">
              <p className="text-xs text-slate-500 font-medium">
                По запросу «{query}» ничего не найдено
              </p>
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto">
              {results.map((result) => {
                const confConfig = CONFERENCE_CONFIGS[result.post.conference];
                const postTags = result.post.tags?.length ? result.post.tags : (result.post.tag ? [result.post.tag] : ['social']);
                
                return (
                  <button
                    key={result.post.id}
                    onClick={() => handleSelect(result)}
                    className="w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0 cursor-pointer"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${confConfig.bgColor}`}>
                        {result.post.conference}
                      </span>
                      <div className="flex gap-0.5">
                        {postTags.map((t) => (
                          <span
                            key={t}
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: TAG_CONFIGS[t]?.color || '#64748B' }}
                            title={TAG_CONFIGS[t]?.label}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">
  {result.month.year ?? ''} • {result.monthName}, день {result.post.day}
</span>
                    </div>
                    <p className="text-xs font-bold text-slate-900 truncate">{result.post.title}</p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};