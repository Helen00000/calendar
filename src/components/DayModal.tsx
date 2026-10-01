import React, { useState } from 'react';
import { MonthData, PostItem } from '../types';
import { TAG_CONFIGS, CONFERENCE_CONFIGS, CONFERENCE_EVENTS } from '../data/initialData';
import { X, Plus, Clock, CheckCircle2, Trash2, MapPin } from 'lucide-react';

interface DayModalProps {
  isOpen: boolean;
  onClose: () => void;
  month: MonthData;
  day: number;
  year: number;
  onEditPost: (post: PostItem) => void;
  onDeletePost?: (postId: string) => void;
  onToggleStatus: (postId: string) => void;
  onAddPost: (day: number) => void;
}

export const DayModal: React.FC<DayModalProps> = ({
  isOpen,
  onClose,
  month,
  day,
  year,
  onEditPost,
  onDeletePost,
  onToggleStatus,
  onAddPost,
}) => {
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
  if (!isOpen) return null;

  const dayEvents = CONFERENCE_EVENTS.filter(
    (e) => e.year === year && e.monthIndex === month.index && e.days.includes(day)
  );
  const dayPosts = month.items
    .filter((item) => Number(item.day) === day)
    .sort((a, b) => (a.time || '12:00').localeCompare(b.time || '12:00'));

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#F8F9FA] border border-black/10 rounded-2xl sm:rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl my-4 sm:my-8 flex flex-col max-h-[92vh]">
        <div className="px-4 sm:px-6 py-4 sm:py-5 bg-slate-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-white/10 flex items-center justify-center font-black text-lg sm:text-xl text-white">
              {day}
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                <span>{month.name}</span>
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-300 font-medium">
                Всего публикаций: {dayPosts.reduce((acc, item) => acc + (item.tags?.length || (item.tag ? 1 : 1)), 0)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-slate-300 hover:bg-white hover:text-slate-950 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto space-y-3 sm:space-y-4 flex-1">
          {dayEvents.length > 0 && (
            <div className="space-y-2 mb-3 sm:mb-4">
              {dayEvents.map((evt) => {
                const conf = CONFERENCE_CONFIGS[evt.conference];
                return (
                  <div
                    key={evt.id}
                    className={`p-3 rounded-2xl border ${conf.bgColor} ${conf.borderColor} flex flex-col justify-between`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-black uppercase tracking-wider ${conf.textColor}`}>
                        {conf.label}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] font-bold text-slate-600">
                        <MapPin className="w-3 h-3" />
                        {evt.location}
                      </span>
                    </div>
                    <div className="text-sm font-black text-slate-900 leading-snug">
                      {evt.title}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {dayPosts.length === 0 ? (
            <div className="text-center py-8 sm:py-10 border border-dashed border-slate-200 rounded-2xl sm:rounded-3xl bg-white px-4">
              <p className="text-xs sm:text-sm text-slate-500 font-medium mb-3 sm:mb-4">На этот день не запланировано публикаций.</p>
              <button
                onClick={() => { onAddPost(day); onClose(); }}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-950 text-white rounded-full text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-all shadow-md cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Создать пост</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2.5 sm:space-y-3">
              {dayPosts.map((post) => {
                const postTags = post.tags?.length ? post.tags : (post.tag ? [post.tag] : ['social']);
                const confConfig = CONFERENCE_CONFIGS[post.conference || 'AD'];
                return (
                  <div
                    key={post.id}
                    className="p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-black/5 bg-white hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-2.5 sm:gap-3.5 min-w-0">
                      <div>
                        <div className="flex items-center gap-1.5 sm:gap-2 mb-1 flex-wrap">
                          <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${confConfig.bgColor} ${confConfig.textColor} ${confConfig.borderColor}`}>
                            {confConfig.label}
                          </span>
                          <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-slate-100 text-slate-800">
                            {post.time || '12:00'}
                          </span>
                          <div className="flex gap-1 flex-wrap">
                            {postTags.map(t => {
                              const tc = TAG_CONFIGS[t];
                              return tc ? (
                                <span key={t} className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${tc.bgColor}`} style={{ color: tc.color }}>
                                  {tc.label}
                                </span>
                              ) : null;
                            })}
                          </div>
                        </div>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900">{post.title}</h4>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 shrink-0 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => onToggleStatus(post.id)}
                        className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer ${
                          post.status === 'published' ? 'bg-emerald-100 text-emerald-700'
                          : post.status === 'scheduled' ? 'bg-blue-100 text-blue-700'
                          : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {post.status === 'published' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        <span>
                          {post.status === 'published' ? 'Готово'
                           : post.status === 'scheduled' ? 'В плане' : 'Идея'}
                        </span>
                      </button>
                      <button
                        onClick={() => { onEditPost(post); onClose(); }}
                        className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-slate-100 text-slate-800 text-[10px] font-bold uppercase tracking-wider hover:bg-slate-200 transition-all cursor-pointer"
                      >Изменить</button>
                      {onDeletePost && (
                        deletingPostId === post.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => { onDeletePost(post.id); setDeletingPostId(null); }}
                              className="px-2 py-1 sm:py-1.5 rounded-full bg-rose-600 text-white text-[10px] font-bold uppercase tracking-wider hover:bg-rose-700 transition-all cursor-pointer shadow-xs"
                            >Да</button>
                            <button
                              type="button"
                              onClick={() => setDeletingPostId(null)}
                              className="px-2 py-1 sm:py-1.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold transition-all cursor-pointer"
                            >Нет</button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDeletingPostId(post.id)}
                            className="p-1 sm:p-1.5 rounded-full border border-rose-200 hover:bg-rose-50 text-rose-500 transition-all cursor-pointer"
                            title="Удалить пост"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
          <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium">Управляйте расписанием одного дня.</p>
          <button
            onClick={() => { onAddPost(day); onClose(); }}
            className="flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 sm:py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:opacity-90 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Добавить
          </button>
        </div>
      </div>
    </div>
  );
};