import React, { useState, useEffect } from 'react';
import { MonthData, PostItem, TagType, ConferenceType } from '../types';
import { CONFERENCE_CONFIGS, TAG_CONFIGS } from '../data/initialData';
import { useToast } from './Toast';
import {
Sparkles,
X,
Wand2,
Check,
Trash2,
Edit3,
Calendar,
Layers,
Lightbulb,
CheckCircle2,
SlidersHorizontal,
Info,
} from 'lucide-react';

export interface AiSuggestionItem {
id: string;
title: string;
conference: ConferenceType;
tag: TagType;
monthIndex: number;
day: number;
description: string;
reason: string;
isAccepted?: boolean;
isEditing?: boolean;
}

interface AiStrategyModalProps {
  isOpen: boolean;
  onClose: () => void;
  months: MonthData[];
  onAddPost: (post: Partial<PostItem>, monthIndex: number) => void;
  onAddPostsBatch: (posts: Array<{ post: Partial<PostItem>; monthIndex: number }>) => void;
}

const MONTH_NAMES = [
'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];

const DEFAULT_SUGGESTIONS: Omit<AiSuggestionItem, 'id'>[] = [
{
title: 'Анонс программы и вызова докладов (CFP) для SQA Days',
conference: 'SQA',
tag: 'telegram',
monthIndex: 2,
day: 15,
description: 'Официальный анонс приёма заявок от спикеров. Укажите дедлайн подачи и ключевые темы секций.',
reason: 'Заполняет пробел по анонсам спикеров в Telegram за 2 месяца до майской конференции SQA Days.',
},
{
title: 'Чек-лист идеальной архитектуры системного анализа для Analyst Days',
conference: 'AD',
tag: 'article',
monthIndex: 3,
day: 10,
description: 'Экспертная лонгрид-статья на VC/Habr с практическим разбором ошибок проектирования.',
reason: 'Высокая вовлекаемость профессионалов перед весенней сессией Analyst Days.',
},
{
title: 'Интервью со спикером секции «Документация как код»',
conference: 'TWD',
tag: 'video',
monthIndex: 8,
day: 22,
description: 'Короткое видео-интервью о практическом применении Docs-as-Code в крупных IT-компаниях.',
reason: 'Подгрев интереса к TechWriter Days перед осенней программой.',
},
{
title: 'Дайджест топовых докладов прошлого года с материалами и видео',
conference: 'AD',
tag: 'email',
monthIndex: 0,
day: 20,
description: 'Email-рассылка по всей базе участников с записью лучших выступлений и скидкой раннего бронирования.',
reason: 'Активация базы в начале года и стимулирование ранних продаж билетов.',
},
];

export const AiStrategyModal: React.FC<AiStrategyModalProps> = ({
  isOpen,
  onClose,
  months,
  onAddPost,
  onAddPostsBatch,
}) => {
  const { addToast } = useToast();
const [targetConference, setTargetConference] = useState<string>('all');
const [targetMonth, setTargetMonth] = useState<string>('all');
const [customPrompt, setCustomPrompt] = useState('');
const [postCount, setPostCount] = useState<number>(6);
const [isLoading, setIsLoading] = useState(false);
const [suggestions, setSuggestions] = useState<AiSuggestionItem[]>([]);
const [acceptedCount, setAcceptedCount] = useState(0);

useEffect(() => {
if (isOpen && suggestions.length === 0) {
const initialWithIds: AiSuggestionItem[] = DEFAULT_SUGGESTIONS.map((item, index) => ({
...item,
id: `sug-init-${index}-${Date.now()}`,
}));
setSuggestions(initialWithIds);
}
}, [isOpen]);

if (!isOpen) return null;

const totalPosts = months.reduce((acc, m) => acc + m.items.length, 0);
const adCount = months.reduce((acc, m) => acc + m.items.filter((i) => i.conference === 'AD').length, 0);
const sqaCount = months.reduce((acc, m) => acc + m.items.filter((i) => i.conference === 'SQA').length, 0);
const twdCount = months.reduce((acc, m) => acc + m.items.filter((i) => i.conference === 'TWD').length, 0);

const handleGenerateSuggestions = async (e?: React.FormEvent) => {
if (e) e.preventDefault();
setIsLoading(true);
try {
const summaryText = `Всего публикаций в плане: ${totalPosts}. По конференциям: Analyst Days (${adCount}), SQA Days (${sqaCount}), TechWriter Days (${twdCount}).`;
        const res = await fetch('/api/generate-suggestions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            monthsSummary: summaryText,
            targetConference: targetConference === 'all' ? 'Все конференции' : targetConference,
            targetMonth: targetMonth === 'all' ? undefined : parseInt(targetMonth, 10),
            customPrompt: customPrompt.trim(),
            postCount,
          }),
        });
if (res.status === 401) {
alert('Сессия истекла. Заблокируйте приложение и войдите заново.');
return;
}
const json = await res.json();
if (json.success && Array.isArray(json.suggestions) && json.suggestions.length > 0) {
const newItems: AiSuggestionItem[] = json.suggestions.map((s: any, idx: number) => ({
id: `sug-gen-${idx}-${Date.now()}`,
title: s.title || 'Идея публикации',
conference: ['AD', 'SQA', 'TWD'].includes(s.conference) ? s.conference : 'AD',
tag: ['email', 'telegram', 'social', 'article', 'video', 'reels'].includes(s.tag) ? s.tag : 'telegram',
monthIndex: typeof s.monthIndex === 'number' ? Math.min(Math.max(s.monthIndex, 0), 11) : 0,
day: typeof s.day === 'number' ? Math.min(Math.max(s.day, 1), 28) : 15,
description: s.description || '',
reason: s.reason || 'Рекомендация ИИ для баланса контент-стратегии',
isAccepted: false,
isEditing: false,
}));
setSuggestions((prev) => {
const acceptedItems = prev.filter((item) => item.isAccepted);
return [...acceptedItems, ...newItems];
});
} else {
alert(json.error || 'Не удалось сгенерировать новые подсказки. Используем адаптивные рекомендации.');
}
} catch (err) {
console.error('Error generating suggestions:', err);
} finally {
setIsLoading(false);
}
};

  const handleAcceptSuggestion = (sug: AiSuggestionItem) => {
    onAddPost(
      {
        title: sug.title,
        conference: sug.conference,
        tags: [sug.tag],
        day: sug.day,
        description: sug.description,
      },
      sug.monthIndex
    );
    setSuggestions((prev) =>
      prev.map((item) => (item.id === sug.id ? { ...item, isAccepted: true, isEditing: false } : item))
    );
    setAcceptedCount((c) => c + 1);
    addToast({
      type: 'success',
      title: 'Пост добавлен в план',
      message: `«${sug.title}» → ${MONTH_NAMES[sug.monthIndex]}`,
    });
  };

