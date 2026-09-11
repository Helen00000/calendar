import React, { useState, useEffect, useRef } from 'react';
import { MonthData, PostItem, TagType, ConferenceFilterType, ConferenceType } from '../types';
import { TAG_CONFIGS, CONFERENCE_CONFIGS, CONFERENCE_EVENTS } from '../data/initialData';
import {
Plus, ChevronLeft, ChevronRight, LayoutGrid, List,
Mail, Send, Share2, FileText, Video, Film,
CheckCircle2, Clock, Layers, Calendar as CalendarIcon, Trash2,
} from 'lucide-react';
import { EmptyState } from './EmptyState';
import { DayModal } from './DayModal';

interface MonthCalendarProps {
  month: MonthData;
  monthsList: MonthData[];
  onSelectMonth: (index: number) => void;
  onAddPost: (day?: number) => void;
  onEditPost: (post: PostItem) => void;
  onDeletePost?: (postId: string) => void;
  onToggleStatus: (postId: string) => void;
  selectedTagFilter: TagType | 'all';
  selectedConferenceFilter: ConferenceFilterType;
  year: number;
}

export const MonthCalendar: React.FC<MonthCalendarProps> = ({
  month,
  monthsList,
  onSelectMonth,
  onAddPost,
  onEditPost,
  onDeletePost,
  onToggleStatus,
  selectedTagFilter,
  selectedConferenceFilter,
  year,
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeDayFilter, setActiveDayFilter] = useState<number | null>(null);
  const [openedDay, setOpenedDay] = useState<number | null>(null);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
  const prevMonthIndexRef = useRef(month.index);

  useEffect(() => {
    if (prevMonthIndexRef.current !== month.index) {
      setActiveDayFilter(null);
      setDeletingPostId(null);
      prevMonthIndexRef.current = month.index;
    }
  }, [month.index]);

  const monthEvents = CONFERENCE_EVENTS.filter((e) => e.year === year && e.monthIndex === month.index);

  const renderTagIcon = (tag: TagType) => {
    switch (tag) {
      case 'email': return <Mail className="w-3.5 h-3.5" />;
      case 'telegram': return <Send className="w-3.5 h-3.5" />;
      case 'social': return <Share2 className="w-3.5 h-3.5" />;
      case 'article': return <FileText className="w-3.5 h-3.5" />;
      case 'video':
return <Video className="w-3.5 h-3.5" />;
      case 'reels': return <Film className="w-3.5 h-3.5" />;
      default: return <FileText className="w-3.5 h-3.5" />;
    }
  };

  const daysInMonth = month.index === 1
    ? (year % 4 === 0 ? 29 : 28)
    : [3, 5, 8, 10].includes(month.index) ? 30 : 31;
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const firstDayOfWeek = new Date(year, month.index, 1).getDay();
  const firstDayOffset = (firstDayOfWeek + 6) % 7;

  const monthFilteredPosts = month.items.filter((item) => {
    const postTags = item.tags?.length ? item.tags : (item.tag ? [item.tag] : ['social']);
    const matchesTag = selectedTagFilter === 'all' || postTags.includes(selectedTagFilter);
    const matchesConf = selectedConferenceFilter === 'all' || item.conference === selectedConferenceFilter;
    return matchesTag && matchesConf;
  });

  const listPosts = monthFilteredPosts.filter((item) => {
    return activeDayFilter === null || Number(item.day) === Number(activeDayFilter);
  }).sort((a, b) => {
    if (a.day !== b.day) return a.day - b.day;
    return (a.time || '12:00').localeCompare(b.time || '12:00');
  });

  const confCounts: Record<ConferenceType, number> = { AD: 0, SQA: 0, TWD: 0 };
  month.items.forEach((item) => {
    if (item.conference && confCounts[item.conference] !== undefined) {
      confCounts[item.conference] += 1;
    }
  });

  return (
    <div
      id="month-calendar"
      className="w-full bg-[#F8F9FA] rounded-3xl border border-black/5 shadow-xl overflow-hidden my-8 scroll-mt-6"
    >
      {/* Month Header Banner */}
      <div className="bg-slate-950 text-white p-6 sm:p-8 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <button
                onClick={() => onSelectMonth((month.index - 1 + 12) % 12)}
                className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white hover:text-slate-950 transition-all cursor-pointer"
                title="Предыдущий месяц"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div>
                <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                  {month.name}
                </h2>
                <p className="text-xs uppercase tracking-widest text-slate-400 font-bold mt-0.5">
                  {month.items.length} Публикаций запланировано
                </p>
              </div>
              <button
                onClick={() => onSelectMonth((month.index + 1) % 12)}
                className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white hover:text-slate-950 transition-all cursor-pointer"
                title="Следующий месяц"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="text-slate-300 text-xs sm:text-sm font-medium pt-2">
              <span className="text-amber-400 font-bold uppercase tracking-wider text-[10px] block">Фокус месяца</span>
              {month.focusTopic}
            </div>
            {monthEvents.length > 0 && (
              <div className="pt-3 flex flex-wrap gap-2">
                {monthEvents.map((evt) => {
                  const conf = CONFERENCE_CONFIGS[evt.conference];
                  return (
                    <div
                      key={evt.id}
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border shadow-sm ${conf.bgColor} ${conf.borderColor}`}
                    >
                      <CalendarIcon className="w-3.5 h-3.5" />
                      <span>{evt.title} ({evt.location})</span>
                      <span className="font-bold border-l border-current/20 pl-1.5">{evt.dates}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-white/5 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 flex items-center gap-2 text-xs font-bold">
              <Layers className="w-4 h-4 text-indigo-400" />
              <span>Конференции:</span>
              <span className="text-orange-400">AD ({confCounts.AD})</span>
              <span className="text-emerald-400">SQA ({confCounts.SQA})</span>
              <span className="text-blue-400">TWD ({confCounts.TWD})</span>
            </div>
            <button
              onClick={() => onAddPost()}
              className="flex items-center gap-2 px-5 py-3 bg-white text-slate-950 rounded-full font-bold text-xs uppercase tracking-wider shadow-md hover:bg-slate-100 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Создать пост</span>
            </button>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 bg-white/10 p-1 rounded-full">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                viewMode === 'grid' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-300 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Календарь</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                viewMode === 'list' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-300 hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Список ({listPosts.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {activeDayFilter !== null && (
              <button
                onClick={() => setActiveDayFilter(null)}
                className="text-xs font-bold uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/40 px-3 py-1 rounded-full hover:bg-amber-400/30 transition-all flex items-center gap-1 cursor-pointer"
              >
                <span>День {activeDayFilter} ✕</span>
              </button>
            )}
            {(selectedTagFilter !== 'all' || selectedConferenceFilter !== 'all') && (
              <span className="text-[11px] text-slate-300 font-medium">
                (Применены фильтры тегов/конференций)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Calendar Body */}
      <div className="p-4 sm:p-6">
        {viewMode === 'grid' ? (
          <div>
            <div className="grid grid-cols-7 gap-2 mb-3 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <div>Пн</div><div>Вт</div><div>Ср</div><div>Чт</div><div>Пт</div>
              <div className="text-orange-500">Сб</div>
              <div className="text-orange-500">Вс</div>
            </div>
            <div className="grid grid-cols-7 gap-2 sm:gap-3 auto-rows-fr">
              {Array.from({ length: firstDayOffset }).map((_, i) => (
                <div key={`empty-${i}`} className="min-h-[95px] sm:min-h-[115px]" />
              ))}
              {daysArray.map((dayNum) => {
                const dayPosts = monthFilteredPosts.filter((item) => Number(item.day) === dayNum).sort((a, b) => {
                  return (a.time || '12:00').localeCompare(b.time || '12:00');
                });
                const isSelectedDay = activeDayFilter === dayNum;
                const dayEvent = monthEvents.find((evt) => evt.days.includes(dayNum));
                const dayOfWeek = new Date(year, month.index, dayNum).getDay();
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

                return (
                  <div
                    key={`day-${dayNum}`}
                    onClick={() => setOpenedDay(dayNum)}
                    className={`min-h-[95px] sm:min-h-[115px] p-2 rounded-2xl border transition-all flex flex-col justify-between group relative cursor-pointer ${
                      isSelectedDay
                        ? 'bg-slate-950 text-white border-slate-950 shadow-md ring-2 ring-black/20'
                        : dayEvent
                        ? 'bg-amber-50/90 border-amber-300 hover:border-amber-500'
                        : dayPosts.length > 0
                        ? 'bg-white border-black/10 hover:border-black/30'
                        : isWeekend
                        ? 'bg-orange-50/40 border-orange-100 hover:bg-orange-50/70'
                        : 'bg-[#F1F3F5]/60 border-black/5 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`text-xs font-bold ${
                          isSelectedDay
                            ? 'text-white'
                            : dayEvent
                            ? 'text-amber-900 font-black'
                            : dayPosts.length > 0
                            ? 'text-slate-950 font-black'
                            : 'text-slate-400'
                        }`}
                      >
                        {dayNum}
                      </span>
                      {dayEvent && !isSelectedDay && (
                        <span
                          className={`text-[8px] font-black uppercase tracking-tight px-1 py-0.5 rounded shadow-2xs ${
                            CONFERENCE_CONFIGS[dayEvent.conference].bgColor
                          }`}
                          title={`${dayEvent.title} (${dayEvent.location})`}
                        >
                          {dayEvent.conference}
                        </span>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); onAddPost(dayNum); }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-950 rounded-md transition-all"
                        title={`Добавить пост на ${dayNum} число`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {dayEvent && (
                      <div
                        className={`mb-1 p-1 rounded-lg text-[9px] font-extrabold uppercase tracking-tight border flex items-center justify-between ${
                          CONFERENCE_CONFIGS[dayEvent.conference].bgColor
                        } ${CONFERENCE_CONFIGS[dayEvent.conference].borderColor}`}
                      >
                        <span className="truncate">🔥 {dayEvent.title}</span>
                        <span className="text-[8px] opacity-80">{dayEvent.location}</span>
                      </div>
                    )}
                    <div className="space-y-1 overflow-y-auto max-h-[85px] scrollbar-none">
                      {dayPosts.map((post) => {
                        const confConfig = CONFERENCE_CONFIGS[post.conference || 'AD'];
                        return (
                          <div
                            key={post.id}
                            onClick={(e) => { e.stopPropagation(); onEditPost(post); }}
                            className={`p-1.5 rounded-xl border text-left transition-all hover:scale-[1.02] shadow-2xs cursor-pointer ${
                              isSelectedDay ? 'bg-white/10 border-white/20 text-white' : 'bg-white border-black/5'
                            }`}
                          >
                            <div className="flex items-center gap-1 mb-0.5">
                              <span
                                className={`text-[8px] font-black uppercase tracking-wider px-1 rounded ${confConfig.bgColor} ${confConfig.textColor}`}
                              >
                                {post.conference || 'AD'}
                              </span>
                              <div className="flex gap-0.5 shrink-0">
                                {(post.tags?.length ? post.tags : (post.tag ? [post.tag] : ['social'])).map(t => (
                                  <span key={t} className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: TAG_CONFIGS[t]?.color || '#64748B' }} title={TAG_CONFIGS[t]?.label} />
                                ))}
                              </div>
                              <span className="text-[10px] font-bold truncate text-slate-900 flex-1">
                                {post.title}
                              </span>
                              {onDeletePost && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (deletingPostId === post.id) { onDeletePost(post.id); setDeletingPostId(null); }
                                    else setDeletingPostId(post.id);
                                  }}
                                  className={`p-0.5 rounded transition-colors ${
                                    deletingPostId === post.id
                                      ? 'bg-rose-600 text-white font-black text-[8px] px-1'
                                      : 'text-slate-400 hover:text-rose-500 hover:bg-rose-50'
                                  }`}
                                  title={deletingPostId === post.id ? 'Нажмите ещё раз, чтобы подтвердить удаление' : 'Удалить пост'}
                                >
                                  {deletingPostId === post.id ? 'Удалить?' : <Trash2 className="w-3 h-3" />}
                                </button>
                              )}
                            </div>
                            <div className="flex items-center justify-between text-[9px] text-slate-500 mt-1 pt-0.5 border-t border-black/5">
                              <span className="font-semibold">{post.time || '12:00'}</span>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); onToggleStatus(post.id); }}
                                className={`px-1.5 py-0.5 rounded-md font-extrabold uppercase tracking-wider text-[8px] transition-all flex items-center gap-0.5 ${
                                  post.status === 'published'
                                    ? 'bg-emerald-500 text-white shadow-2xs'
                                    : 'bg-slate-100 text-slate-600 hover:bg-emerald-100 hover:text-emerald-700'
                                }`}
                                title={post.status === 'published' ? 'Опубликовано (нажмите чтобы снять)' : 'Нажмите чтобы пометить как опубликованное'}
                              >
                                <span>{post.status === 'published' ? '✓ Готово' : '◯ Пометить'}</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {listPosts.length === 0 ? (
              <div className="border border-dashed border-slate-200 rounded-3xl">
                <EmptyState
                  type={month.items.length === 0 ? 'no-posts' : 'no-posts-filtered'}
                  monthName={month.name}
                  onAction={month.items.length === 0 ? () => onAddPost() : undefined}
                />
              </div>
            ) : (
              listPosts.map((post) => {
                const postTags = post.tags?.length ? post.tags : (post.tag ? [post.tag] : ['social']);
                const primaryTagConfig = TAG_CONFIGS[postTags[0]] || TAG_CONFIGS.social;
                const confConfig = CONFERENCE_CONFIGS[post.conference || 'AD'];
                return (
                  <div
                    key={post.id}
                    className="p-4 rounded-2xl border border-black/5 bg-white hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div
                        className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 font-bold text-white shadow-xs"
                        style={{ backgroundColor: primaryTagConfig.color }}
                      >
                        {renderTagIcon(postTags[0])}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${confConfig.bgColor} ${confConfig.textColor} ${confConfig.borderColor}`}>
                            {confConfig.label}
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800">
                            День {post.day} • {post.time || '12:00'}
                          </span>
                          {postTags.map((t) => {
                            const tc = TAG_CONFIGS[t];
                            if (!tc) return null;
                            return (
                              <span key={t} className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full ${tc.bgColor}`} style={{ color: tc.color }}>
                                {tc.label}
                              </span>
                            );
                          })}
                        </div>
                        <h4 className="text-base font-bold text-slate-900">{post.title}</h4>
                        {post.description && (
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2 font-medium">{post.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onToggleStatus(post.id); }}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                          post.status === 'published' ? 'bg-emerald-100 text-emerald-700'
                          : post.status === 'scheduled' ? 'bg-blue-100 text-blue-700'
                          : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {post.status === 'published' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                        <span>
                          {post.status === 'published' ? 'Опубликовано'
                           : post.status === 'scheduled' ? 'Запланировано' : 'Идея'}
                        </span>
                      </button>
                      <button
                        onClick={() => onEditPost(post)}
                        className="px-3.5 py-1.5 rounded-full bg-slate-100 text-slate-800 text-xs font-bold uppercase tracking-wider hover:bg-slate-200 transition-all cursor-pointer"
                      >
                        Изменить
                      </button>
                      {onDeletePost && (
                        deletingPostId === post.id ? (
                          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <span className="text-xs text-rose-600 font-bold">Удалить?</span>
                            <button
                              type="button"
                              onClick={() => { onDeletePost(post.id); setDeletingPostId(null); }}
                              className="px-3 py-1 rounded-full bg-rose-600 text-white text-xs font-bold uppercase tracking-wider hover:bg-rose-700 transition-all cursor-pointer shadow-xs"
                            >Да</button>
                            <button
                              type="button"
                              onClick={() => setDeletingPostId(null)}
                              className="px-2.5 py-1 rounded-full bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                            >Нет</button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setDeletingPostId(post.id); }}
                            className="p-2 rounded-full border border-rose-200 hover:bg-rose-50 text-rose-500 text-xs font-bold transition-all cursor-pointer"
                            title="Удалить пост"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {openedDay !== null && (
        <DayModal
          isOpen={openedDay !== null}
          onClose={() => setOpenedDay(null)}
          month={month}
          day={openedDay}
          year={year}
          onEditPost={onEditPost}
          onDeletePost={onDeletePost}
          onToggleStatus={onToggleStatus}
          onAddPost={onAddPost}
        />
      )}
    </div>
  );
};