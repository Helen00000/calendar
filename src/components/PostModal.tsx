import React, { useState, useEffect } from 'react';
import { PostItem, TagType, PostStatus, ConferenceType } from '../types';
import { TAG_CONFIGS, CONFERENCE_CONFIGS } from '../data/initialData';
import { X, Sparkles, Copy, Check, Layers, Trash2 } from 'lucide-react';

interface PostModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: PostItem | null;
  initialDay?: number;
  initialMonthIndex?: number;
  monthsList?: { index: number; name: string; year?: number }[];
  selectedMonthName: string;
  onSave: (post: Partial<PostItem> & { monthIndex: number }) => void;
  onDelete?: (id: string) => void;
}

const DEFAULT_MONTH_OPTIONS = [
  { index: 0, name: 'Январь' },
  { index: 1, name: 'Февраль' },
  { index: 2, name: 'Март' },
  { index: 3, name: 'Апрель' },
  { index: 4, name: 'Май' },
  { index: 5, name: 'Июнь' },
  { index: 6, name: 'Июль' },
  { index: 7, name: 'Август' },
  { index: 8, name: 'Сентябрь' },
  { index: 9, name: 'Октябрь' },
  { index: 10, name: 'Ноябрь' },
  { index: 11, name: 'Декабрь' },
];

