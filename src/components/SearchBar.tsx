import React, { useState, useRef, useEffect } from 'react';
import { MonthData, PostItem, TagType, ConferenceType } from '../types';
import { TAG_CONFIGS, CONFERENCE_CONFIGS } from '../data/initialData';
import { Search, X, CheckCircle2, Clock } from 'lucide-react';

interface SearchResult {
  post: PostItem;
  monthIndex: number;
  monthName: string;
  year?: number;
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
    if (!query || query.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const q = query.toLowerCase().trim();
    const found: SearchResult[] = [];

    if (!Array.isArray(months)) {
      setResults([]);
      return;
    }

    months.forEach((month) => {
      if (!month || !Array.isArray(month.items)) return;

      month.items.forEach((post) => {
        if (!post) return;

        const postTags: string[] = Array.isArray(post.tags) && post.tags.length > 0
          ? post.tags
          : (post.tag ? [post.tag] : ['social']);

        const titleStr = typeof post.title === 'string' ? post.title.toLowerCase() : '';
        const descStr = typeof post.description === 'string' ? post.description.toLowerCase() : '';
        const contentStr = typeof post.contentText === 'string' ? post.contentText.toLowerCase() : '';
        const confStr = typeof post.conference === 'string' ? post.conference.toLowerCase() : '';
        
        const confConfig = post.conference ? CONFERENCE_CONFIGS[post.conference as ConferenceType] : null;
        const confLabel = confConfig?.label ? confConfig.label.toLowerCase() : '';
        const confName = confConfig?.name ? confConfig.name.toLowerCase() : '';

        const matchesTitle = titleStr.includes(q);
        const matchesDesc = descStr.includes(q);
        const matchesContent = contentStr.includes(q);
        const matchesConf = confStr.includes(q) || confLabel.includes(q) || confName.includes(q);

        const matchesTag = postTags.some((t) => {
          if (!t) return false;
          const tagConfig = TAG_CONFIGS[t as TagType];
          const tagLabel = tagConfig?.label ? tagConfig.label.toLowerCase() : '';
          return tagLabel.includes(q) || String(t).toLowerCase().includes(q);
        });

        const monthNameStr = typeof month.name === 'string' ? month.name.toLowerCase() : '';
        const matchesMonth = monthNameStr.includes(q);

        if (matchesTitle || matchesDesc || matchesContent || matchesTag || matchesConf || matchesMonth) {
          found.push({
            post,
            monthIndex: typeof month.index === 'number' ? month.index : 0,
            monthName: month.name || 'Месяц',
            year: month.year,
          });
        }
      });
    });

    setResults(found.slice(0, 10));
    setIsOpen(true);
  }, [query, months]);

  const handleSelect = (result: SearchResult) => {
    if (!result || !result.post) return;
    onSelectResult(result.monthIndex, result.post.id);
    setQuery('');
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'Enter' && results.length > 0) {
      handleSelect(results[0]);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-xs">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim().length >= 2 && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Поиск постов..."
          className="w-full pl-9 pr-8 py-2 rounded-full border border-slate-200 bg-slate-50 text-xs font-medium text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-300 transition-all"
        />
        {query && (
          <button
            type="button"
            onClick={() => { setQuery(''); setIsOpen(false); }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
            aria-label="Очистить поиск"
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
            <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
              {results.map((result) => {
                if (!result || !result.post) return null;
                const post = result.post;
                const confKey = (post.conference as ConferenceType) || 'AD';
                const confConfig = CONFERENCE_CONFIGS[confKey] || {
                  id: confKey,
                  label: post.conference || 'Конференция',
                  shortLabel: post.conference || 'CONF',
                  name: post.conference || 'Конференция',
                  color: '#6366F1',
                  bgColor: 'bg-indigo-50 text-indigo-700',
                  borderColor: 'border-indigo-400',
                  textColor: 'text-indigo-700',
                  description: '',
                };

                const postTags: string[] = Array.isArray(post.tags) && post.tags.length > 0
                  ? post.tags
                  : (post.tag ? [post.tag] : ['social']);

                return (
                  <button
                    key={post.id || `${result.monthIndex}-${post.day}-${post.title}`}
                    type="button"
                    onClick={() => handleSelect(result)}
                    className="w-full px-3.5 py-2.5 text-left hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer block group"
                  >
                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                      <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${confConfig.bgColor || 'bg-slate-100 text-slate-800'}`}>
                        {confConfig.shortLabel || post.conference || 'AD'}
                      </span>
                      <div className="flex items-center gap-1">
                        {postTags.map((t) => {
                          const tagConfig = TAG_CONFIGS[t as TagType];
                          return (
                            <span
                              key={t}
                              className="w-2 h-2 rounded-full inline-block shrink-0"
                              style={{ backgroundColor: tagConfig?.color || '#64748B' }}
                              title={tagConfig?.label || t}
                            />
                          );
                        })}
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium truncate">
                        {result.year ? `${result.year} • ` : ''}{result.monthName}{post.day ? `, день ${post.day}` : ''}
                      </span>
                      {post.status === 'published' ? (
                        <span className="ml-auto text-[8.5px] font-bold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded flex items-center gap-0.5">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          Готово
                        </span>
                      ) : (
                        <span className="ml-auto text-[8.5px] font-bold text-slate-500 bg-slate-100 px-1 py-0.2 rounded flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          Запланирован
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                      {post.title || 'Без названия'}
                    </p>
                    {post.description ? (
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                        {post.description}
                      </p>
                    ) : null}
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
