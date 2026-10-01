import React, { useState } from 'react';
import { CONFERENCE_CONFIGS, CONFERENCE_EVENTS } from '../data/initialData';
import { Sparkles, Calendar, MapPin, ChevronDown, ChevronUp } from 'lucide-react';

interface HeroProps {
  totalPosts: number;
  dbSaved: boolean;
  year: number;
  onOpenAiGenerator: () => void;
  onExportPdf: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  totalPosts,
  dbSaved,
  year,
  onOpenAiGenerator,
  onExportPdf,
}) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const yearEvents = CONFERENCE_EVENTS.filter((e) => e.year === year);

  return (
    <section className="relative overflow-hidden pt-6 pb-2 px-3 sm:px-6 lg:px-8 text-center max-w-5xl mx-auto">
      <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-widest bg-white border border-black/10 text-slate-800 shadow-xs mb-3 sm:mb-4">
        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
        <span>Контент-Маркетинг ИТ-Конференций</span>
      </div>

      <h2 className="text-2xl sm:text-5xl font-black text-slate-950 tracking-tight leading-tight mb-2 sm:mb-3">
        Календарь ИТ-Конференций {year} <br className="hidden sm:inline" />
      </h2>
      <h4 className="text-xs sm:text-sm mb-4 sm:mb-6">
        <span className="font-extrabold text-slate-800">Analyst Days • SQA Days • TechWriter Days</span>
      </h4>

      <div className="bg-white border border-black/10 rounded-2xl sm:rounded-3xl p-3 sm:p-5 shadow-xs mb-6 text-left">
        <button
          type="button"
          onClick={() => setIsMobileOpen((prev) => !prev)}
          className="w-full flex items-center justify-between border-b border-black/5 pb-2.5 sm:pb-3 mb-1 sm:mb-3 text-left cursor-pointer sm:cursor-default"
          aria-expanded={isMobileOpen}
        >
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-800 min-w-0">
            <Calendar className="w-4 h-4 text-indigo-600 shrink-0" />
            <span className="sm:hidden truncate">Конференции {year}</span>
            <span className="hidden sm:inline truncate">Календарь Предстоящих Конференций {year}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold sm:hidden">
              {yearEvents.length}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="hidden sm:inline text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {yearEvents.length} Событий Года
            </span>
            <div className="sm:hidden flex items-center gap-1 text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-xl">
              <span>{isMobileOpen ? 'Свернуть' : 'Раскрыть'}</span>
              {isMobileOpen ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </div>
          </div>
        </button>

        {/* На мобильных по умолчанию свернуто, на десктопе всегда открыто */}
        <div className={`${isMobileOpen ? 'block' : 'hidden'} sm:block`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-2.5 pt-2 sm:pt-0">
            {yearEvents.map((event) => {
              const conf = CONFERENCE_CONFIGS[event.conference];
              return (
                <div
                  key={event.id}
                  className={`p-3 rounded-2xl border ${conf.bgColor} ${conf.borderColor} flex flex-col justify-between transition-all hover:scale-[1.02] shadow-2xs`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5 gap-1">
                      <span className={`text-[10px] font-black uppercase tracking-wider ${conf.textColor} shrink-0`}>
                        {conf.shortLabel}
                      </span>
                      <span className="flex items-center gap-0.5 text-[9px] font-bold text-slate-500 truncate">
                        <MapPin className="w-2.5 h-2.5 shrink-0" />
                        <span className="truncate">{event.location}</span>
                      </span>
                    </div>
                    <div className="text-xs font-black text-slate-900 leading-snug">
                      {event.title}
                    </div>
                  </div>
                  <div className="text-[11px] font-bold text-slate-700 mt-2 pt-1.5 border-t border-black/5">
                    📅 {event.dates}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};