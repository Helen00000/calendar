import React from 'react';
import { Sparkles, Download, Lock, HelpCircle } from 'lucide-react';
import { MonthData } from '../types';
import { SearchBar } from './SearchBar';

interface NavbarProps {
  months: MonthData[];
  selectedYear: number;
  onChangeYear: (year: number) => void;
  is2027Expanded: boolean;
  onToggle2027: () => void;
  onSearchSelect: (monthIndex: number, postId: string) => void;
  onOpenAiGenerator: () => void;
  onExportPdf: () => void;
  onLock: () => void;
  onOpenOnboarding: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  months,
  selectedYear,
  onChangeYear,
  is2027Expanded,
  onToggle2027,
  onSearchSelect,
  onOpenAiGenerator,
  onExportPdf,
  onLock,
  onOpenOnboarding,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/90 border-b border-black/5 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-950 text-white rounded-full flex items-center justify-center font-bold text-xl shadow-sm">
            IT
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-semibold tracking-tight uppercase text-slate-900 flex items-center gap-2">
              <span>Контент<span className="font-light text-indigo-600">Хаб</span></span>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-black tracking-widest border border-indigo-200">
                AD • SQA • TWD
              </span>
            </h1>
            <span className="text-[10px] text-slate-400 font-bold tracking-wider uppercase block -mt-0.5 hidden sm:block">
              Стратегия Конференций {selectedYear}
            </span>
          </div>
        </div>

        {/* Search + Action Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Year Switcher */}
          <div className="hidden sm:flex items-center bg-slate-100 rounded-full p-0.5 border border-slate-200">
            <button
              onClick={() => onChangeYear(2026)}
              className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
                selectedYear === 2026
                  ? 'bg-slate-950 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              2026
            </button>
            <button
              onClick={() => {
                if (!is2027Expanded) onToggle2027();
                onChangeYear(2027);
              }}
              className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all flex items-center gap-1 ${
                selectedYear === 2027
                  ? 'bg-slate-950 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title={is2027Expanded ? 'Скрыть календарь 2027' : 'Показать календарь 2027'}
            >
              2027
              {!is2027Expanded && <span className="text-[9px] opacity-70">▼</span>}
            </button>
          </div>
          

          <div className="hidden lg:block">
            <SearchBar months={months} onSelectResult={onSearchSelect} />
          </div>
          <button
            onClick={onOpenOnboarding}
            className="p-2 rounded-full border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-all cursor-pointer"
            title="Справка и онбординг"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenAiGenerator}
            className="flex items-center gap-1.5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white px-3.5 py-2 rounded-full text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-all shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden sm:inline">AI Стратег</span>
          </button>
          <button
            onClick={onExportPdf}
            className="flex items-center gap-1.5 bg-slate-950 text-white px-3.5 py-2 rounded-full text-xs font-medium uppercase tracking-wider hover:opacity-90 transition-all shadow-sm"
            title="Экспорт плана в PDF"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden md:inline">PDF</span>
          </button>
          <button
            onClick={onLock}
            className="p-2 rounded-full border border-rose-500/20 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-all"
            title="Заблокировать доступ"
          >
            <Lock className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};