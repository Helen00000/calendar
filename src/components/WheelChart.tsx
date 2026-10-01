import React, { useState, useEffect } from 'react';
import { MonthData, TagType, ConferenceFilterType, ConferenceType } from '../types';
import { TAG_CONFIGS, CONFERENCE_CONFIGS, CONFERENCE_EVENTS } from '../data/initialData';
import { Sparkles, Filter, Layers, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
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
  onChangeYear?: (year: number) => void;
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
  onChangeYear,
}) => {
  const [hoveredMonthIndex, setHoveredMonthIndex] = useState<number | null>(null);
  const [showMobileCallouts, setShowMobileCallouts] = useState(false);
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleMonthClick = (index: number) => {
    onSelectMonth(index);
    setTimeout(() => {
      const calendarElem = document.getElementById('month-calendar');
      if (calendarElem) calendarElem.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const size = 1000;
  const center = size / 2;
  const outerRadius = 290;
  const innerRadius = 162;
  const calloutRadius = 352;
  const totalPosts = months.reduce((acc, m) => acc + m.items.length, 0);

  // Responsive viewBox: on mobile without callouts, crop tightly to the donut ring so it appears big and clear
  const viewBox = !isExportMode && isMobile && !showMobileCallouts
    ? '170 170 660 660'
    : `0 0 ${size} ${size}`;

  const selectedMonth = months[selectedMonthIndex] || months[0];
  const selectedMonthFilteredItems = selectedMonth
    ? selectedMonth.items.filter((i) => {
        const postTags = i.tags?.length ? i.tags : (i.tag ? [i.tag] : ['social']);
        const matchesTag = selectedTagFilter === 'all' || postTags.includes(selectedTagFilter);
        const matchesConf = selectedConferenceFilter === 'all' || i.conference === selectedConferenceFilter;
        return matchesTag && matchesConf;
      })
    : [];

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
    <div className="relative w-full max-w-7xl mx-auto flex flex-col items-center justify-center py-2 sm:py-4 px-2 sm:px-4">
      {!isExportMode && (
        <div className="w-full bg-white p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-black/5 shadow-2xs space-y-3 sm:space-y-4 mb-4 sm:mb-6">
          {/* Conferences Filter Bar */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 pb-3 border-b border-black/5">
            <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-slate-800 shrink-0 mr-1 sm:mr-2">
              <Layers className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>Конференции:</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <button
                onClick={() => onFilterConference('all')}
                className={`px-3 sm:px-4 py-1.5 rounded-full text-[11px] sm:text-xs font-bold uppercase tracking-wider transition-all border cursor-pointer ${
                  selectedConferenceFilter === 'all'
                    ? 'bg-slate-950 text-white border-slate-950 shadow-xs'
                    : 'bg-slate-100 text-slate-700 border-black/5 hover:bg-slate-200'
                }`}
              >
                Все ({totalPosts})
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
                    className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-full text-[11px] sm:text-xs font-bold uppercase tracking-wider transition-all border cursor-pointer ${
                      isSelected ? 'ring-2 ring-slate-950 shadow-xs' : 'bg-white border-black/10 hover:bg-slate-50'
                    } ${config.bgColor}`}
                  >
                    <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full shrink-0" style={{ backgroundColor: config.color }} />
                    <span>{config.shortLabel}</span>
                    <span className="opacity-80 font-bold">({confCount})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Channels Filter Bar */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-slate-500 shrink-0 mr-1 sm:mr-2">
              <Filter className="w-4 h-4 text-slate-900 shrink-0" />
              <span>Каналы:</span>
            </div>
            <div className="flex flex-wrap items-center gap-1 sm:gap-2">
              <button
                onClick={() => onFilterTag('all')}
                className={`px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  selectedTagFilter === 'all'
                    ? 'bg-slate-950 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Все
              </button>
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
                    className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-wider transition-all border cursor-pointer ${
                      isSelected ? 'ring-2 ring-slate-950 shadow-xs' : 'bg-white border-black/5 hover:bg-slate-50'
                    } ${config.bgColor}`}
                  >
                    <span className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full shrink-0" style={{ backgroundColor: config.color }} />
                    <span>{config.label}</span>
                    <span className="opacity-75 font-bold">({tagCount})</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Wheel SVG Container */}
      <div className="relative w-full max-w-[960px] lg:max-w-[1040px] flex items-center justify-center overflow-visible select-none my-2 sm:my-4">
        <svg
          viewBox={viewBox}
          className="w-full h-auto overflow-visible drop-shadow-xs"
        >
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
                  const labelRadius = rOuter - 32;
                  const pos = polarToCartesian(center, center, labelRadius, midAngle);
                  return (
                    <g transform={`translate(${pos.x}, ${pos.y})`}>
                      <text
                        textAnchor="middle" dominantBaseline="central"
                        className={`text-[13px] font-black uppercase tracking-widest pointer-events-none transition-colors ${
                          isSelected || isHovered ? 'fill-white' : 'fill-slate-800'
                        }`}
                      >{month.shortName}</text>
                    </g>
                  );
                })()}
                {confEvent && (() => {
                  const eventRadius = rInner + 28;
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
                  const badgeRadius = rInner + 24;
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

          {/* Peripheral Month Callouts (Always visible on desktop and export; toggleable on small phones) */}
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
            const xExtend = isRightSide ? pMid.x + 14 : pMid.x - 14;
            const pEnd = { x: xExtend, y: pMid.y };
            const cardWidth = 124;
            const cardX = isRightSide ? pEnd.x + 2 : pEnd.x - (cardWidth + 2);
            const cardY = pEnd.y - 28;

            return (
              <g
                key={`callout-${month.index}`}
                className={`transition-all duration-300 ${
                  isExportMode || showMobileCallouts ? 'block' : 'hidden md:block'
                }`}
              >
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

          {/* Center Info Hub - Zero hover scale/animation to avoid disturbing user */}
          <g className="select-none">
            <circle cx={center} cy={center} r={innerRadius - 4} className="fill-white stroke-slate-200" strokeWidth="1.5" />
            <foreignObject
              x={center - innerRadius + 8}
              y={center - innerRadius + 8}
              width={(innerRadius - 8) * 2}
              height={(innerRadius - 8) * 2}
              className="overflow-visible pointer-events-auto"
            >
              <div className="w-full h-full flex flex-col items-center justify-center text-center p-2.5 sm:p-3 select-none">
                {/* Year Switcher with Left / Right Arrows */}
                <div className="flex items-center justify-center gap-1 sm:gap-2 mb-0.5 sm:mb-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onChangeYear) {
                        onChangeYear(year === 2026 ? 2027 : 2026);
                      }
                    }}
                    className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 active:scale-95 text-slate-700 flex items-center justify-center transition-colors border border-slate-200/80 shadow-2xs cursor-pointer"
                    title={year === 2026 ? "Переключить на 2027 год" : "Переключить на 2026 год"}
                    aria-label="Предыдущий / переключить год"
                  >
                    <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-800" />
                  </button>

                  <span className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-950 tracking-tight leading-none px-1">
                    {year}
                  </span>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onChangeYear) {
                        onChangeYear(year === 2027 ? 2026 : 2027);
                      }
                    }}
                    className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 active:scale-95 text-slate-700 flex items-center justify-center transition-colors border border-slate-200/80 shadow-2xs cursor-pointer"
                    title={year === 2027 ? "Переключить на 2026 год" : "Переключить на 2027 год"}
                    aria-label="Следующий / переключить год"
                  >
                    <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-800" />
                  </button>
                </div>

                <div className="text-[8px] sm:text-[9px] font-black tracking-widest text-indigo-600 uppercase mb-0.5">
                  AD • SQA • TWD
                </div>

                {(() => {
                  const safeMonth = months[selectedMonthIndex] || months[0];
                  if (!safeMonth) return null;
                  return (
                    <>
                      <button
                        type="button"
                        onClick={() => handleMonthClick(selectedMonthIndex)}
                        className="text-[11px] sm:text-xs font-black text-slate-900 uppercase tracking-tight hover:text-indigo-600 transition-colors cursor-pointer"
                        title="Открыть календарь этого месяца"
                      >
                        {safeMonth.name}
                      </button>
                      <div className="text-[8.5px] sm:text-[9.5px] text-slate-500 font-medium line-clamp-1 mt-0.5 max-w-[190px] px-1">
                        {safeMonth.focusTopic}
                      </div>
                      <div className="mt-1 sm:mt-1.5 pt-1 sm:pt-1.5 border-t border-slate-100 w-full flex items-center justify-around text-slate-800">
                        <div>
                          <div className="text-[7.5px] sm:text-[8.5px] font-bold text-slate-400 uppercase tracking-widest">
                            Постов
                          </div>
                          <div className="text-xs sm:text-sm font-black text-slate-950">
                            {safeMonth.items.length}
                          </div>
                        </div>
                        <div className="w-px h-4 sm:h-5 bg-slate-200" />
                        <div>
                          <div className="text-[7.5px] sm:text-[8.5px] font-bold text-slate-400 uppercase tracking-widest">
                            Готово
                          </div>
                          <div className="text-xs sm:text-sm font-black text-emerald-600 flex items-center justify-center gap-0.5">
                            <CheckCircle2 className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-emerald-500" />
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

      {/* Mobile Dedicated Active Month Detail Card (Provides crystal clear view on phones without needing microscopic zoom) */}
      {!isExportMode && selectedMonth && (
        <div className="md:hidden w-full bg-white border border-black/10 rounded-2xl p-4 shadow-sm my-2">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-black/5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse" />
              <h4 className="text-sm font-black uppercase text-slate-950 tracking-tight">
                {selectedMonth.name} {year}
              </h4>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                {selectedMonthFilteredItems.length} постов
              </span>
              <button
                onClick={() => setShowMobileCallouts(!showMobileCallouts)}
                className="text-[10px] font-bold text-indigo-600 underline cursor-pointer"
              >
                {showMobileCallouts ? 'Скрыть выноски' : 'Все выноски'}
              </button>
            </div>
          </div>
          <div className="text-xs text-slate-600 font-medium mb-3">
            🎯 Фокус: <span className="font-semibold text-slate-900">{selectedMonth.focusTopic}</span>
          </div>
          {selectedMonthFilteredItems.length > 0 ? (
            <div className="grid grid-cols-1 gap-1.5 max-h-40 overflow-y-auto pr-1">
              {selectedMonthFilteredItems.map((item) => {
                const postTags = item.tags?.length ? item.tags : (item.tag ? [item.tag] : ['social']);
                const confConfig = CONFERENCE_CONFIGS[item.conference];
                return (
                  <div
                    key={item.id}
                    onClick={() => handleMonthClick(selectedMonthIndex)}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-black/5 text-xs cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md ${confConfig.bgColor} ${confConfig.textColor}`}>
                        {confConfig.shortLabel}
                      </span>
                      <span className="font-bold text-slate-900 truncate">{item.title}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <span className="text-[10px] text-slate-500 font-medium">{item.day} ч.</span>
                      {item.status === 'published' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-2 text-xs text-slate-400">
              В этом месяце пока нет публикаций под выбранные фильтры
            </div>
          )}
          <button
            onClick={() => handleMonthClick(selectedMonthIndex)}
            className="w-full mt-3 py-2 rounded-xl bg-slate-950 text-white text-xs font-bold uppercase tracking-wider text-center cursor-pointer hover:opacity-90 transition-opacity"
          >
            Открыть календарь месяца →
          </button>
        </div>
      )}

      {!isExportMode && totalPosts === 0 && (
        <div className="w-full mt-4">
          <EmptyState type="first-time" onAction={onOpenAiGenerator} actionLabel="Использовать AI-Стратега" />
        </div>
      )}

      {/* Month Selector Grid Buttons */}
      {!isExportMode && (
        <div className="w-full mt-4 sm:mt-6 grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-1.5 sm:gap-2">
          {months.map((m) => {
            const isSelected = m.index === selectedMonthIndex;
            const confEvent = CONFERENCE_EVENTS.find((e) => e.year === year && e.monthIndex === m.index);
            return (
              <button
                key={m.index}
                onClick={() => handleMonthClick(m.index)}
                className={`p-2 sm:p-2.5 rounded-xl sm:rounded-2xl text-center transition-all border min-h-[44px] flex flex-col justify-center items-center cursor-pointer ${
                  isSelected ? 'bg-slate-950 text-white font-bold border-slate-950 shadow-xs'
                  : confEvent ? 'bg-amber-50 text-slate-900 border-amber-300 hover:bg-amber-100'
                  : 'bg-white border-black/5 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="text-[9px] sm:text-[10px] opacity-75 font-bold uppercase tracking-wider flex items-center justify-center gap-0.5">
                  {m.shortName}
                  {confEvent && <span className="text-[8px] text-amber-600">★</span>}
                </div>
                <div className="text-xs sm:text-sm font-black">{m.items.length}</div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};