const handleRejectSuggestion = (id: string) => {
setSuggestions((prev) => prev.filter((item) => item.id !== id));
};

const handleToggleEdit = (id: string) => {
setSuggestions((prev) =>
prev.map((item) => (item.id === id ? { ...item, isEditing: !item.isEditing } : item))
);
};

const handleUpdateSuggestionField = (id: string, field: keyof AiSuggestionItem, value: any) => {
setSuggestions((prev) =>
prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
);
};

  const handleAcceptAll = () => {
    const unaccepted = suggestions.filter((s) => !s.isAccepted);
    if (unaccepted.length === 0) return;
    const batch = unaccepted.map((sug) => ({
      post: {
        title: sug.title,
        conference: sug.conference,
        tags: [sug.tag],
        day: sug.day,
        description: sug.description,
      },
      monthIndex: sug.monthIndex,
    }));
    onAddPostsBatch(batch);
    setSuggestions((prev) => prev.map((item) => ({ ...item, isAccepted: true, isEditing: false })));
    setAcceptedCount((c) => c + unaccepted.length);
    addToast({
      type: 'success',
      title: `Добавлено ${unaccepted.length} постов`,
      message: 'Все рекомендации приняты в контент-план',
    });
  };

const handleClearAllSuggestions = () => {
if (suggestions.length === 0) return;
const hasAccepted = suggestions.some((s) => s.isAccepted);
if (hasAccepted) {
if (!confirm('Принятые в календарь посты останутся. Удалить непринятые подсказки?')) {
return;
}
setSuggestions((prev) => prev.filter((item) => item.isAccepted));
} else {
setSuggestions([]);
setAcceptedCount(0);
}
};

