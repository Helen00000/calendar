import React from 'react';
import { MonthData, TagType, ConferenceType } from '../types';
import { TAG_CONFIGS, CONFERENCE_CONFIGS } from '../data/initialData';
import { BarChart3, PieChart, TrendingUp, Layers } from 'lucide-react';

interface AnnualAnalyticsProps {
  months: MonthData[];
  year?: number;
}

export const AnnualAnalytics: React.FC<AnnualAnalyticsProps> = ({ months, year }) => {
  const displayYear = year || (months[0]?.year ?? 2026);

  // 🔧 Фильтруем месяцы строго по выбранному году
  const yearMonths = months.filter((m) => m.year === displayYear);

  let totalPublications = 0;
  let publishedPublications = 0;
  let totalUniquePosts = 0;

  const confCounts: Record<ConferenceType, number> = { AD: 0, SQA: 0, TWD: 0 };
  const tagCounts: Record<TagType, number> = {
    email: 0,
    telegram: 0,
    social: 0,
    article: 0,
    video: 0,
    reels: 0,
  };

  yearMonths.forEach((m) => {
    m.items.forEach((item) => {
      totalUniquePosts += 1;
      const postTags = item.tags?.length ? item.tags : (item.tag ? [item.tag] : ['social']);
      totalPublications += postTags.length;
      if (item.status === 'published') {
        publishedPublications += postTags.length;
      }
      if (item.conference && confCounts[item.conference] !== undefined) {
        confCounts[item.conference] += 1;
      } else {
        confCounts.AD += 1;
      }
      postTags.forEach((t) => {
        if (tagCounts[t] !== undefined) {
          tagCounts[t] += 1;
        }
      });
    });
  });

  const maxMonthlyPublications = Math.max(
    ...yearMonths.map((m) => m.items.reduce((acc, item) => acc + (item.tags?.length || (item.tag ? 1 : 1)), 0)),
    5
  );

  return (
    <div className="w-full bg-[#F8F9FA] rounded-2xl sm:rounded-3xl border border-black/5 shadow-xl p-4 sm:p-6 lg:p-8 my-6 sm:my-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8 pb-4 sm:pb-6 border-b border-black/5">
        <div>
          <div className="flex items-center gap-2 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">
            <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-900" />
            <span>Аналитика ИТ-Конференций</span>
          </div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-950">
            Аналитика контента {displayYear}: AD • SQA • TWD
          </h2>
        </div>
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <div className="px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-2xl sm:rounded-full bg-white border border-black/5 text-center shadow-2xs">
            <div className="text-[8px] sm:text-[9px] text-slate-400 font-bold uppercase tracking-widest">Всего публикаций</div>
            <div className="text-base sm:text-lg font-black text-slate-950">{totalPublications}</div>
          </div>
          <div className="px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-2xl sm:rounded-full bg-emerald-50 border border-emerald-200 text-center shadow-2xs">
            <div className="text-[8px] sm:text-[9px] text-emerald-600 font-bold uppercase tracking-widest">
              Опубликовано
            </div>
            <div className="text-base sm:text-lg font-black text-emerald-600">
              {publishedPublications}{' '}
              <span className="text-[10px] sm:text-xs font-normal">
                ({totalPublications > 0 ? Math.round((publishedPublications / totalPublications) * 100) : 0}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        <div className="lg:col-span-2 space-y-6 sm:space-y-8">
          {/* Monthly Posts Volume Chart */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-slate-950" />
                  <span>Объем Публикаций по Месяцам</span>
                </h3>
                <span className="sm:hidden text-[10px] font-bold text-slate-600">
                  ↔ скролл
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold">
                {(Object.keys(TAG_CONFIGS) as TagType[]).map((tagKey) => {
                  const cfg = TAG_CONFIGS[tagKey];
                  return (
                    <div key={tagKey} className="flex items-center gap-1 text-slate-600">
                      <span
                        className="w-2 h-2 rounded-full inline-block"
                        style={{ backgroundColor: cfg.color }}
                      />
                      <span>{cfg.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="overflow-x-auto pb-1.5 -mx-1 px-1 sm:mx-0 sm:px-0">
              <div className="h-52 sm:h-56 flex items-end justify-between gap-1.5 sm:gap-2 pt-8 sm:pt-10 pb-2 px-2 sm:px-3 border-b border-black/5 bg-white/50 rounded-2xl min-w-[560px] sm:min-w-full">
                {yearMonths.map((m) => {
                  const monthTotalPubs = m.items.reduce(
                    (acc, item) => acc + (item.tags?.length || (item.tag ? 1 : 1)),
                    0
                  );
                  const heightPercent = Math.max(
                    Math.round((monthTotalPubs / maxMonthlyPublications) * 100),
                    8
                  );
                  const monthTagCounts: Partial<Record<TagType, number>> = {};
                  m.items.forEach((item) => {
                    const postTags = item.tags?.length ? item.tags : (item.tag ? [item.tag] : ['social']);
                    postTags.forEach((t) => {
                      monthTagCounts[t] = (monthTagCounts[t] || 0) + 1;
                    });
                  });
                  const activeTags = (Object.keys(monthTagCounts) as TagType[]).filter(
                    (t) => (monthTagCounts[t] || 0) > 0
                  );
                  const tooltipDetails =
                    activeTags.length > 0
                      ? activeTags.map((t) => `${TAG_CONFIGS[t]?.label}: ${monthTagCounts[t]}`).join(', ')
                      : 'Нет постов';

                  return (
                    <div
                      key={m.index}
                      className="flex-1 flex flex-col items-center gap-1.5 sm:gap-2 group relative h-full justify-end min-w-[36px] sm:min-w-0"
                    >
                      <div className="opacity-0 group-hover:opacity-100 absolute -top-12 bg-slate-950 text-white text-[10px] font-bold px-3 py-1.5 rounded-xl pointer-events-none transition-opacity z-20 whitespace-nowrap shadow-lg text-center">
                        <div className="font-extrabold">
                          {m.name}: {monthTotalPubs} публ.
                        </div>
                        <div className="text-[9px] text-slate-300 font-normal">{tooltipDetails}</div>
                      </div>
                      <div
                        className="w-full max-w-[26px] sm:max-w-[28px] rounded-t-lg overflow-hidden flex flex-col-reverse bg-slate-200 transition-all shadow-2xs"
                        style={{ height: `${heightPercent}%` }}
                      >
                        {monthTotalPubs > 0 ? (
                          activeTags.map((tagKey) => {
                            const tagCount = monthTagCounts[tagKey] || 0;
                            const tagPercent = (tagCount / monthTotalPubs) * 100;
                            const tagConfig = TAG_CONFIGS[tagKey];
                            return (
                              <div
                                key={tagKey}
                                className="w-full transition-all hover:brightness-125 relative group/tag"
                                style={{
                                  height: `${tagPercent}%`,
                                  backgroundColor: tagConfig?.color || '#64748B',
                                }}
                                title={`${tagConfig?.label}: ${tagCount}`}
                              />
                            );
                          })
                        ) : (
                          <div className="w-full h-full bg-slate-200/50" />
                        )}
                      </div>
                      <span className="text-[10.5px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-600 whitespace-nowrap">
                        {m.shortName}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Conference Breakdown */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>Распределение по Конференциям (инфоповоды)</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {(Object.keys(CONFERENCE_CONFIGS) as ConferenceType[]).map((confKey) => {
                const conf = CONFERENCE_CONFIGS[confKey];
                const count = confCounts[confKey];
                const percentage =
                  totalUniquePosts > 0 ? Math.round((count / totalUniquePosts) * 100) : 0;
                return (
                  <div
                    key={confKey}
                    className={`p-4 rounded-2xl border ${conf.bgColor} ${conf.borderColor} space-y-2`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-black uppercase tracking-wider ${conf.textColor}`}
                      >
                        {conf.label}
                      </span>
                      <span className="text-xs font-black text-slate-900">
                        {count} ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-black/10 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${percentage}%`, backgroundColor: conf.color }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium line-clamp-1">
                      {conf.name} — {conf.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content Tag Breakdown */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-900 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-slate-950" />
            <span>Каналы и форматы</span>
          </h3>
          <div className="space-y-3">
            {(Object.keys(TAG_CONFIGS) as TagType[]).map((tagKey) => {
              const config = TAG_CONFIGS[tagKey];
              const count = tagCounts[tagKey];
              const percentage =
                totalPublications > 0 ? Math.round((count / totalPublications) * 100) : 0;
              return (
                <div key={tagKey} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
                    <span className="flex items-center gap-1.5" style={{ color: config.color }}>
                      <span
                        className="w-2.5 h-2.5 rounded-full inline-block"
                        style={{ backgroundColor: config.color }}
                      />
                      <span>{config.label}</span>
                    </span>
                    <span className="text-slate-600 font-extrabold">
                      {count} ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: config.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};