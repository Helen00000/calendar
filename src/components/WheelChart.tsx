import React, { useState } from 'react';
import { MonthData, TagType, ConferenceFilterType, ConferenceType } from '../types';
import { TAG_CONFIGS, CONFERENCE_CONFIGS, CONFERENCE_EVENTS } from '../data/initialData';
import { Sparkles, Filter, Layers, CheckCircle2 } from 'lucide-react';
import { EmptyState } from './EmptyState';

interface WheelChartProps {
  months: MonthData[];
  selectedMonthIndex: number;
  onSelectMonth: (index: number) => void;
  selectedTagFilter: TagType | 'all';
  onFilterTag: (tag: TagType | 'all') => void;
  selectedConferenceFilter: ConferenceFilterType;
  onFilterConference: (conf: ConferenceFilterType) => void;
  onOpenAiGenerator: () => void;
  isExportMode?: boolean;
  year: number;
}

export const WheelChart: React.FC<WheelChartProps> = ({
  months,
  selectedMonthIndex,
  onSelectMonth,
  selectedTagFilter,
  onFilterTag,
  selectedConferenceFilter,
  onFilterConference,
  onOpenAiGenerator,
  isExportMode = false,
  year,
}) => {
  const [hoveredMonthIndex, setHoveredMonthIndex] = useState<number | null>(null);

  const handleMonthClick = (index: number) => {
    onSelectMonth(index);
    setTimeout(() => {
      const calendarElem = document.getElementById('month-calendar');
      if (calendarElem) calendarElem.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const size = 1000;
  const center = size / 2;
  const outerRadius = 250;
  const innerRadius = 140;
  const calloutRadius = 315;
  const totalPosts = months.reduce((acc, m) => acc + m.items.length, 0);

  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    };
  };

  const describeDonutSegment = (
    x: number, y: number, innerR: number, outerR: number, startAngle: number, endAngle: number
  ) => {
    const startOuter = polarToCartesian(x, y, outerR, endAngle);
    const endOuter = polarToCartesian(x, y, outerR, startAngle);
    const startInner = polarToCartesian(x, y, innerR, endAngle);
    const endInner = polarToCartesian(x, y, innerR, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    return [
      'M', startOuter.x, startOuter.y,
      'A', outerR, outerR, 0, largeArcFlag, 0, endOuter.x, endOuter.y,
      'L', endInner.x, endInner.y,
      'A', innerR, innerR, 0, largeArcFlag, 1, startInner.x, startInner.y,
      'Z',
    ].join(' ');
  };

  return (
    <div className="relative w-full max-w-7xl mx-auto flex flex-col items-center justify-center py-4 px-2 sm:px-4">
      {!isExportMode && (
        <div className="w-full bg-white p-4 rounded-3xl border border-black/5 shadow-2xs space-y-3 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-black/5">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-800">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>Конференции:</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => onFilterConference('all')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all border ${
                  selectedConferenceFilter === 'all'
                    ? 'bg-slate-950 text-white border-slate-950 shadow-xs'
                    : 'bg-slate-100 text-slate-700 border-black/5 hover:bg-slate-200'
                }`}
              >
                Все Конференции ({totalPosts})
              </button>
              {(Object.keys(CONFERENCE_CONFIGS) as ConferenceType[]).map((confKey) => {
                const config = CONFERENCE_CONFIGS[confKey];
                const confCount = months.reduce(
                  (acc, m) => acc + m.items.filter((i) => i.conference === confKey).length, 0
                );
                const isSelected = selectedConferenceFilter === confKey;
                return (
                  <button
                    key={confKey}
                    onClick={() => onFilterConference(confKey)}
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all border ${
                      isSelected ? 'ring-2 ring-slate-950 shadow-xs' : 'bg-white border-black/10 hover:bg-slate-50'
                    } ${config.bgColor}`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: config.color }} />
                    <span>{config.name} ({config.shortLabel})</span>
                    <span className="opacity-80 font-bold">({confCount})</span>
                  </button>
                );
              })}
            </div>
            <button
              onClick={onOpenAiGenerator}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white bg-slate-950 hover:opacity-90 rounded-full transition-all shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>AI Стратег</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500">
              <Filter className="w-4 h-4 text-slate-900" />
              <span>Каналы:</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <button
                onClick={() => onFilterTag('all')}
                className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all ${
                  selectedTagFilter === 'all'
                    ? 'bg-slate-950 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >Все Каналы</button>
              {(Object.keys(TAG_CONFIGS) as TagType[]).map((tagKey) => {
                const config = TAG_CONFIGS[tagKey];
                const tagCount = months.reduce(
                  (acc, m) => acc + m.items.filter((i) => {
                    const postTags = i.tags?.length ? i.tags : (i.tag ? [i.tag] : ['social']);
                    return postTags.includes(tagKey);
                  }).length, 0
                );
                const isSelected = selectedTagFilter === tagKey;
                return (
                  <button
                    key={tagKey}
                    onClick={() => onFilterTag(tagKey)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all border ${
                      isSelected ? 'ring-2 ring-slate-950 shadow-xs' : 'bg-white border-black/5 hover:bg-slate-50'
                    } ${config.bgColor}`}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: config.color }} />
                    <span>{config.label}</span>
                    <span className="opacity-75 font-bold">({tagCount})</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="relative w-full aspect-square max-w-[950px] flex items-center justify-center overflow-visible select-none">
        <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full overflow-visible drop-shadow-lg">
          <circle cx={center} cy={center} r={outerRadius + 8} className="fill-none stroke-slate-200/80" strokeWidth="1.5" strokeDasharray="4 4" />

          {months.map((month) => {
            const index = month.index;
            const startAngle = index * 30;
            const endAngle = startAngle + 30;
            const midAngle = startAngle + 15;
            const isSelected = selectedMonthIndex === index;
            const isHovered = hoveredMonthIndex === index;
            const confEvent = CONFERENCE_EVENTS.find((e) => e.year === year && e.monthIndex === index);

            const rOuter = isSelected ? outerRadius + 10 : isHovered ? outerRadius + 6 : outerRadius;
            const rInner = isSelected ? innerRadius - 4 : innerRadius;

            let confStroke = 'stroke-slate-200';
            let confFill = index % 2 === 0 ? 'fill-[#F8F9FA]' : 'fill-[#F1F3F5]';
            if (confEvent) {
              if (confEvent.conference === 'AD') { confStroke = 'stroke-orange-500'; confFill = 'fill-orange-500/10'; }
              else if (confEvent.conference === 'SQA') { confStroke = 'stroke-emerald-500'; confFill = 'fill-emerald-500/10'; }
              else if (confEvent.conference === 'TWD') { confStroke = 'stroke-blue-500'; confFill = 'fill-blue-500/10'; }
            }

            return (
              <g
                key={month.index}
                className="cursor-pointer transition-all duration-300 group"
                onClick={() => handleMonthClick(index)}
                onMouseEnter={() => setHoveredMonthIndex(index)}
                onMouseLeave={() => setHoveredMonthIndex(null)}
              >
                <path
                  d={describeDonutSegment(center, center, rInner, rOuter, startAngle + 0.8, endAngle - 0.8)}
                  className={`transition-all duration-300 ${
                    isSelected ? 'fill-slate-950 stroke-slate-950 stroke-2 filter drop-shadow-md'
                    : isHovered ? 'fill-slate-800 stroke-white stroke-1'
                    : `${confFill} ${confStroke} stroke-1.5 hover:fill-slate-200`
                  }`}
                />
                {(() => {
                  const labelRadius = rOuter - 28;
                  const pos = polarToCartesian(center, center, labelRadius, midAngle);
                  return (
                    <g transform={`translate(${pos.x}, ${pos.y})`}>
                      <text
                        textAnchor="middle" dominantBaseline="central"
                        className={`text-[12px] font-black uppercase tracking-widest pointer-events-none transition-colors ${
                          isSelected || isHovered ? 'fill-white' : 'fill-slate-800'
                        }`}
                      >{month.shortName}</text>
                    </g>
                  );
                })()}
                {confEvent && (() => {
                  const eventRadius = rInner + 22;
                  const pos = polarToCartesian(center, center, eventRadius, midAngle);
                  const confConfig = CONFERENCE_CONFIGS[confEvent.conference];
                  return (
                    <g transform={`translate(${pos.x}, ${pos.y})`}>
                      <rect x="-28" y="-10" width="56" height="20" rx="10" fill={confConfig.color} className="stroke-white stroke-1.5 shadow-sm" />
                      <text x="0" y="1" textAnchor="middle" dominantBaseline="central" fill="#FFFFFF" className="text-[9px] font-extrabold uppercase tracking-tight pointer-events-none">
                        ★ {confEvent.conference}
                      </text>
                    </g>
                  );
                })()}
                {month.items.length > 0 && !confEvent && (() => {
                  const badgeRadius = rInner + 18;
                  const pos = polarToCartesian(center, center, badgeRadius, midAngle);
                  return (
                    <circle
                      cx={pos.x} cy={pos.y} r="7"
                      className={`${isSelected ? 'fill-amber-400' : 'fill-slate-800'} pointer-events-none transition-all`}
                    />
                  );
                })()}
              </g>
            );
          })}

          {months.map((month) => {
            const index = month.index;
            const midAngle = index * 30 + 15;
            const isSelected = selectedMonthIndex === index;
            const isHovered = hoveredMonthIndex === index;
            const filteredItems = month.items.filter((i) => {
              const postTags = i.tags?.length ? i.tags : (i.tag ? [i.tag] : ['social']);
              const matchesTag = selectedTagFilter === 'all' || postTags.includes(selectedTagFilter);
              const matchesConf = selectedConferenceFilter === 'all' || i.conference === selectedConferenceFilter;
              return matchesTag && matchesConf;
            });

            const pStart = polarToCartesian(center, center, outerRadius + 6, midAngle);
            const pMid = polarToCartesian(center, center, calloutRadius, midAngle);
            const isRightSide = pMid.x >= center;
            const xExtend = isRightSide ? pMid.x + 24 : pMid.x - 24;
            const pEnd = { x: xExtend, y: pMid.y };
            const cardWidth = 148;
            const cardX = isRightSide ? pEnd.x + 4 : pEnd.x - (cardWidth + 4);
            const cardY = pEnd.y - 28;

            return (
              <g key={`callout-${month.index}`} className="transition-all duration-300">
                <path
                  d={`M ${pStart.x} ${pStart.y} L ${pMid.x} ${pMid.y} L ${pEnd.x} ${pEnd.y}`}
                  fill="none"
                  className={`transition-all duration-300 ${
                    isSelected ? 'stroke-slate-950 stroke-2'
                    : isHovered ? 'stroke-slate-700 stroke-1.5'
                    : 'stroke-slate-300 stroke-1'
                  }`}
                />
                <circle cx={pStart.x} cy={pStart.y} r={isSelected ? 3.5 : 2} className={isSelected ? 'fill-slate-950' : 'fill-slate-400'} />
                <foreignObject
                  x={cardX} y={cardY} width={cardWidth} height="110"
                  className="overflow-visible pointer-events-auto cursor-pointer"
                  onClick={() => handleMonthClick(month.index)}
                >
                  <div
                    className={`p-2 rounded-xl text-left transition-all border ${
                      isSelected ? 'bg-slate-950 text-white border-slate-950 shadow-lg scale-105'
                      : isHovered ? 'bg-slate-900 text-white border-slate-800 shadow-md'
                      : 'bg-white/95 text-slate-900 border-black/10 shadow-2xs hover:border-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1 pb-1 border-b border-black/5">
                      <span className="text-[11px] font-extrabold truncate">{month.name}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>{filteredItems.length}</span>
                    </div>
                    {filteredItems.length > 0 ? (
                      <div className="space-y-1 max-h-[70px] overflow-hidden">
                        {filteredItems.slice(0, 4).map((item) => {
                          const postTags = item.tags?.length ? item.tags : (item.tag ? [item.tag] : ['social']);
                          const primaryTagConfig = TAG_CONFIGS[postTags[0]] || TAG_CONFIGS.social;
                          return (
                            <div
                              key={item.id}
                              className={`flex items-center justify-between gap-1 px-1.5 py-0.5 rounded-md text-[9.5px] font-bold border transition-colors ${
                                isSelected ? 'bg-white/10 border-white/20 text-white' : 'bg-slate-50 border-black/5 text-slate-800'
                              }`}
                            >
                              <div className="flex items-center gap-1 min-w-0">
                                <div className="flex gap-0.5 shrink-0">
                                  {postTags.map(t => (
                                    <span key={t} className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: TAG_CONFIGS[t]?.color || '#64748B' }} title={TAG_CONFIGS[t]?.label} />
                                  ))}
                                </div>
                                <span className="truncate">{primaryTagConfig.label}{postTags.length > 1 ? '...' : ''}</span>
                              </div>
                              {item.status === 'published' && <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500 shrink-0" />}
                            </div>
                          );
                        })}
                        {filteredItems.length > 4 && (
                          <div className="text-[8.5px] font-bold text-slate-400 text-center">+{filteredItems.length - 4} ещё</div>
                        )}
                      </div>
                    ) : (
                      <div className="text-[9px] text-slate-400 font-medium py-0.5 text-center">0 постов</div>
                    )}
                  </div>
                </foreignObject>
              </g>
            );
          })}

          <g className="cursor-pointer transition-transform duration-300 hover:scale-105" onClick={() => handleMonthClick(selectedMonthIndex)}>
            <circle cx={center} cy={center} r={innerRadius - 4} className="fill-white stroke-black/10 shadow-xl" strokeWidth="1.5" />
            <foreignObject x={center - innerRadius + 10} y={center - innerRadius + 10} width={(innerRadius - 10) * 2} height={(innerRadius - 10) * 2} className="pointer-events-none">
              <div className="w-full h-full flex flex-col items-center justify-center text-center p-3">
                <div className="text-3xl font-black text-slate-950 tracking-tight leading-none mb-1">{year}</div>
                <div className="text-[9px] font-black tracking-widest text-indigo-600 uppercase mb-1">AD • SQA • TWD</div>
                {(() => {
const safeMonth = months[selectedMonthIndex] || months[0];
if (!safeMonth) return null;
return (
<>
<div className="text-xs font-black text-slate-900 uppercase tracking-tight">
{safeMonth.name}
</div>
<div className="text-[10px] text-slate-500 font-medium line-clamp-1 mt-0.5">
{safeMonth.focusTopic}
</div>
<div className="mt-2 pt-2 border-t border-black/5 w-full flex items-center justify-around text-slate-800">
<div>
<div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Постов</div>
<div className="text-sm font-black text-slate-950">
{safeMonth.items.length}
</div>
</div>
<div className="w-px h-6 bg-black/5" />
<div>
<div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Готово</div>
<div className="text-sm font-black text-emerald-600 flex items-center justify-center gap-0.5">
<CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
<span>
{safeMonth.items.filter((i) => i.status === 'published').length}
</span>
</div>
</div>
</div>
</>
);
})()}
              </div>
            </foreignObject>
          </g>
        </svg>
      </div>

      {!isExportMode && totalPosts === 0 && (
        <div className="w-full mt-4">
          <EmptyState type="first-time" onAction={onOpenAiGenerator} actionLabel="Использовать AI-Стратега" />
        </div>
      )}

      {!isExportMode && (
        <div className="w-full mt-6 grid grid-cols-6 sm:grid-cols-12 gap-1.5 sm:gap-2">
          {months.map((m) => {
            const isSelected = m.index === selectedMonthIndex;
            const confEvent = CONFERENCE_EVENTS.find((e) => e.year === year && e.monthIndex === m.index);
            return (
              <button
                key={m.index}
                onClick={() => handleMonthClick(m.index)}
                className={`p-2.5 rounded-2xl text-center transition-all border ${
                  isSelected ? 'bg-slate-950 text-white font-bold border-slate-950 shadow-sm'
                  : confEvent ? 'bg-amber-50 text-slate-900 border-amber-300 hover:bg-amber-100'
                  : 'bg-white border-black/5 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="text-[10px] opacity-75 font-bold uppercase tracking-wider flex items-center justify-center gap-0.5">
                  {m.shortName}
                  {confEvent && <span className="text-[8px] text-amber-600">★</span>}
                </div>
                <div className="text-xs font-black">{m.items.length}</div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};