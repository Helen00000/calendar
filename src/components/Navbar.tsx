import React, { useState } from 'react';
import { Sparkles, Download, Lock, Lightbulb, Search, X } from 'lucide-react';
import { MonthData } from '../types';
import { SearchBar } from './SearchBar';

interface NavbarProps {
  months: MonthData[];
  selectedYear: number;
  onChangeYear?: (year: number) => void;
  is2027Expanded?: boolean;
  onToggle2027?: () => void;
  onSearchSelect: (monthIndex: number, postId: string) => void;
  onOpenAiGenerator: () => void;
  onExportPdf: () => void;
  onLock: () => void;
  onOpenIdeas: () => void;
  ideasCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  months,
  selectedYear,
  onSearchSelect,
  onOpenAiGenerator,
  onExportPdf,
  onLock,
  onOpenIdeas,
  ideasCount = 0,
}) => {
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  const handleMobileSelect = (monthIndex: number, postId: string) => {
    onSearchSelect(monthIndex, postId);
    setIsMobileSearchOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/95 border-b border-black/5 transition-colors shadow-2xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-950 text-white rounded-xl sm:rounded-full flex items-center justify-center font-bold text-sm sm:text-xl shadow-xs">
            IT
          </div>
          <div>
            <h1 className="text-base sm:text-xl font-bold tracking-tight uppercase text-slate-900 flex items-center gap-1.5 sm:gap-2">
              <span>Контент<span className="font-light text-indigo-600">Хаб</span></span>
              <span className="hidden xs:inline-block text-[9px] sm:text-[10px] px-2 sm:px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-black tracking-widest border border-indigo-200">
                AD • SQA • TWD
              </span>
            </h1>
            <span className="text-[10px] text-slate-400 font-bold tracking-wider uppercase block -mt-0.5 hidden md:block">
              Стратегия Конференций {selectedYear}
            </span>
          </div>
        </div>

        {/* Search + Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Desktop Search */}
          <div className="hidden lg:block w-52 xl:w-64">
            <SearchBar months={months} onSelectResult={onSearchSelect} />
          </div>

          {/* Mobile/Tablet Search Toggle */}
          <button
            onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
            className="lg:hidden p-2 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
            title="Поиск по публикациям"
            aria-label="Поиск"
          >
            {isMobileSearchOpen ? <X className="w-4 h-4 text-slate-900" /> : <Search className="w-4 h-4" />}
          </button>

          {/* Idea Notes Button (Заметки для идей) */}
          <button
            type="button"
            onClick={onOpenIdeas}
            className="relative flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-full border border-amber-300/80 bg-amber-50/80 text-amber-900 hover:bg-amber-100 transition-all cursor-pointer shadow-2xs font-bold text-xs"
            title="Заметки для идей (листы заметок)"
            aria-label="Заметки для идей"
          >
            <Lightbulb className="w-4 h-4 text-amber-600 fill-amber-500/20 shrink-0" />
            <span className="hidden sm:inline">Идеи</span>
            {ideasCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px] font-black leading-tight">
                {ideasCount}
              </span>
            )}
          </button>

          {/* AI Generator Button */}
          <button
            onClick={onOpenAiGenerator}
            className="flex items-center gap-1.5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-full text-[11px] sm:text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-all shadow-xs cursor-pointer"
            title="AI Контент-Консультант"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span className="hidden sm:inline">AI Стратег</span>
          </button>

          {/* PDF Export */}
          <button
            onClick={onExportPdf}
            className="flex items-center gap-1.5 bg-slate-950 text-white px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-full text-[11px] sm:text-xs font-medium uppercase tracking-wider hover:opacity-90 transition-all shadow-xs cursor-pointer"
            title="Экспорт плана в PDF"
          >
            <Download className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden md:inline">PDF</span>
          </button>

          {/* Lock Screen */}
          <button
            onClick={onLock}
            className="p-2 rounded-full border border-rose-500/20 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-all cursor-pointer"
            title="Заблокировать доступ"
            aria-label="Заблокировать"
          >
            <Lock className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile/Tablet Search Expanded Panel */}
      {isMobileSearchOpen && (
        <div className="lg:hidden px-4 py-2.5 bg-slate-50 border-t border-black/5 animate-fade-in-up">
          <div className="max-w-md mx-auto">
            <SearchBar months={months} onSelectResult={handleMobileSelect} />
          </div>
        </div>
      )}
    </header>
  );
};