export const PostModal: React.FC<PostModalProps> = ({
  isOpen,
  onClose,
  post,
  initialDay = 1,
  initialMonthIndex = 0,
  monthsList,
  selectedMonthName,
  onSave,
  onDelete,
}) => {
  const [title, setTitle] = useState('');
  const [conference, setConference] = useState<ConferenceType>('AD');
  const [tags, setTags] = useState<TagType[]>(['social']);
  const [monthIndex, setMonthIndex] = useState<number>(initialMonthIndex);
  const [day, setDay] = useState(1);
  const [time, setTime] = useState('12:00');
  const [status, setStatus] = useState<PostStatus>('scheduled');
  const [description, setDescription] = useState('');

  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiDraft, setAiDraft] = useState<{
    headline?: string;
    contentText?: string;
    callToAction?: string;
    hashtags?: string[];
    bestPostingTime?: string;
    contentTips?: string[];
  } | null>(null);
  const [copiedText, setCopiedText] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const monthOptions = monthsList && monthsList.length > 0 ? monthsList : DEFAULT_MONTH_OPTIONS;
  const currentMonthOption = monthOptions.find((m) => m.index === monthIndex);
  const displayedMonthName = currentMonthOption ? currentMonthOption.name : selectedMonthName;

  useEffect(() => {
    setConfirmDelete(false);
    if (post) {
      setTitle(post.title || '');
      setConference(post.conference || 'AD');
      setTags(post.tags?.length ? post.tags : (post.tag ? [post.tag] : ['social']));
      setDay(post.day || 1);
      setTime(post.time || '12:00');
      setStatus(post.status || 'scheduled');
      setDescription(post.description || '');
      setMonthIndex(typeof post.monthIndex === 'number' ? post.monthIndex : initialMonthIndex);
      if (post.contentText) {
        setAiDraft({
          headline: post.title,
          contentText: post.contentText,
          callToAction: post.callToAction,
          hashtags: post.hashtags,
          bestPostingTime: post.bestPostingTime,
        });
      } else {
        setAiDraft(null);
      }
    } else {
      setTitle('');
      setConference('AD');
      setTags(['social']);
      setDay(initialDay || 1);
      setTime('12:00');
      setStatus('scheduled');
      setDescription('');
      setAiDraft(null);
      setMonthIndex(initialMonthIndex);
    }
  }, [post, isOpen, initialDay, initialMonthIndex]);

  if (!isOpen) return null;

  const handleGenerateAiCopy = async () => {
    if (!title.trim()) {
      alert('Пожалуйста, укажите тему или заголовок публикации.');
      return;
    }
    setIsGeneratingAi(true);
    try {
      const token = localStorage.getItem('session_token');
      const res = await fetch('/api/generate-post', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          topic: title,
          conference: CONFERENCE_CONFIGS[conference].label,
          tag: TAG_CONFIGS[tags[0] || 'social'].label,
          monthName: displayedMonthName,
        }),
      });
      if (res.status === 401) {
        alert('Сессия истекла. Заблокируйте приложение и войдите заново.');
        return;
      }
      const data = await res.json();
      if (data.success && data.data) {
        setAiDraft(data.data);
        if (data.data.bestPostingTime) {
          setTime(data.data.bestPostingTime);
        }
      } else {
        alert(data.error || 'Не удалось сгенерировать черновик. Попробуйте ещё раз.');
      }
    } catch (err) {
      console.error(err);
      alert('Ошибка при подключении к ИИ сервису.');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (tags.length === 0) {
      alert('Выберите хотя бы один формат контента!');
      return;
    }
    onSave({
      id: post?.id,
      title: title.trim() || 'Новая публикация',
      conference,
      tags,
      monthIndex: Number(monthIndex),
      day: Number(day),
      time,
      status,
      description,
      contentText: aiDraft?.contentText,
      hashtags: aiDraft?.hashtags,
      callToAction: aiDraft?.callToAction,
      bestPostingTime: aiDraft?.bestPostingTime,
    });
    onClose();
  };

  const handleCopyAiContent = () => {
    if (!aiDraft?.contentText) return;
    const fullText = `${aiDraft.headline || title}\n${aiDraft.contentText}\n${
      aiDraft.callToAction || ''
    }\n${(aiDraft.hashtags || []).join(' ')}`;
    navigator.clipboard.writeText(fullText);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white border border-black/10 rounded-2xl sm:rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl my-4 sm:my-8 max-h-[94vh] flex flex-col">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-5 bg-slate-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/10 flex items-center justify-center font-serif italic text-amber-300 font-bold shrink-0">
              C
            </div>
            <h3 className="text-sm sm:text-lg font-serif italic tracking-tight truncate">
              {post ? 'Редактировать публикацию' : 'Новая публикация'} • <span className="not-italic text-slate-300 font-sans text-xs sm:text-sm font-bold uppercase tracking-wider">{displayedMonthName}</span>
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-white/20 flex items-center justify-center text-slate-300 hover:bg-white hover:text-slate-950 transition-all cursor-pointer shrink-0 ml-2"
          >
            <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto flex-1">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">
              Тема / Заголовок поста *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Например: Анонс спикеров секции Системный анализ..."
              className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl border border-black/10 bg-[#F8F9FA] text-slate-950 font-medium focus:ring-2 focus:ring-slate-950 outline-none text-xs sm:text-sm"
            />
          </div>

          <div>
            <label className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-500" />
              <span>Конференция ИТ *</span>
            </label>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {(Object.keys(CONFERENCE_CONFIGS) as ConferenceType[]).map((confKey) => {
                const conf = CONFERENCE_CONFIGS[confKey];
                const isSelected = conference === confKey;
                return (
                  <button
                    key={confKey}
                    type="button"
                    onClick={() => setConference(confKey)}
                    title={`${conf.name} — ${conf.description}`}
                    className={`p-2 sm:p-2.5 rounded-xl sm:rounded-2xl border text-center transition-all flex flex-col items-center justify-center cursor-pointer ${
                      isSelected
                        ? `ring-2 ring-slate-950 ${conf.bgColor} border-slate-950 shadow-xs`
                        : 'border-black/10 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`text-xs sm:text-sm font-black ${conf.textColor}`}>{conf.shortLabel}</div>
                    <div className="text-[8px] sm:text-[9px] font-bold text-slate-700 truncate w-full mt-0.5">
                      {conf.name}
                    </div>
                    <div className="text-[7.5px] sm:text-[8px] text-slate-400 font-medium truncate w-full">
                      {conf.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">
              Канал / Формат контента * (можно несколько)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 sm:gap-2">
              {(Object.keys(TAG_CONFIGS) as TagType[]).map((tagKey) => {
                const config = TAG_CONFIGS[tagKey];
                const isSelected = tags.includes(tagKey);
                return (
                  <button
                    key={tagKey}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        if (tags.length > 1) setTags(tags.filter(t => t !== tagKey));
                      } else {
                        setTags([...tags, tagKey]);
                      }
                    }}
                    className={`p-2 sm:p-2.5 rounded-full border text-[11px] sm:text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'ring-2 ring-slate-950 shadow-xs'
                        : 'border-black/10 hover:bg-slate-50'
                    }`}
                    style={{
                      borderColor: config.color,
                      color: isSelected ? '#ffffff' : config.color,
                      backgroundColor: isSelected ? config.color : undefined,
                    }}
                  >
                    <span>{config.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            <div>
              <label className="block text-[8.5px] sm:text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                Месяц *
              </label>
              <select
                value={monthIndex}
                onChange={(e) => setMonthIndex(Number(e.target.value))}
                className="w-full px-2 sm:px-2.5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl border border-black/10 bg-[#F8F9FA] text-slate-950 text-[11px] sm:text-xs font-bold outline-none cursor-pointer focus:ring-2 focus:ring-slate-950"
              >
                {monthOptions.map((m) => (
                  <option key={m.index} value={m.index}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[8.5px] sm:text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                День (1-31)
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={day}
                onChange={(e) => setDay(Number(e.target.value))}
                className="w-full px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl border border-black/10 bg-[#F8F9FA] text-slate-950 text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-[8.5px] sm:text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                Время
              </label>
              <input
                type="text"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="12:00"
                className="w-full px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl border border-black/10 bg-[#F8F9FA] text-slate-950 text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-[8.5px] sm:text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                Статус
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as PostStatus)}
                className="w-full px-2 sm:px-3 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl border border-black/10 bg-[#F8F9FA] text-slate-950 text-[11px] sm:text-xs font-bold outline-none cursor-pointer"
              >
                <option value="idea">Идея</option>
                <option value="in_progress">В работе</option>
                <option value="scheduled">В плане</option>
                <option value="published">Готово</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
              Заметки / ТЗ
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Заметки по спикерам, ссылки, темы..."
              className="w-full px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl border border-black/10 bg-[#F8F9FA] text-slate-950 text-xs font-medium focus:ring-2 focus:ring-slate-950 outline-none"
            />
          </div>

          {/* Gemini AI Content Assistant Section */}
          <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-950 text-white space-y-2.5 sm:space-y-3 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300 shrink-0" />
                <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider">
                  Gemini AI Копирайтер
                </span>
              </div>
              <button
                type="button"
                onClick={handleGenerateAiCopy}
                disabled={isGeneratingAi}
                className="px-3 sm:px-4 py-1.5 rounded-full bg-white text-slate-950 text-[11px] sm:text-xs font-bold uppercase tracking-wider hover:bg-slate-100 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 self-start sm:self-auto"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isGeneratingAi ? 'Генерирую...' : 'Сгенерировать пост'}</span>
              </button>
            </div>
            {aiDraft && (
              <div className="p-3 sm:p-3.5 bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-800 text-xs space-y-2">
                <div className="font-serif italic text-amber-300 text-sm sm:text-base">
                  {aiDraft.headline}
                </div>
                <div className="text-slate-300 whitespace-pre-line leading-relaxed max-h-36 overflow-y-auto font-medium text-[11px] sm:text-xs">
                  {aiDraft.contentText}
                </div>
                {aiDraft.callToAction && (
                  <div className="font-bold text-sky-400 text-[11px] sm:text-xs">
                    CTA: {aiDraft.callToAction}
                  </div>
                )}
                {aiDraft.hashtags && aiDraft.hashtags.length > 0 && (
                  <div className="text-[9px] sm:text-[10px] text-slate-400">
                    {aiDraft.hashtags.join(' ')}
                  </div>
                )}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800 flex-wrap gap-1">
                  <span className="text-[9px] sm:text-[10px] text-slate-400">
                    Лучшее время: <strong className="text-white">{aiDraft.bestPostingTime}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyAiContent}
                    className="flex items-center gap-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-amber-300 hover:underline cursor-pointer"
                  >
                    {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedText ? 'Скопировано!' : 'Скопировать'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-black/5 flex flex-wrap items-center justify-between gap-2.5">
            {post && onDelete ? (
              confirmDelete ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-rose-600 font-bold">Удалить?</span>
                  <button
                    type="button"
                    onClick={() => {
                      onDelete(post.id);
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-full bg-rose-600 text-white text-xs font-bold uppercase tracking-wider hover:bg-rose-700 transition-all cursor-pointer shadow-xs"
                  >
                    Да
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="px-3 py-1.5 rounded-full bg-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider hover:bg-slate-300 transition-all cursor-pointer"
                  >
                    Нет
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-rose-200 text-rose-600 text-xs font-bold uppercase tracking-wider hover:bg-rose-50 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Удалить</span>
                </button>
              )
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 sm:px-5 py-2 rounded-full border border-black/10 text-slate-600 text-xs font-bold uppercase tracking-wider hover:bg-slate-50 transition-all cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="px-5 sm:px-6 py-2 rounded-full bg-slate-950 text-white text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-all shadow-md cursor-pointer"
              >
                Сохранить
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};