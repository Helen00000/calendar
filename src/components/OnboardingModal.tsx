import React, { useState } from 'react';
import { X, ChevronRight, ChevronLeft, MousePointerClick, Calendar, Sparkles, BarChart3 } from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ONBOARDING_STEPS = [
  {
    icon: <MousePointerClick className="w-8 h-8 text-indigo-500" />,
    title: 'Колесо стратегии',
    description: 'Интерактивное колесо показывает все 12 месяцев. Кликните на сегмент, чтобы перейти к календарю месяца. Цветные метки ★ показывают даты конференций.',
  },
  {
    icon: <Calendar className="w-8 h-8 text-emerald-500" />,
    title: 'Календарь публикаций',
    description: 'Добавляйте посты на конкретные дни, переключайте вид «Календарь/Список», фильтруйте по каналам и конференциям. Клик на день — фильтр по дню.',
  },
  {
    icon: <Sparkles className="w-8 h-8 text-amber-500" />,
    title: 'AI-Стратег',
    description: 'Нажмите «AI Стратег» в навбаре, чтобы Gemini предложил идеи публикаций на основе вашего плана. Принимайте, редактируйте или отклоняйте рекомендации.',
  },
  {
    icon: <BarChart3 className="w-8 h-8 text-blue-500" />,
    title: 'Аналитика и экспорт',
    description: 'Внизу — аналитика по каналам и конференциям. Экспортируйте план в PDF или JSON через кнопки в навбаре и футере.',
  },
];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(0);

  if (!isOpen) return null;

  const currentStep = ONBOARDING_STEPS[step];
  const isLast = step === ONBOARDING_STEPS.length - 1;

  const handleClose = () => {
    localStorage.setItem('content_hub_onboarded', 'true');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-fade-in-up">
        {/* Progress bar */}
        <div className="h-1 bg-slate-100">
          <div
            className="h-full bg-indigo-600 transition-all duration-300"
            style={{ width: `${((step + 1) / ONBOARDING_STEPS.length) * 100}%` }}
          />
        </div>

        <div className="p-6 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Шаг {step + 1} из {ONBOARDING_STEPS.length}
            </span>
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="flex flex-col items-center text-center py-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-4">
              {currentStep.icon}
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">{currentStep.title}</h3>
            <p className="text-sm text-slate-500 leading-relaxed">{currentStep.description}</p>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setStep(Math.max(0, step - 1))}
              disabled={step === 0}
              className="flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Назад</span>
            </button>
            <button
              onClick={() => (isLast ? handleClose() : setStep(step + 1))}
              className="flex items-center gap-1 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 transition-all shadow-md cursor-pointer"
            >
              <span>{isLast ? 'Начать работу' : 'Далее'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};