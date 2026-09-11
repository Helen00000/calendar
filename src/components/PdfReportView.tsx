import React from 'react';
import { MonthData } from '../types';
import { AnnualAnalytics } from './AnnualAnalytics';
import { TAG_CONFIGS, CONFERENCE_CONFIGS, CONFERENCE_EVENTS } from '../data/initialData';

interface PdfReportViewProps {
  months: MonthData[];
  year?: number;
}

export const PdfReportView: React.FC<PdfReportViewProps> = ({ months, year }) => {
  const displayYear = year || (months[0]?.year ?? 2026);
  const yearEvents = CONFERENCE_EVENTS.filter((e) => e.year === displayYear);

  let totalPublications = 0;
  months.forEach(m => {
    m.items.forEach(item => {
      totalPublications += (item.tags?.length || (item.tag ? 1 : 1));
    });
  });

  return (
    <div
      id="pdf-export-report-container"
      className="bg-white text-slate-900 font-sans p-10 space-y-10 w-[1100px]"
      style={{ backgroundColor: '#FFFFFF', color: '#0F172A' }}
    >
      <div className="border-b-2 border-slate-900 pb-6 flex items-end justify-between">
        <div>
          <div className="text-xs font-black uppercase tracking-widest text-indigo-600 mb-1">
            ИТ-Конференции {displayYear} • Аналитический Отчет по Контент-Стратегии
          </div>
          <h1 className="text-3xl font-black text-slate-950 tracking-tight">
            Analyst Days • SQA Days • TechWriter Days
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Аналитический баланс публикаций, каналов и календарное распределение на {displayYear} год
          </p>
        </div>
        <div className="text-right space-y-1">
          <div className="text-xs font-bold text-slate-500">
            Дата экспорта: {new Date().toLocaleDateString('ru-RU')}
          </div>
          <div className="inline-block px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-black uppercase tracking-wider">
            Всего публикаций: {totalPublications}
          </div>
        </div>
      </div>

      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
        <div className="text-xs font-black uppercase tracking-widest text-slate-700 mb-3">
          📅 Календарь Ключевых ИТ-Событий {displayYear} Года
        </div>
        <div className="grid grid-cols-5 gap-2.5 text-left">
          {yearEvents.map((event) => {
            const conf = CONFERENCE_CONFIGS[event.conference];
            return (
              <div key={event.id} className="p-3 rounded-xl border bg-white border-slate-200 space-y-1">
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-800">
                  {conf.shortLabel} • {event.location}
                </div>
                <div className="text-xs font-black text-slate-900 line-clamp-1">{event.title}</div>
                <div className="text-[10px] font-bold text-slate-500">📅 {event.dates}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-4 pt-2">
        <div className="border-b border-slate-200 pb-2 flex items-center justify-between">
          <h2 className="text-lg font-black uppercase tracking-wider text-slate-950">
            Годовой Баланс Контента и Распределение по Конференциям
          </h2>
          <span className="text-xs font-bold text-slate-500">
            Аналитика каналов, форматов и объема публикаций
          </span>
        </div>
        <AnnualAnalytics months={months} year={displayYear} />
      </div>

      <div className="space-y-4 pt-4">
        <div className="border-b border-slate-200 pb-2">
          <h2 className="text-lg font-black uppercase tracking-wider text-slate-950">
            Сводный План Публикаций по Месяцам
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-4 text-xs">
          {months.map((m) => (
            <div key={`${m.year}-${m.index}`} className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
              <div className="flex items-center justify-between font-black text-slate-900 border-b border-slate-200 pb-1.5">
                <span className="uppercase tracking-wider">{m.name} ({m.shortName})</span>
                <span className="text-slate-500 font-bold">{m.items.reduce((acc, i) => acc + (i.tags?.length || (i.tag ? 1 : 1)), 0)} публ.</span>
              </div>
              <div className="text-[11px] font-medium text-slate-600 mb-1">Фокус: {m.focusTopic}</div>
              {m.items.length > 0 ? (
                <div className="space-y-1">
                  {m.items.map((item) => {
                    const postTags = item.tags?.length ? item.tags : (item.tag ? [item.tag] : ['social']);
                    return (
                      <div key={item.id} className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-white border border-slate-200 text-[10.5px]">
                        <div className="flex flex-wrap items-center gap-1 min-w-0">
                          {postTags.map((t, idx) => {
                            const tc = TAG_CONFIGS[t];
                            return tc ? (
                              <span key={idx} className="flex items-center gap-1 font-bold text-slate-800 shrink-0">
                                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: tc.color }} />
                                {tc.label}{idx < postTags.length - 1 ? ',' : ':'}
                              </span>
                            ) : null;
                          })}
                          <span className="truncate font-medium text-slate-700 ml-1">{item.title}</span>
                        </div>
                        <span className="text-[9.5px] font-bold text-slate-400 shrink-0 ml-2">
                          {item.conference || 'AD'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-[10px] text-slate-400 italic">Нет запланированных публикаций</div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-slate-200 pt-4 text-center text-xs font-bold text-slate-400">
        © {displayYear} ИТ-Конференции: Analyst Days • SQA Days • TechWriter Days — Планер Контент-Стратегии
      </div>
    </div>
  );
};