import React from 'react';
import { CONFERENCE_CONFIGS, CONFERENCE_EVENTS } from '../data/initialData';
import { Sparkles, Calendar, MapPin } from 'lucide-react';

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
  const yearEvents = CONFERENCE_EVENTS.filter((e) => e.year === year);

  return (
    <section className="relative overflow-hidden pt-6 pb-2 px-4 sm:px-6 lg:px-8 text-center max-w-5xl mx-auto">
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest bg-white border border-black/10 text-slate-800 shadow-xs mb-4">
        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
        <span>Контент-Маркетинг ИТ-Конференций</span>
      </div>

      <h2 className="text-3xl sm:text-5xl font-black text-slate-950 tracking-tight leading-tight mb-3">
        Календарь ИТ-Конференций {year} <br className="hidden sm:inline" />
      </h2>
      <h4>
        <span className="font-extrabold text-slate-800">Analyst Days • SQA Days • TechWriter Days</span>
      </h4>

      <div className="bg-white border border-black/10 rounded-3xl p-4 sm:p-5 shadow-xs mb-6 text-left">
        <div className="flex items-center justify-between border-b border-black/5 pb-3 mb-3">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-800">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <span>Календарь Предстоящих Конференций {year}</span>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {yearEvents.length} Событий Года
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {yearEvents.map((event) => {
            const conf = CONFERENCE_CONFIGS[event.conference];
            return (
              <div
                key={event.id}
                className={`p-3 rounded-2xl border ${conf.bgColor} ${conf.borderColor} flex flex-col justify-between transition-all hover:scale-[1.02]`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[10px] font-black uppercase tracking-wider ${conf.textColor}`}>
                      {conf.shortLabel}
                    </span>
                    <span className="flex items-center gap-0.5 text-[9px] font-bold text-slate-500">
                      <MapPin className="w-2.5 h-2.5" />
                      {event.location}
                    </span>
                  </div>
                  <div className="text-xs font-black text-slate-900 leading-snug">
                    {event.title}
                  </div>
                </div>
                <div className="text-[11px] font-bold text-slate-700 mt-2 pt-1 border-t border-black/5">
                  📅 {event.dates}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};