return (
<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto">
<div className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl my-6 flex flex-col max-h-[90vh]">
{/* Modal Header */}
<div className="px-6 py-5 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white flex items-center justify-between shrink-0">
<div className="flex items-center gap-3">
<div className="w-10 h-10 rounded-2xl bg-indigo-600/30 ring-1 ring-indigo-400/30 flex items-center justify-center text-amber-300 shadow-inner">
<Sparkles className="w-5 h-5 text-amber-300" />
</div>
<div>
<h3 className="text-lg font-black tracking-tight flex items-center gap-2">
<span>ИИ Контент-Консультант</span>
<span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-500/30 text-indigo-200 px-2 py-0.5 rounded-md border border-indigo-400/20">
Подсказки & Настройка
</span>
</h3>
<p className="text-xs text-slate-300 font-medium">
Анализирует текущие посты и предлагает точечные идеи. Вы выбираете, что добавить в план.
</p>
</div>
</div>
<button
onClick={onClose}
className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center text-slate-300 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
>
<X className="w-5 h-5" />
</button>
</div>

{/* Modal Body */}
<div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
{/* Quick Analytics Bar */}
<div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
<div className="flex items-center gap-2">
<Layers className="w-4 h-4 text-indigo-500" />
<span className="text-xs font-bold text-slate-700">
Текущий баланс плана:
</span>
<span className="text-xs font-black text-slate-950 bg-slate-100 px-2 py-0.5 rounded-lg">
{totalPosts} публикаций
</span>
</div>
<div className="flex items-center gap-2">
<span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200">
AD: {adCount}
</span>
<span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
SQA: {sqaCount}
</span>
<span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
TWD: {twdCount}
</span>
</div>
{acceptedCount > 0 && (
<div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full animate-fade-in">
<CheckCircle2 className="w-4 h-4" />
<span>Добавлено {acceptedCount} постов в план</span>
</div>
)}
</div>

{/* AI Generator Control Form */}
<form
onSubmit={handleGenerateSuggestions}
className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4"
>
<div className="flex items-center justify-between border-b border-slate-100 pb-3">
<div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-900">
<SlidersHorizontal className="w-4 h-4 text-indigo-600" />
<span>Запросить специфические рекомендации ИИ</span>
</div>
<span className="text-[11px] text-slate-400 font-medium">Gemini 3.6 Flash</span>
</div>

<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
<div>
<label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
Конференция
</label>
<select
value={targetConference}
onChange={(e) => setTargetConference(e.target.value)}
className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-500"
>
<option value="all">Все конференции (AD, SQA, TWD)</option>
<option value="AD">Analyst Days (AD)</option>
<option value="SQA">SQA Days (SQA)</option>
<option value="TWD">TechWriter Days (TWD)</option>
</select>
</div>
<div>
<label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
Месяц публикации
</label>
<select
value={targetMonth}
onChange={(e) => setTargetMonth(e.target.value)}
className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-500"
>
<option value="all">Автоматически (Выбрать лучший месяц)</option>
{MONTH_NAMES.map((name, idx) => (
<option key={idx} value={idx}>
{name}
</option>
))}
</select>
</div>
</div>

<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
<div>
<label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
Количество постов
</label>
<input
type="number"
min={1}
max={100}
value={postCount}
onChange={(e) => setPostCount(Math.max(1, Math.min(100, parseInt(e.target.value, 10) || 6)))}
className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500"
/>
</div>
<div className="md:col-span-2">
<label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
Пожелания к публикациям (опционально)
</label>
<input
type="text"
value={customPrompt}
onChange={(e) => setCustomPrompt(e.target.value)}
placeholder="Например: по 3 поста на каждую конференцию (AD, SQA, TWD) в каждом месяце..."
className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-500"
/>
</div>
</div>

<div className="flex items-center justify-end gap-2 pt-1">
<button
type="submit"
disabled={isLoading}
className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
>
<Wand2 className="w-4 h-4" />
<span>{isLoading ? 'ИИ анализирует и генерирует...' : 'Сгенерировать подсказки'}</span>
</button>
</div>
</form>

{/* Suggestions List Section */}
<div className="space-y-4">
<div className="flex items-center justify-between">
<div className="flex items-center gap-2">
<Lightbulb className="w-4 h-4 text-amber-500" />
<h4 className="text-sm font-black uppercase tracking-wider text-slate-900">
Рекомендации ИИ ({suggestions.length})
</h4>
</div>
<div className="flex items-center gap-2">
{suggestions.length > 0 && (
<button
onClick={handleClearAllSuggestions}
className="px-3.5 py-1.5 rounded-xl bg-rose-100 text-rose-600 text-xs font-bold transition-all flex items-center gap-1.5 hover:bg-rose-200 border border-rose-200 cursor-pointer"
title="Удалить все подсказки"
>
<Trash2 className="w-3.5 h-3.5" />
<span>Удалить все подсказки</span>
</button>
)}
{suggestions.some((s) => !s.isAccepted) && (
<button
onClick={handleAcceptAll}
className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
>
<Check className="w-3.5 h-3.5" />
<span>Принять все варианты</span>
</button>
)}
</div>
</div>

{suggestions.length === 0 ? (
<div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-300">
<p className="text-xs text-slate-500 font-medium">
Нажмите кнопку выше, чтобы ИИ проанализировал стратегию и предложил варианты публикаций.
</p>
</div>
) : (
<div className="space-y-3">
{suggestions.map((item) => {
const confConfig = CONFERENCE_CONFIGS[item.conference];
const tagConfig = TAG_CONFIGS[item.tag];
return (
<div
key={item.id}
className={`bg-white rounded-2xl p-5 border transition-all shadow-sm ${
item.isAccepted
? 'border-emerald-500/40 bg-emerald-50/20'
: 'border-slate-200 hover:border-slate-300'
}`}
>
{item.isEditing ? (
<div className="space-y-3 animate-fade-in">
<div className="text-xs font-bold text-indigo-600 flex items-center gap-1">
<Edit3 className="w-3.5 h-3.5" />
<span>Редактирование рекомендации</span>
</div>
<div>
<label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
Тема публикации
</label>
<input
type="text"
value={item.title}
onChange={(e) =>
handleUpdateSuggestionField(item.id, 'title', e.target.value)
}
className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-900"
/>
</div>
<div className="grid grid-cols-2 md:grid-cols-4 gap-2">
<div>
<label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
Конференция
</label>
<select
value={item.conference}
onChange={(e) =>
handleUpdateSuggestionField(
item.id,
'conference',
e.target.value as ConferenceType
)
}
className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium"
>
<option value="AD">Analyst Days</option>
<option value="SQA">SQA Days</option>
<option value="TWD">TechWriter Days</option>
</select>
</div>
<div>
<label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
Канал
</label>
<select
value={item.tag}
onChange={(e) =>
handleUpdateSuggestionField(
item.id,
'tag',
e.target.value as TagType
)
}
className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium"
>
<option value="email">Email рассылка</option>
<option value="telegram">ТГ рассылка</option>
<option value="social">Пост в соц сетях</option>
<option value="article">Лонгрид VC/Habr</option>
<option value="video">Истории</option>
<option value="reels">Reels / Shorts</option>
</select>
</div>
<div>
<label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
Месяц
</label>
<select
value={item.monthIndex}
onChange={(e) =>
handleUpdateSuggestionField(
item.id,
'monthIndex',
parseInt(e.target.value, 10)
)
}
className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium"
>
{MONTH_NAMES.map((mName, idx) => (
<option key={idx} value={idx}>
{mName}
</option>
))}
</select>
</div>
<div>
<label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
День
</label>
<input
type="number"
min={1}
max={28}
value={item.day}
onChange={(e) =>
handleUpdateSuggestionField(
item.id,
'day',
parseInt(e.target.value, 10) || 1
)
}
className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium"
/>
</div>
</div>
<div>
<label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
Описание / План
</label>
<textarea
rows={2}
value={item.description}
onChange={(e) =>
handleUpdateSuggestionField(item.id, 'description', e.target.value)
}
className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800"
/>
</div>
<div className="flex items-center justify-end gap-2 pt-2">
<button
type="button"
onClick={() => handleToggleEdit(item.id)}
className="px-3 py-1.5 rounded-lg bg-slate-200 text-slate-800 text-xs font-bold"
>
Отмена
</button>
<button
type="button"
onClick={() => handleAcceptSuggestion(item)}
className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1"
>
<Check className="w-3.5 h-3.5" />
<span>Сохранить и принять</span>
</button>
</div>
</div>
) : (
<div className="space-y-3">
<div className="flex flex-wrap items-center justify-between gap-2">
<div className="flex items-center gap-2">
<span
className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${confConfig.bgColor} ${confConfig.borderColor}`}
>
{confConfig.label}
</span>
<span
className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${tagConfig.bgColor} ${tagConfig.borderColor}`}
>
{tagConfig.label}
</span>
<span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-slate-200">
<Calendar className="w-3 h-3 text-indigo-500" />
<span>
{item.day} {MONTH_NAMES[item.monthIndex]}
</span>
</span>
</div>
<div className="flex items-center gap-1.5">
{item.isAccepted ? (
<span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-3 py-1 rounded-xl flex items-center gap-1">
<CheckCircle2 className="w-4 h-4 text-emerald-500" />
<span>Принято в план</span>
</span>
) : (
<>
<button
type="button"
onClick={() => handleToggleEdit(item.id)}
className="px-2.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
title="Настроить параметры перед добавлением"
>
<Edit3 className="w-3.5 h-3.5 text-indigo-500" />
<span className="hidden sm:inline">Изменить</span>
</button>
<button
type="button"
onClick={() => handleRejectSuggestion(item.id)}
className="p-1.5 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-500 text-xs font-bold transition-all cursor-pointer"
title="Отклонить рекомендацию"
>
<Trash2 className="w-3.5 h-3.5" />
</button>
<button
type="button"
onClick={() => handleAcceptSuggestion(item)}
className="px-4 py-1.5 rounded-xl bg-slate-950 text-white hover:opacity-90 text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
>
<Check className="w-3.5 h-3.5 text-emerald-400" />
<span>Принять</span>
</button>
</>
)}
</div>
</div>
<h5 className="text-sm font-black text-slate-950 leading-snug">
{item.title}
</h5>
{item.description && (
<p className="text-xs text-slate-600 font-medium leading-relaxed">
{item.description}
</p>
)}
{item.reason && (
<div className="bg-indigo-50/70 rounded-xl p-2.5 border border-indigo-100 flex items-start gap-2 text-[11px] text-indigo-950 font-medium">
<Info className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
<span>
<strong className="font-bold">ИИ Инсайт:</strong> {item.reason}
</span>
</div>
)}
</div>
)}
</div>
);
})}
</div>
)}
</div>
</div>

{/* Modal Footer */}
<div className="px-6 py-4 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
<p className="text-[11px] text-slate-500 font-medium">
Все принятые посты мгновенно появляются в карусели и календаре выбранных месяцев.
</p>
<button
type="button"
onClick={onClose}
className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:opacity-90 transition-all cursor-pointer"
>
Готово
</button>
</div>
</div>
</div>
);
};