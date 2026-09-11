import React, { useState, useEffect } from 'react';
import { PostItem, TagType, PostStatus, ConferenceType } from '../types';
import { TAG_CONFIGS, CONFERENCE_CONFIGS } from '../data/initialData';
import { X, Sparkles, Copy, Check, Layers, Trash2 } from 'lucide-react';

interface PostModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: PostItem | null;
  initialDay?: number;
  selectedMonthName: string;
  onSave: (post: Partial<PostItem>) => void;
  onDelete?: (id: string) => void;
}

export const PostModal: React.FC<PostModalProps> = ({
  isOpen,
  onClose,
  post,
  initialDay = 1,
  selectedMonthName,
  onSave,
  onDelete,
}) => {
  const [title, setTitle] = useState('');
  const [conference, setConference] = useState<ConferenceType>('AD');
  const [tags, setTags] = useState<TagType[]>(['social']);
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
    }
  }, [post, isOpen, initialDay]);

  if (!isOpen) return null;

  const handleGenerateAiCopy = async () => {
    if (!title.trim()) {
      alert('Пожалуйста, укажите тему или заголовок публикации.');
      return;
    }
    setIsGeneratingAi(true);
    try {
      const res = await fetch('/api/generate-post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: title,
          conference: CONFERENCE_CONFIGS[conference].label,
          tag: TAG_CONFIGS[tags[0] || 'social'].label,
          monthName: selectedMonthName,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white border border-black/10 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl my-8">
        {/* Header */}
        <div className="px-6 py-5 bg-slate-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-serif italic text-amber-300 font-bold">
              C
            </div>
            <h3 className="text-lg font-serif italic tracking-tight">
              {post ? 'Редактировать публикацию' : 'Новая публикация'} • <span className="not-italic text-slate-300 font-sans text-sm font-bold uppercase tracking-wider">{selectedMonthName}</span>
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-slate-300 hover:bg-white hover:text-slate-950 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-5">
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
              className="w-full px-4 py-3 rounded-2xl border border-black/10 bg-[#F8F9FA] text-slate-950 font-medium focus:ring-2 focus:ring-slate-950 outline-none"
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
                    className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center cursor-pointer ${
                      isSelected
                        ? `ring-2 ring-slate-950 ${conf.bgColor} border-slate-950 shadow-xs`
                        : 'border-black/10 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`text-sm font-black ${conf.textColor}`}>{conf.shortLabel}</div>
                    <div className="text-[9px] font-bold text-slate-500 truncate w-full mt-0.5">
                      {conf.name}
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
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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
                    className={`p-2.5 rounded-full border text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
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

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                День (1-31)
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={day}
                onChange={(e) => setDay(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-2xl border border-black/10 bg-[#F8F9FA] text-slate-950 text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                Время
              </label>
              <input
                type="text"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="12:00"
                className="w-full px-3 py-2.5 rounded-2xl border border-black/10 bg-[#F8F9FA] text-slate-950 text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                Статус
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as PostStatus)}
                className="w-full px-3 py-2.5 rounded-2xl border border-black/10 bg-[#F8F9FA] text-slate-950 text-xs font-bold outline-none"
              >
                <option value="idea">Идея</option>
                <option value="in_progress">В работе</option>
                <option value="scheduled">Запланирован</option>
                <option value="published">Опубликован</option>
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
              className="w-full px-4 py-2.5 rounded-2xl border border-black/10 bg-[#F8F9FA] text-slate-950 text-xs font-medium focus:ring-2 focus:ring-slate-950 outline-none"
            />
          </div>

          {/* Gemini AI Content Assistant Section */}
          <div className="p-4 rounded-2xl bg-slate-950 text-white space-y-3 shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Gemini AI Копирайтер ИТ-Конференций
                </span>
              </div>
              <button
                type="button"
                onClick={handleGenerateAiCopy}
                disabled={isGeneratingAi}
                className="px-4 py-1.5 rounded-full bg-white text-slate-950 text-xs font-bold uppercase tracking-wider hover:bg-slate-100 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isGeneratingAi ? 'Генерирую...' : 'Сгенерировать пост'}</span>
              </button>
            </div>
            {aiDraft && (
              <div className="p-3.5 bg-slate-900 rounded-2xl border border-slate-800 text-xs space-y-2">
                <div className="font-serif italic text-amber-300 text-base">
                  {aiDraft.headline}
                </div>
                <div className="text-slate-300 whitespace-pre-line leading-relaxed max-h-36 overflow-y-auto font-medium">
                  {aiDraft.contentText}
                </div>
                {aiDraft.callToAction && (
                  <div className="font-bold text-sky-400">
                    CTA: {aiDraft.callToAction}
                  </div>
                )}
                {aiDraft.hashtags && aiDraft.hashtags.length > 0 && (
                  <div className="text-[10px] text-slate-400">
                    {aiDraft.hashtags.join(' ')}
                  </div>
                )}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <span className="text-[10px] text-slate-400">
                    Лучшее время: <strong className="text-white">{aiDraft.bestPostingTime}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyAiContent}
                    className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-amber-300 hover:underline cursor-pointer"
                  >
                    {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedText ? 'Скопировано!' : 'Скопировать'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-black/5 flex items-center justify-between gap-3">
            {post && onDelete ? (
              confirmDelete ? (
                <div className="flex items-center gap-2">
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
                  className="px-4 py-2 rounded-full border border-rose-200 text-rose-600 text-xs font-bold uppercase tracking-wider hover:bg-rose-50 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Удалить</span>
                </button>
              )
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-full border border-black/10 text-slate-600 text-xs font-bold uppercase tracking-wider hover:bg-slate-50 transition-all cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="px-6 py-2 rounded-full bg-slate-950 text-white text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-all shadow-md cursor-pointer"
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