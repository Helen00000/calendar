import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Lightbulb,
  Plus,
  Trash2,
  Edit3,
  Check,
  Copy,
  X,
  Search,
  CalendarPlus,
  CheckCircle2,
  Clock,
  FolderPlus,
  Folder,
  Tag as TagIcon,
} from 'lucide-react';
import { IdeaSheet, IdeaNote, IdeaNoteStatus, ConferenceType } from '../types';
import { CONFERENCE_CONFIGS } from '../data/initialData';

interface IdeaNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  sheets: IdeaSheet[];
  onSaveSheets: (sheets: IdeaSheet[]) => void;
  onConvertToPost?: (note: IdeaNote) => void;
}

const COMMON_TAG_SUGGESTIONS = [
  'статья',
  'доклад',
  'кейс',
  'инструменты',
  'telegram',
  'видео',
  'гайд',
  'новости',
  'ai',
];

export const IdeaNotesModal: React.FC<IdeaNotesModalProps> = ({
  isOpen,
  onClose,
  sheets,
  onSaveSheets,
  onConvertToPost,
}) => {
  const [activeSheetId, setActiveSheetId] = useState<string>(() => sheets[0]?.id || 'sheet-1');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTagFilter, setSelectedTagFilter] = useState<string | null>(null);
  const [copiedNoteId, setCopiedNoteId] = useState<string | null>(null);

  // Папки (листы)
  const [isCreatingSheet, setIsCreatingSheet] = useState(false);
  const [newSheetName, setNewSheetName] = useState('');
  const [editingSheetId, setEditingSheetId] = useState<string | null>(null);
  const [editingSheetName, setEditingSheetName] = useState('');
  const [sheetToDelete, setSheetToDelete] = useState<IdeaSheet | null>(null);

  // Модалка подробного добавления / редактирования заметки
  const [isEditingNoteModalOpen, setIsEditingNoteModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Partial<IdeaNote> | null>(null);
  const [newTagInput, setNewTagInput] = useState('');
  const titleInputRef = useRef<HTMLInputElement | null>(null);

  // Автофокус на название при открытии формы заметки
  useEffect(() => {
    if (isEditingNoteModalOpen) {
      setTimeout(() => titleInputRef.current?.focus(), 80);
    }
  }, [isEditingNoteModalOpen]);

  // Выбранный лист
  const currentSheet = useMemo(() => {
    return sheets.find((s) => s.id === activeSheetId) || sheets[0] || null;
  }, [sheets, activeSheetId]);

  // Все уникальные теги текущего листа
  const sheetAvailableTags = useMemo(() => {
    if (!currentSheet) return [];
    const set = new Set<string>();
    currentSheet.notes.forEach((n) => {
      if (Array.isArray(n.tags)) {
        n.tags.forEach((t) => {
          if (t && t.trim()) set.add(t.trim());
        });
      }
    });
    return Array.from(set);
  }, [currentSheet]);

  // Общее количество заметок
  const totalNotesCount = useMemo(() => {
    return sheets.reduce((acc, s) => acc + s.notes.length, 0);
  }, [sheets]);

  // Фильтрация заметок
  const filteredNotes = useMemo(() => {
    if (!currentSheet) return [];
    let list = currentSheet.notes;

    if (selectedTagFilter) {
      list = list.filter((n) => n.tags && n.tags.includes(selectedTagFilter));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q) ||
          (n.conference && n.conference.toLowerCase().includes(q)) ||
          (n.tags && n.tags.some((t) => t.toLowerCase().includes(q)))
      );
    }

    return list;
  }, [currentSheet, searchQuery, selectedTagFilter]);

  // Открыть подробное создание новой заметки
  const handleOpenCreateNote = () => {
    setEditingNote({
      title: '',
      content: '',
      conference: 'ALL',
      tags: [],
      status: 'idea',
    });
    setNewTagInput('');
    setIsEditingNoteModalOpen(true);
  };

  // Открыть редактирование существующей заметки
  const handleOpenEditNote = (note: IdeaNote) => {
    setEditingNote({
      ...note,
      tags: Array.isArray(note.tags) ? [...note.tags] : [],
    });
    setNewTagInput('');
    setIsEditingNoteModalOpen(true);
  };

  // Добавить тег в редактируемую заметку
  const handleAddTagToEditingNote = (tagToAdd: string) => {
    const trimmed = tagToAdd.trim().toLowerCase().replace(/^#/, '');
    if (!trimmed || !editingNote) return;
    const currentTags = editingNote.tags || [];
    if (!currentTags.includes(trimmed)) {
      setEditingNote({
        ...editingNote,
        tags: [...currentTags, trimmed],
      });
    }
    setNewTagInput('');
  };

  // Удалить тег из редактируемой заметки
  const handleRemoveTagFromEditingNote = (tagToRemove: string) => {
    if (!editingNote) return;
    setEditingNote({
      ...editingNote,
      tags: (editingNote.tags || []).filter((t) => t !== tagToRemove),
    });
  };

  // Сохранить подробную заметку
  const handleSaveDetailedNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNote || !editingNote.title?.trim()) return;

    // Если нет ни одного листа, создаем дефолтный
    let targetSheet = currentSheet;
    let baseSheets = sheets;

    if (!targetSheet) {
      const fallbackSheet: IdeaSheet = {
        id: `sheet-${Date.now()}`,
        name: 'Мои идеи',
        icon: 'Folder',
        notes: [],
        createdAt: new Date().toISOString(),
      };
      baseSheets = [fallbackSheet];
      targetSheet = fallbackSheet;
      setActiveSheetId(fallbackSheet.id);
    }

    const isNew = !editingNote.id;
    const noteId = editingNote.id || `note-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

    const savedItem: IdeaNote = {
      id: noteId,
      title: editingNote.title.trim(),
      content: editingNote.content || '',
      conference: editingNote.conference || 'ALL',
      tags: editingNote.tags || [],
      status: editingNote.status || 'idea',
      color: 'amber',
      createdAt: editingNote.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = baseSheets.map((s) => {
      if (s.id === targetSheet!.id) {
        if (isNew) {
          return { ...s, notes: [savedItem, ...s.notes] };
        }
        return {
          ...s,
          notes: s.notes.map((n) => (n.id === noteId ? savedItem : n)),
        };
      }
      return s;
    });

    onSaveSheets(updated);
    setIsEditingNoteModalOpen(false);
    setEditingNote(null);
  };

  // Удалить заметку
  const handleDeleteNote = (noteId: string) => {
    if (!currentSheet) return;
    const updated = sheets.map((s) => {
      if (s.id === currentSheet.id) {
        return { ...s, notes: s.notes.filter((n) => n.id !== noteId) };
      }
      return s;
    });
    onSaveSheets(updated);
  };

  // Переключить статус заметки (idea <-> done)
  const handleToggleNoteStatus = (noteId: string) => {
    if (!currentSheet) return;
    const updated = sheets.map((s) => {
      if (s.id === currentSheet.id) {
        return {
          ...s,
          notes: s.notes.map((n) => {
            if (n.id === noteId) {
              const nextStatus: IdeaNoteStatus = n.status === 'done' ? 'idea' : 'done';
              return { ...n, status: nextStatus, updatedAt: new Date().toISOString() };
            }
            return n;
          }),
        };
      }
      return s;
    });
    onSaveSheets(updated);
  };

  // Создать новую папку (лист)
  const handleCreateSheet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSheetName.trim()) return;

    const newSheet: IdeaSheet = {
      id: `sheet-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: newSheetName.trim(),
      icon: 'Folder',
      notes: [],
      createdAt: new Date().toISOString(),
    };

    const updated = [...sheets, newSheet];
    onSaveSheets(updated);
    setActiveSheetId(newSheet.id);
    setNewSheetName('');
    setIsCreatingSheet(false);
  };

  // Переименовать папку (любую!)
  const handleRenameSheet = (sheetId: string) => {
    if (!editingSheetName.trim()) {
      setEditingSheetId(null);
      return;
    }
    const updated = sheets.map((s) =>
      s.id === sheetId ? { ...s, name: editingSheetName.trim() } : s
    );
    onSaveSheets(updated);
    setEditingSheetId(null);
  };

  // Запрос на удаление папки (открывает надежное модальное подтверждение в UI)
  const handleRequestDeleteSheet = (sheet: IdeaSheet) => {
    setSheetToDelete(sheet);
  };

  // Подтвержденное удаление папки (любой!). Если удаляется последняя, создаем чистую "Мои заметки"
  const handleConfirmDeleteSheet = (sheetId: string) => {
    const filtered = sheets.filter((s) => s.id !== sheetId);

    if (filtered.length === 0) {
      const defaultSheet: IdeaSheet = {
        id: `sheet-${Date.now()}`,
        name: 'Мои заметки',
        icon: 'Folder',
        notes: [],
        createdAt: new Date().toISOString(),
      };
      onSaveSheets([defaultSheet]);
      setActiveSheetId(defaultSheet.id);
    } else {
      onSaveSheets(filtered);
      if (activeSheetId === sheetId) {
        setActiveSheetId(filtered[0].id);
      }
    }
    setSelectedTagFilter(null);
    setSheetToDelete(null);
  };

  // Копировать заметку
  const handleCopyNote = (note: IdeaNote) => {
    const tagsText = note.tags && note.tags.length > 0 ? `\nТеги: #${note.tags.join(' #')}` : '';
    const text = `${note.title}\n\n${note.content || ''}${tagsText}`.trim();
    navigator.clipboard.writeText(text);
    setCopiedNoteId(note.id);
    setTimeout(() => setCopiedNoteId(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header: чистый, без лишних импортов и надписей */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <Lightbulb className="w-5 h-5 fill-white/20" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  Заметки для идей
                </h2>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                  {totalNotesCount} {totalNotesCount === 1 ? 'заметка' : totalNotesCount < 5 ? 'заметки' : 'заметок'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Папки с мыслями, тезисами и темами публикаций
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Закрыть"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Папки / Листы: легкое редактирование и удаление ЛЮБОЙ папки */}
        <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2 overflow-x-auto shrink-0 scrollbar-none">
          <div className="flex items-center gap-1.5 flex-nowrap shrink-0">
            {sheets.map((sheet) => {
              const isActive = sheet.id === currentSheet?.id;
              const isEditing = editingSheetId === sheet.id;

              return (
                <div
                  key={sheet.id}
                  className={`group relative flex items-center rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-white text-slate-900 shadow-xs border border-slate-300'
                      : 'bg-slate-200/60 text-slate-600 hover:bg-white/80 hover:text-slate-900'
                  }`}
                >
                  {isEditing ? (
                    <div className="flex items-center px-2 py-1 gap-1">
                      <input
                        type="text"
                        value={editingSheetName}
                        onChange={(e) => setEditingSheetName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRenameSheet(sheet.id);
                          if (e.key === 'Escape') setEditingSheetId(null);
                        }}
                        autoFocus
                        className="w-32 px-1.5 py-0.5 text-xs font-bold border border-indigo-400 rounded outline-none bg-white text-slate-900"
                      />
                      <button
                        type="button"
                        onClick={() => handleRenameSheet(sheet.id)}
                        className="p-1 text-emerald-600 hover:bg-emerald-50 rounded cursor-pointer"
                        title="Сохранить название"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingSheetId(null)}
                        className="p-1 text-slate-400 hover:bg-slate-100 rounded cursor-pointer"
                        title="Отмена"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveSheetId(sheet.id);
                          setSelectedTagFilter(null);
                        }}
                        className="flex items-center gap-1.5 px-3 py-2 cursor-pointer"
                      >
                        <Folder className={`w-3.5 h-3.5 ${isActive ? 'text-amber-500' : 'text-slate-400'}`} />
                        <span className="truncate max-w-[150px]">{sheet.name}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                            isActive
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-300/60 text-slate-600'
                          }`}
                        >
                          {sheet.notes.length}
                        </span>
                      </button>

                      {/* Кнопки переименования и удаления папки — доступны для всех папок */}
                      <div className="flex items-center pr-1.5 gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingSheetId(sheet.id);
                            setEditingSheetName(sheet.name);
                          }}
                          className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded cursor-pointer"
                          title="Переименовать папку"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRequestDeleteSheet(sheet);
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                          title="Удалить эту папку"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Создание новой папки */}
          {isCreatingSheet ? (
            <form
              onSubmit={handleCreateSheet}
              className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-xl border border-indigo-300 shadow-xs shrink-0"
            >
              <input
                type="text"
                value={newSheetName}
                onChange={(e) => setNewSheetName(e.target.value)}
                placeholder="Имя папки..."
                autoFocus
                className="w-32 px-1.5 py-0.5 text-xs font-semibold outline-none text-slate-900"
              />
              <button
                type="submit"
                className="p-1 text-indigo-600 hover:bg-indigo-50 rounded cursor-pointer"
                title="Создать папку"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCreatingSheet(false);
                  setNewSheetName('');
                }}
                className="p-1 text-slate-400 hover:bg-slate-100 rounded cursor-pointer"
                title="Отмена"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setIsCreatingSheet(true)}
              className="flex items-center gap-1 px-3 py-2 rounded-xl border border-dashed border-slate-300 text-slate-600 hover:border-indigo-400 hover:text-indigo-600 hover:bg-white text-xs font-bold transition-all shrink-0 cursor-pointer"
              title="Создать новую папку"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>+ Новая папка</span>
            </button>
          )}
        </div>

        {/* Панель действий: ЕДИНСТВЕННЫЙ подробный способ добавления + быстрый поиск */}
        <div className="px-5 py-3 bg-white border-b border-slate-100 flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenCreateNote}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-xs shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Новая заметка</span>
            </button>

            {selectedTagFilter && (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-800 font-medium">
                <span>#{selectedTagFilter}</span>
                <button
                  type="button"
                  onClick={() => setSelectedTagFilter(null)}
                  className="p-0.5 hover:bg-indigo-100 rounded-full"
                  title="Сбросить фильтр по тегу"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по тексту или #тегам..."
              className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Быстрые теги листа для мгновенной фильтрации */}
        {sheetAvailableTags.length > 0 && (
          <div className="px-5 py-2 bg-slate-50/70 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto shrink-0 scrollbar-none text-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mr-1">
              <TagIcon className="w-3 h-3" /> Теги:
            </span>
            {sheetAvailableTags.map((tag) => {
              const isSelected = selectedTagFilter === tag;
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setSelectedTagFilter(isSelected ? null : tag)}
                  className={`px-2 py-0.5 rounded-lg text-xs font-medium transition-colors cursor-pointer shrink-0 ${
                    isSelected
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
                  }`}
                >
                  #{tag}
                </button>
              );
            })}
          </div>
        )}

        {/* Список заметок */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50">
          {filteredNotes.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-white rounded-2xl border border-dashed border-slate-200">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mb-3">
                <Lightbulb className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 mb-1">
                {searchQuery || selectedTagFilter
                  ? 'Ничего не найдено по фильтрам'
                  : 'В этой папке пока нет заметок'}
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mb-4">
                {searchQuery || selectedTagFilter
                  ? 'Попробуйте сбросить фильтры или изменить запрос поиска'
                  : 'Запишите идеи для статей, тезисы для выступлений или интересные кейсы.'}
              </p>
              <button
                type="button"
                onClick={handleOpenCreateNote}
                className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-colors cursor-pointer shadow-xs"
              >
                + Создать заметку
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredNotes.map((note) => {
                const isDone = note.status === 'done';
                const confKey = note.conference as ConferenceType;
                const confConfig =
                  confKey && confKey !== ('ALL' as any) ? CONFERENCE_CONFIGS[confKey] : null;

                return (
                  <div
                    key={note.id}
                    className="bg-white rounded-2xl border border-slate-200/90 hover:border-indigo-300 p-4 flex flex-col justify-between transition-all hover:shadow-md group relative shadow-2xs"
                  >
                    <div>
                      {/* Top badges & Actions */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {confConfig ? (
                            <span
                              className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${confConfig.bgColor}`}
                              title={`${confConfig.name} (${confConfig.description})`}
                            >
                              {confConfig.shortLabel || note.conference}
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                              Общее
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => handleToggleNoteStatus(note.id)}
                            className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded flex items-center gap-1 transition-colors cursor-pointer ${
                              isDone
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-600 hover:bg-amber-100 hover:text-amber-900'
                            }`}
                            title="Переключить статус (выполнено / идея)"
                          >
                            {isDone ? (
                              <>
                                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                                <span>Готово</span>
                              </>
                            ) : (
                              <>
                                <Clock className="w-2.5 h-2.5 text-amber-600" />
                                <span>Идея</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* Действия над заметкой */}
                        <div className="flex items-center gap-0.5 opacity-70 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => handleCopyNote(note)}
                            className="p-1 rounded text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Скопировать текст"
                          >
                            {copiedNoteId === note.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEditNote(note)}
                            className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                            title="Редактировать заметку и теги"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteNote(note.id)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Удалить заметку"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Заголовок */}
                      <h4
                        className={`text-sm font-bold text-slate-900 mb-1.5 leading-snug ${
                          isDone ? 'line-through text-slate-400' : ''
                        }`}
                      >
                        {note.title}
                      </h4>

                      {/* Текст */}
                      {note.content && (
                        <p className="text-xs text-slate-600 whitespace-pre-line line-clamp-4 mb-2.5 font-normal leading-relaxed">
                          {note.content}
                        </p>
                      )}

                      {/* Теги заметки */}
                      {note.tags && note.tags.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap mb-2">
                          {note.tags.map((tag) => (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => setSelectedTagFilter(tag)}
                              className="text-[10px] font-medium text-slate-600 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 px-1.5 py-0.5 rounded transition-colors cursor-pointer"
                            >
                              #{tag}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Подвал карточки */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 mt-1">
                      <span>
                        {new Date(note.createdAt).toLocaleDateString('ru-RU', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>

                      {onConvertToPost && (
                        <button
                          type="button"
                          onClick={() => {
                            onConvertToPost(note);
                            onClose();
                          }}
                          className="text-[10px] font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50/70 hover:bg-indigo-100 px-2 py-1 rounded-lg border border-indigo-200/80 flex items-center gap-1 transition-colors cursor-pointer"
                          title="Создать пост в календаре из этой идеи"
                        >
                          <CalendarPlus className="w-3 h-3" />
                          <span>В календарь</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Подвал модалки */}
        <div className="px-5 py-2.5 bg-white border-t border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0">
          <span className="text-[11px] text-slate-400">
            Папка: <strong className="text-slate-700">{currentSheet?.name}</strong> •{' '}
            {filteredNotes.length} {filteredNotes.length === 1 ? 'заметка' : 'заметок'}
          </span>
          <span className="text-[11px] text-slate-400">
            Кнопка «В календарь» перенесет заметку и ее теги в план публикаций
          </span>
        </div>
      </div>

      {/* ЕДИНСТВЕННЫЙ ПОДРОБНЫЙ РЕДАКТОР ЗАМЕТКИ (с тегами вместо цветов) */}
      {isEditingNoteModalOpen && editingNote && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <span>{editingNote.id ? 'Редактирование заметки' : 'Новая заметка'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsEditingNoteModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={handleSaveDetailedNote}
              className="p-5 space-y-4 overflow-y-auto flex-1"
            >
              {/* Заголовок */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Заголовок идеи / темы *
                </label>
                <input
                  ref={titleInputRef}
                  type="text"
                  required
                  value={editingNote.title || ''}
                  onChange={(e) => setEditingNote({ ...editingNote, title: e.target.value })}
                  placeholder="О чем мысль? Например: Новинки Playwright в 2026..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Текст заметки */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Тезисы, ссылки или подробное описание
                </label>
                <textarea
                  rows={4}
                  value={editingNote.content || ''}
                  onChange={(e) => setEditingNote({ ...editingNote, content: e.target.value })}
                  placeholder="План, ссылки на статьи, ключевые аргументы..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 resize-none leading-relaxed"
                />
              </div>

              {/* Конференция */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Привязка к конференции
                </label>
                <select
                  value={editingNote.conference || 'ALL'}
                  onChange={(e) =>
                    setEditingNote({ ...editingNote, conference: e.target.value as any })
                  }
                  className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 bg-white cursor-pointer"
                >
                  <option value="ALL">Общее (без привязки к конференции)</option>
                  <option value="AD">Analyst Days (AD) — по системному и бизнес анализу</option>
                  <option value="SQA">SQA Days (SQA) — по тестированию и качеству ПО</option>
                  <option value="TWD">TechWriter Days (TWD) — по технической документации</option>
                </select>
              </div>

              {/* УПРАВЛЕНИЕ ТЕГАМИ (ВМЕСТО ЦВЕТОВ) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <TagIcon className="w-3 h-3 text-indigo-600" />
                    Теги заметки
                  </span>
                  <span className="text-[10px] font-normal text-slate-400">
                    добавляйте или выбирайте из списка
                  </span>
                </label>

                {/* Текущие назначенные теги */}
                <div className="flex items-center gap-1.5 flex-wrap min-h-[32px] p-2 bg-slate-50 rounded-xl border border-slate-200 mb-2">
                  {editingNote.tags && editingNote.tags.length > 0 ? (
                    editingNote.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 text-xs font-semibold"
                      >
                        #{tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTagFromEditingNote(tag)}
                          className="hover:text-rose-600 rounded-full p-0.2 cursor-pointer"
                          title="Удалить тег"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 italic">
                      Нет тегов. Введите тег ниже или выберите из быстрых подсказок
                    </span>
                  )}
                </div>

                {/* Ввод нового тега */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="relative flex-1">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">
                      #
                    </span>
                    <input
                      type="text"
                      value={newTagInput}
                      onChange={(e) => setNewTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTagToEditingNote(newTagInput);
                        }
                      }}
                      placeholder="Название тега (например: статья)..."
                      className="w-full pl-6 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddTagToEditingNote(newTagInput)}
                    disabled={!newTagInput.trim()}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    + Тег
                  </button>
                </div>

                {/* Быстрые подсказки тегов */}
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="text-[10px] text-slate-400 font-medium mr-1">Быстрые:</span>
                  {COMMON_TAG_SUGGESTIONS.map((sug) => {
                    const isAdded = editingNote.tags?.includes(sug);
                    return (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => {
                          if (isAdded) {
                            handleRemoveTagFromEditingNote(sug);
                          } else {
                            handleAddTagToEditingNote(sug);
                          }
                        }}
                        className={`text-[10px] px-2 py-0.5 rounded-md font-medium transition-colors cursor-pointer ${
                          isAdded
                            ? 'bg-indigo-600 text-white font-bold'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {isAdded ? `✓ #${sug}` : `+#${sug}`}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Статус */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Статус
                </label>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer text-xs font-medium text-slate-800">
                    <input
                      type="radio"
                      name="noteStatus"
                      checked={editingNote.status !== 'done'}
                      onChange={() => setEditingNote({ ...editingNote, status: 'idea' })}
                      className="accent-indigo-600"
                    />
                    <span>💡 В идеях</span>
                  </label>
                  <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer text-xs font-medium text-slate-800">
                    <input
                      type="radio"
                      name="noteStatus"
                      checked={editingNote.status === 'done'}
                      onChange={() => setEditingNote({ ...editingNote, status: 'done' })}
                      className="accent-indigo-600"
                    />
                    <span>✅ Реализовано</span>
                  </label>
                </div>
              </div>

              {/* Кнопки сохранения */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsEditingNoteModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
                >
                  Сохранить заметку
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Модальное окно подтверждения удаления папки (без ненадежного window.confirm) */}
      {sheetToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-5 sm:p-6 max-w-sm w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
              <Trash2 className="w-5 h-5" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-1.5">
              Удалить папку «{sheetToDelete.name}»?
            </h3>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              {sheetToDelete.notes.length > 0
                ? `Все заметки в этой папке (${sheetToDelete.notes.length} шт.) будут удалены.`
                : 'Эта папка пуста и будет удалена.'}
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSheetToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={() => handleConfirmDeleteSheet(sheetToDelete.id)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-xs cursor-pointer"
              >
                Удалить папку
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
