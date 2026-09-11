import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MonthData, PostItem, TagType, ConferenceFilterType, ConferenceType } from './types';
import { ALL_INITIAL_MONTHS } from './data/initialData';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { WheelChart } from './components/WheelChart';
import { MonthCalendar } from './components/MonthCalendar';
import { AnnualAnalytics } from './components/AnnualAnalytics';
import { PostModal } from './components/PostModal';
import { AiStrategyModal } from './components/AiStrategyModal';
import { PdfReportView } from './components/PdfReportView';
import { PasswordGate } from './components/PasswordGate';
import { OnboardingModal } from './components/OnboardingModal';
import { ToastProvider, useToast } from './components/Toast';
import { exportPlanToPdf } from './utils/pdfExport';

function AppContent() {
  const { addToast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isCheckingSession, setIsCheckingSession] = useState<boolean>(true);

  // Year state (2026 visible by default, 2027 hidden until expanded)
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [is2027Expanded, setIs2027Expanded] = useState<boolean>(false);

  // Main Months state
const [months, setMonths] = useState<MonthData[]>(() => {
const saved = localStorage.getItem('content_wheel_months');
if (saved) {
try {
const parsed = JSON.parse(saved);
if (Array.isArray(parsed) && parsed.length > 0) {
// 🔧 Миграция: если у старых данных нет поля year — добавляем 2026
const migrated = parsed.map((m: any) => ({
...m,
year: typeof m.year === 'number' ? m.year : 2026,
}));
return migrated;
}
} catch (e) {
console.error(e);
}
}
return ALL_INITIAL_MONTHS;
});

  const monthsRef = useRef(months);
  monthsRef.current = months;

  const [dbSaved, setDbSaved] = useState<boolean>(true);
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number>(0);
  const [selectedTagFilter, setSelectedTagFilter] = useState<TagType | 'all'>('all');
  const [selectedConferenceFilter, setSelectedConferenceFilter] = useState<ConferenceFilterType>('all');
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<PostItem | null>(null);
  const [initialPostDay, setInitialPostDay] = useState<number>(1);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(() => {
    return !localStorage.getItem('content_hub_onboarded');
  });
  const [lastDeletedPost, setLastDeletedPost] = useState<{ post: PostItem; monthIndex: number } | null>(null);

  // Filter months by selected year (and 2027 visibility)
// 🔧 Фильтруем месяцы СТРОГО по выбранному году
let visibleMonths = months.filter((m) => m.year === selectedYear);

// 🔧 Защита: если для выбранного года нет данных — fallback на все месяцы
if (visibleMonths.length === 0 && months.length > 0) {
  visibleMonths = months;
}

// For current month: if selected index points outside visible, pick first visible
const currentMonthData =
visibleMonths.find((m) => m.index === selectedMonthIndex && m.year === selectedYear) ||
visibleMonths.find((m) => m.year === selectedYear) ||
visibleMonths[0] ||
months[0] ||
{ index: 0, year: 2026, name: 'Январь', shortName: 'ЯНВ', season: 'winter' as const, focusTopic: '', goal: '', items: [] };

  const totalPostsCount = visibleMonths.reduce((acc, m) => acc + m.items.length, 0);

  // 1. Check session on mount
  useEffect(() => {
    let isMounted = true;
    fetch('/api/session-check', { credentials: 'include' })
      .then((res) => {
        if (!isMounted) return;
        setIsAuthenticated(res.ok);
      })
      .catch(() => {
        if (isMounted) setIsAuthenticated(false);
      })
      .finally(() => {
        if (isMounted) setIsCheckingSession(false);
      });
    return () => { isMounted = false; };
  }, []);

  // 2. Load data from DB (only if authenticated)
  useEffect(() => {
    if (!isAuthenticated) return;
    let isMounted = true;
    fetch('/api/content-db', { credentials: 'include' })
      .then((res) => {
        if (res.status === 401) { handleSessionExpired(); return null; }
        return res.json();
      })
      .then((resData) => {
if (!isMounted || !resData) return;
const monthsArray = Array.isArray(resData.data) ? resData.data : null;
if (monthsArray && monthsArray.length > 0) {
// 🔧 Миграция серверных данных: добавляем year если его нет
const migrated = monthsArray.map((m: any) => ({
...m,
year: typeof m.year === 'number' ? m.year : 2026,
}));
setMonths(migrated);
localStorage.setItem('content_wheel_months', JSON.stringify(migrated));
setDbSaved(true);
}
})
      .catch((err) => console.warn('Backend DB fetch error, using fallback:', err));
    return () => { isMounted = false; };
  }, [isAuthenticated]);

  const handleSessionExpired = useCallback(() => setIsAuthenticated(false), []);
  const handleAuthSuccess = useCallback(() => setIsAuthenticated(true), []);
  const handleLock = useCallback(() => {
    fetch('/api/logout', { method: 'POST', credentials: 'include' }).catch(() => {});
    setIsAuthenticated(false);
  }, []);

  const saveMonthsData = useCallback((newMonths: MonthData[]) => {
    setMonths(newMonths);
    localStorage.setItem('content_wheel_months', JSON.stringify(newMonths));
    setDbSaved(false);
    fetch('/api/content-db', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newMonths),
    })
      .then((res) => {
        if (res.status === 401) { handleSessionExpired(); return null; }
        return res.json();
      })
      .then((resData) => { if (resData?.success) setDbSaved(true); })
      .catch((err) => console.error('Error saving DB:', err));
  }, [handleSessionExpired]);

  const handleOpenAddPost = (dayNum?: number) => {
    setEditingPost(null);
    setInitialPostDay(typeof dayNum === 'number' ? dayNum : 1);
    setIsPostModalOpen(true);
  };

  const handleOpenEditPost = (post: PostItem) => {
    setEditingPost(post);
    setIsPostModalOpen(true);
  };

  const handleSavePost = useCallback((postData: Partial<PostItem>) => {
    if (selectedTagFilter !== 'all' && postData.tags && !postData.tags.includes(selectedTagFilter)) {
      setSelectedTagFilter('all');
    }
    if (selectedConferenceFilter !== 'all' && postData.conference && selectedConferenceFilter !== postData.conference) {
      setSelectedConferenceFilter('all');
    }
    const currentMonths = monthsRef.current;
    const updatedMonths = currentMonths.map((m) => {
      if (postData.id) {
        const hasItem = m.items.some((i) => i.id === postData.id);
        if (hasItem) {
          return {
            ...m,
            items: m.items.map((item) =>
              item.id === postData.id ? ({ ...item, ...postData } as PostItem) : item
            ),
          };
        }
      }
      if (!postData.id && m.index === selectedMonthIndex && m.year === selectedYear) {
        const newPost: PostItem = {
          id: `post-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          title: postData.title || 'Новая публикация',
          conference: postData.conference || 'AD',
          tags: postData.tags?.length ? postData.tags : ['social'],
          day: postData.day || 1,
          time: postData.time || '12:00',
          status: postData.status || 'scheduled',
          description: postData.description || '',
          contentText: postData.contentText,
          hashtags: postData.hashtags,
          callToAction: postData.callToAction,
          bestPostingTime: postData.bestPostingTime,
        };
        return { ...m, items: [...m.items, newPost] };
      }
      return m;
    });
    saveMonthsData(updatedMonths);
    addToast({
      type: 'success',
      title: postData.id ? 'Публикация обновлена' : 'Публикация добавлена',
      message: `«${postData.title || 'Без названия'}»`,
    });
  }, [selectedMonthIndex, selectedYear, selectedTagFilter, selectedConferenceFilter, addToast, saveMonthsData]);

  const handleDeletePost = useCallback((postId: string) => {
    const currentMonths = monthsRef.current;
    let deletedPost: PostItem | null = null;
    let deletedMonthIndex = 0;
    currentMonths.forEach((m) => {
      const found = m.items.find((item) => item.id === postId);
      if (found) { deletedPost = found; deletedMonthIndex = m.index; }
    });
    const updatedMonths = currentMonths.map((m) => ({
      ...m,
      items: m.items.filter((item) => item.id !== postId),
    }));
    saveMonthsData(updatedMonths);
    if (deletedPost) {
      const post = deletedPost as PostItem;
      setLastDeletedPost({ post, monthIndex: deletedMonthIndex });
      addToast({
        type: 'info',
        title: 'Публикация удалена',
        message: `«${post.title}»`,
        action: {
          label: 'Отменить удаление',
          onClick: () => {
            const latestMonths = monthsRef.current;
            const restoredMonths = latestMonths.map((m) => {
              if (m.index === deletedMonthIndex) return { ...m, items: [...m.items, post] };
              return m;
            });
            saveMonthsData(restoredMonths);
            addToast({ type: 'success', title: 'Пост восстановлен' });
          },
        },
        duration: 6000,
      });
    }
  }, [addToast, saveMonthsData]);

  const handleTogglePostStatus = useCallback((postId: string) => {
    const currentIndex = selectedMonthIndex;
    const currentMonths = monthsRef.current;
    const updatedMonths = currentMonths.map((m) => {
      const hasItem = m.items.some((i) => i.id === postId);
      if (!hasItem) return m;
      return {
        ...m,
        items: m.items.map((item) => {
          if (item.id === postId) {
            const nextStatus = item.status === 'published' ? 'scheduled' : 'published';
            return { ...item, status: nextStatus };
          }
          return item;
        }),
      };
    });
    saveMonthsData(updatedMonths);
    setSelectedMonthIndex(currentIndex);
  }, [selectedMonthIndex, saveMonthsData]);

  const handleAddSuggestedPostsBatch = useCallback((posts: Array<{ post: Partial<PostItem>; monthIndex: number }>) => {
    const currentMonths = monthsRef.current;
    const updatedMonths = currentMonths.map((m) => {
      const postsForThisMonth = posts.filter((p) => p.monthIndex === m.index);
      if (postsForThisMonth.length === 0) return m;
      const newPosts: PostItem[] = postsForThisMonth.map(({ post }, idx) => ({
        id: `post-${Date.now()}-${idx}-${Math.floor(Math.random() * 10000)}`,
        title: post.title || 'Новая публикация',
        conference: (post.conference as ConferenceType) || 'AD',
        tags: post.tags?.length ? post.tags : ['social'],
        day: post.day || 1,
        time: post.time || '12:00',
        status: 'scheduled' as const,
        description: post.description || '',
      }));
      return { ...m, items: [...m.items, ...newPosts] };
    });
    saveMonthsData(updatedMonths);
  }, [saveMonthsData]);

  const handleAddSuggestedPost = useCallback((postData: Partial<PostItem>, monthIndex: number) => {
    const currentMonths = monthsRef.current;
    const updatedMonths = currentMonths.map((m) => {
      if (m.index !== monthIndex) return m;
      const newPost: PostItem = {
        id: `post-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        title: postData.title || 'Новая публикация',
        conference: (postData.conference as ConferenceType) || 'AD',
        tags: postData.tags?.length ? postData.tags : ['social'],
        day: postData.day || 1,
        time: postData.time || '12:00',
        status: 'scheduled',
        description: postData.description || '',
      };
      return { ...m, items: [...m.items, newPost] };
    });
    saveMonthsData(updatedMonths);
  }, [saveMonthsData]);

  const handleExportPdf = () => {
    exportPlanToPdf('pdf-export-report-container', `IT-Conferences-Content-Strategy-${selectedYear}.pdf`);
    addToast({ type: 'success', title: `Экспорт PDF (${selectedYear}) начат`, message: 'Файл будет скачан автоматически' });
  };

  const handleExportJson = () => {
    const jsonStr = JSON.stringify(months, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `it_conferences_content_db_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    addToast({ type: 'success', title: 'JSON экспортирован', message: 'Файл базы данных скачан' });
  };

  const handleSearchSelect = (monthIndex: number, _postId: string) => {
    const found = months.find((m) => m.index === monthIndex);
    if (found) {
      if (found.year === 2027 && !is2027Expanded) setIs2027Expanded(true);
      setSelectedYear(found.year);
    }
    setSelectedMonthIndex(monthIndex);
    setTimeout(() => {
      const calendarElem = document.getElementById('month-calendar');
      if (calendarElem) calendarElem.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-400 text-sm font-bold uppercase tracking-widest animate-pulse">
          Проверка сессии...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <PasswordGate onSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors selection:bg-indigo-500 selection:text-white">
      <Navbar
        months={months}
        selectedYear={selectedYear}
        onChangeYear={(y) => {
          if (y === 2027 && !is2027Expanded) setIs2027Expanded(true);
          setSelectedYear(y);
          const first = months.find((m) => m.year === y);
          if (first) setSelectedMonthIndex(first.index);
        }}
        is2027Expanded={is2027Expanded}
        onToggle2027={() => setIs2027Expanded((v) => !v)}
        onSearchSelect={handleSearchSelect}
        onOpenAiGenerator={() => setIsAiModalOpen(true)}
        onExportPdf={handleExportPdf}
        onLock={handleLock}
        onOpenOnboarding={() => setIsOnboardingOpen(true)}
      />
      <main id="export-pdf-container" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <Hero
          totalPosts={totalPostsCount}
          dbSaved={dbSaved}
          year={selectedYear}
          onOpenAiGenerator={() => setIsAiModalOpen(true)}
          onExportPdf={handleExportPdf}
        />
        <section className="my-6">
          <WheelChart
            months={visibleMonths}
            selectedMonthIndex={selectedMonthIndex}
            onSelectMonth={(idx) => setSelectedMonthIndex(idx)}
            selectedTagFilter={selectedTagFilter}
            onFilterTag={(tag) => setSelectedTagFilter(tag)}
            selectedConferenceFilter={selectedConferenceFilter}
            onFilterConference={(conf) => setSelectedConferenceFilter(conf)}
            onOpenAiGenerator={() => setIsAiModalOpen(true)}
            year={selectedYear}
          />
        </section>
        <section className="my-8">
          <MonthCalendar
            month={currentMonthData}
            monthsList={visibleMonths}
            onSelectMonth={(idx) => setSelectedMonthIndex(idx)}
            onAddPost={handleOpenAddPost}
            onEditPost={handleOpenEditPost}
            onDeletePost={handleDeletePost}
            onToggleStatus={handleTogglePostStatus}
            selectedTagFilter={selectedTagFilter}
            selectedConferenceFilter={selectedConferenceFilter}
            year={selectedYear}
          />
        </section>
        <section className="my-8">
          <AnnualAnalytics months={visibleMonths} year={selectedYear} />
        </section>
      </main>
      <footer className="border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            © {selectedYear} <strong>ИТ-Конференции: AD • SQA • TWD</strong>. Планер контент-стратегии.
          </div>
          <div className="flex items-center gap-4">
            <button onClick={handleExportJson} className="hover:underline flex items-center gap-1">
              Экспорт БД JSON
            </button>
            <span>•</span>
            <button onClick={handleExportPdf} className="hover:underline">
              Экспорт в PDF
            </button>
          </div>
        </div>
      </footer>
      <PostModal
        isOpen={isPostModalOpen}
        onClose={() => setIsPostModalOpen(false)}
        post={editingPost}
        initialDay={initialPostDay}
        selectedMonthName={currentMonthData.name}
        onSave={handleSavePost}
        onDelete={handleDeletePost}
      />
      <AiStrategyModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        months={visibleMonths}
        onAddPost={handleAddSuggestedPost}
        onAddPostsBatch={handleAddSuggestedPostsBatch}
      />
      <div style={{ position: 'fixed', left: '-9999px', top: '0px', zIndex: -9999, pointerEvents: 'none' }}>
        <PdfReportView months={visibleMonths} year={selectedYear} />
      </div>
      <OnboardingModal isOpen={isOnboardingOpen} onClose={() => setIsOnboardingOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}