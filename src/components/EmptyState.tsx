import React from 'react';
import { CalendarX2, SearchX, Sparkles, Plus } from 'lucide-react';

interface EmptyStateProps {
  type: 'no-posts' | 'no-search-results' | 'no-posts-filtered' | 'first-time';
  monthName?: string;
  searchQuery?: string;
  onAction?: () => void;
  actionLabel?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  type,
  monthName,
  searchQuery,
  onAction,
  actionLabel,
}) => {
  const configs = {
    'no-posts': {
      icon: <CalendarX2 className="w-12 h-12 text-slate-300" />,
      title: 'Пока нет публикаций',
      description: monthName
        ? `В ${monthName} ещё не запланировано ни одного поста. Добавьте первую публикацию!`
        : 'Начните планировать контент, добавив первую публикацию.',
      action: 'Создать пост',
    },
    'no-search-results': {
      icon: <SearchX className="w-12 h-12 text-slate-300" />,
      title: 'Ничего не найдено',
      description: searchQuery
        ? `По запросу «${searchQuery}» нет результатов. Попробуйте изменить формулировку.`
        : 'Нет результатов по заданным фильтрам.',
      action: undefined,
    },
    'no-posts-filtered': {
      icon: <CalendarX2 className="w-12 h-12 text-slate-300" />,
      title: 'Нет постов по фильтрам',
      description: 'По выбранным фильтрам публикаций не найдено. Попробуйте сбросить фильтры.',
      action: undefined,
    },
    'first-time': {
      icon: <Sparkles className="w-12 h-12 text-indigo-300" />,
      title: 'Добро пожаловать в КонтентХаб!',
      description: 'Это ваш планер контент-стратегии для ИТ-конференций. Начните с создания первого поста или используйте AI-стратега.',
      action: 'Начать планирование',
    },
  };

  const config = configs[type];

  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center animate-fade-in-up">
      <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center mb-4">
        {config.icon}
      </div>
      <h3 className="text-lg font-bold text-slate-800 mb-1">{config.title}</h3>
      <p className="text-sm text-slate-500 max-w-md mb-4">{config.description}</p>
      {onAction && (
        <button
          onClick={onAction}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-950 text-white rounded-full text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-all shadow-md cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{actionLabel || config.action}</span>
        </button>
      )}
    </div>
  );
};