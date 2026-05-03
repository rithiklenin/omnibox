import { useState, useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ExtractedTask } from '../api/extractTasks';
import { PlatformIcon } from './PlatformIcon';

type SeverityFilter = 'all' | ExtractedTask['severity'];
type DueDateFilter = 'all' | 'overdue' | 'today' | 'this_week' | 'later' | 'no_date';
type ViewMode = 'list' | 'calendar';

interface TaskBoardProps {
  tasks: ExtractedTask[];
  onUpdateTask: (id: string, updates: Partial<ExtractedTask>) => void;
  loading: boolean;
}

const severityConfig = {
  urgent: { label: 'Urgent', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', dot: 'bg-red-500' },
  high: { label: 'High', className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', dot: 'bg-orange-500' },
  medium: { label: 'Medium', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', dot: 'bg-yellow-500' },
  low: { label: 'Low', className: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400', dot: 'bg-gray-400' },
};

const severityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };

function getDueDateCategory(dueDate: string | null): DueDateFilter {
  if (!dueDate) return 'no_date';
  const due = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endOfToday = new Date(today);
  endOfToday.setHours(23, 59, 59, 999);
  const endOfWeek = new Date(today);
  endOfWeek.setDate(today.getDate() + (7 - today.getDay()));
  endOfWeek.setHours(23, 59, 59, 999);

  if (due < today) return 'overdue';
  if (due <= endOfToday) return 'today';
  if (due <= endOfWeek) return 'this_week';
  return 'later';
}

function SortableTaskRow({
  task,
  onUpdateTask,
  canDrag,
}: {
  task: ExtractedTask;
  onUpdateTask: (id: string, updates: Partial<ExtractedTask>) => void;
  canDrag: boolean;
}) {
  const [editingSeverity, setEditingSeverity] = useState(false);
  const [editingDate, setEditingDate] = useState(false);
  const config = severityConfig[task.severity];
  const dueCat = getDueDateCategory(task.dueDate);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, disabled: !canDrag });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-gray-300 dark:hover:border-gray-600 transition-colors ${task.done ? 'opacity-50' : ''}`}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className={`flex-shrink-0 ${canDrag ? 'cursor-grab active:cursor-grabbing' : 'cursor-not-allowed opacity-30'}`}
      >
        <svg className="w-4 h-4 text-gray-400" viewBox="0 0 16 16" fill="currentColor">
          <circle cx="5" cy="3" r="1.5" />
          <circle cx="11" cy="3" r="1.5" />
          <circle cx="5" cy="8" r="1.5" />
          <circle cx="11" cy="8" r="1.5" />
          <circle cx="5" cy="13" r="1.5" />
          <circle cx="11" cy="13" r="1.5" />
        </svg>
      </div>

      {/* Checkbox */}
      <button
        onClick={() => onUpdateTask(task.id, { done: !task.done })}
        className="flex-shrink-0"
      >
        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${task.done ? 'bg-green-500 border-green-500' : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400'}`}>
          {task.done && (
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      </button>

      {/* Task content */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${task.done ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-white'}`}>
          {task.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{task.description}</p>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <PlatformIcon platform={task.sourcePlatform || 'gmail'} className="w-3 h-3" />
          <span className="text-xs text-gray-400 dark:text-gray-500 truncate">
            {task.sourceSender} — {task.sourceSubject}
          </span>
        </div>
      </div>

      {/* Severity badge */}
      <div className="flex-shrink-0 relative">
        <button
          onClick={() => setEditingSeverity(!editingSeverity)}
          className={`px-2.5 py-1 text-xs font-medium rounded-full ${config.className} hover:opacity-80 transition-opacity`}
        >
          {config.label}
        </button>
        {editingSeverity && (
          <div className="absolute right-0 top-full mt-1 z-20 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 min-w-[100px]">
            {(Object.keys(severityConfig) as ExtractedTask['severity'][]).map((s) => (
              <button
                key={s}
                onClick={() => {
                  onUpdateTask(task.id, { severity: s });
                  setEditingSeverity(false);
                }}
                className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <div className={`w-2 h-2 rounded-full ${severityConfig[s].dot}`} />
                <span className="text-gray-700 dark:text-gray-300">{severityConfig[s].label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Due date */}
      <div className="flex-shrink-0 relative">
        <button
          onClick={() => setEditingDate(!editingDate)}
          className={`text-xs font-medium px-2.5 py-1 rounded-lg transition-colors ${
            dueCat === 'overdue'
              ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
              : dueCat === 'today'
              ? 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20'
              : 'text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
          }`}
        >
          {task.dueDate
            ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            : 'No date'}
        </button>
        {editingDate && (
          <div className="absolute right-0 top-full mt-1 z-20 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
            <input
              type="date"
              value={task.dueDate ? task.dueDate.split('T')[0] : ''}
              onChange={(e) => {
                onUpdateTask(task.id, {
                  dueDate: e.target.value ? new Date(e.target.value).toISOString() : null,
                });
                setEditingDate(false);
              }}
              className="text-sm bg-transparent text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {task.dueDate && (
              <button
                onClick={() => {
                  onUpdateTask(task.id, { dueDate: null });
                  setEditingDate(false);
                }}
                className="mt-2 w-full text-xs text-red-500 hover:text-red-600"
              >
                Remove date
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// --- Calendar View Helpers ---

function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDow = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const days: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);
  while (days.length % 7 !== 0) days.push(null);
  return days;
}

function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function CalendarView({
  tasks,
  onUpdateTask,
}: {
  tasks: ExtractedTask[];
  onUpdateTask: (id: string, updates: Partial<ExtractedTask>) => void;
}) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedTask, setSelectedTask] = useState<ExtractedTask | null>(null);

  const tasksByDate = useMemo(() => {
    const map: Record<string, ExtractedTask[]> = {};
    for (const task of tasks) {
      if (!task.dueDate) continue;
      const d = new Date(task.dueDate);
      const key = toDateKey(d);
      if (!map[key]) map[key] = [];
      map[key].push(task);
    }
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
    }
    return map;
  }, [tasks]);

  const days = getCalendarDays(viewYear, viewMonth);
  const todayKey = toDateKey(today);
  const monthLabel = new Date(viewYear, viewMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const goToPrevMonth = () => {
    if (viewMonth === 0) { setViewYear(viewYear - 1); setViewMonth(11); }
    else setViewMonth(viewMonth - 1);
  };

  const goToNextMonth = () => {
    if (viewMonth === 11) { setViewYear(viewYear + 1); setViewMonth(0); }
    else setViewMonth(viewMonth + 1);
  };

  const goToToday = () => {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
  };

  return (
    <div className="flex-1 overflow-y-auto p-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={goToPrevMonth}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white min-w-[160px] text-center">
            {monthLabel}
          </h2>
          <button
            onClick={goToNextMonth}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <button
          onClick={goToToday}
          className="text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          Today
        </button>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 mb-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="text-center text-xs font-medium text-gray-400 dark:text-gray-500 py-2">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 border-t border-l border-gray-200 dark:border-gray-700">
        {days.map((day, idx) => {
          const dateKey = day ? toDateKey(new Date(viewYear, viewMonth, day)) : null;
          const dayTasks = dateKey ? tasksByDate[dateKey] || [] : [];
          const isToday = dateKey === todayKey;
          const isPast = dateKey ? dateKey < todayKey : false;

          return (
            <div
              key={idx}
              className={`border-r border-b border-gray-200 dark:border-gray-700 min-h-[100px] p-1.5 ${
                day === null
                  ? 'bg-gray-50/50 dark:bg-gray-800/50'
                  : isToday
                  ? 'bg-indigo-50/50 dark:bg-indigo-900/10'
                  : 'bg-white dark:bg-gray-800'
              }`}
            >
              {day !== null && (
                <>
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${
                        isToday
                          ? 'bg-indigo-500 text-white'
                          : isPast
                          ? 'text-gray-400 dark:text-gray-500'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {day}
                    </span>
                    {dayTasks.length > 0 && (
                      <span className="text-[10px] text-gray-400 dark:text-gray-500">
                        {dayTasks.length}
                      </span>
                    )}
                  </div>
                  <div className="space-y-0.5">
                    {dayTasks.slice(0, 3).map((task) => (
                      <button
                        key={task.id}
                        onClick={() => setSelectedTask(selectedTask?.id === task.id ? null : task)}
                        className={`w-full text-left px-1.5 py-0.5 rounded text-[11px] leading-tight truncate transition-colors ${
                          task.done
                            ? 'line-through text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-700/50'
                            : `${severityConfig[task.severity].className}`
                        }`}
                        title={task.title}
                      >
                        {task.title}
                      </button>
                    ))}
                    {dayTasks.length > 3 && (
                      <div className="text-[10px] text-gray-400 dark:text-gray-500 px-1.5">
                        +{dayTasks.length - 3} more
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Task detail popover */}
      {selectedTask && (
        <div className="mt-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <button
                  onClick={() => onUpdateTask(selectedTask.id, { done: !selectedTask.done })}
                  className="flex-shrink-0"
                >
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${selectedTask.done ? 'bg-green-500 border-green-500' : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400'}`}>
                    {selectedTask.done && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </button>
                <h3 className={`text-sm font-semibold ${selectedTask.done ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                  {selectedTask.title}
                </h3>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{selectedTask.description}</p>
              <div className="flex items-center gap-2">
                <PlatformIcon platform={selectedTask.sourcePlatform || 'gmail'} className="w-3 h-3" />
                <span className="text-xs text-gray-400 dark:text-gray-500 truncate">
                  {selectedTask.sourceSender} — {selectedTask.sourceSubject}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${severityConfig[selectedTask.severity].className}`}>
                {severityConfig[selectedTask.severity].label}
              </span>
              <div className="relative">
                <input
                  type="date"
                  value={selectedTask.dueDate ? selectedTask.dueDate.split('T')[0] : ''}
                  onChange={(e) => {
                    onUpdateTask(selectedTask.id, {
                      dueDate: e.target.value ? new Date(e.target.value).toISOString() : null,
                    });
                    setSelectedTask({ ...selectedTask, dueDate: e.target.value ? new Date(e.target.value).toISOString() : null });
                  }}
                  className="text-xs bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Main TaskBoard ---

export function TaskBoard({ tasks, onUpdateTask, loading }: TaskBoardProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');
  const [dueDateFilter, setDueDateFilter] = useState<DueDateFilter>('all');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const filteredTasks = useMemo(() => {
    let result = [...tasks];
    if (severityFilter !== 'all') {
      result = result.filter((t) => t.severity === severityFilter);
    }
    if (dueDateFilter !== 'all') {
      result = result.filter((t) => getDueDateCategory(t.dueDate) === dueDateFilter);
    }
    return result;
  }, [tasks, severityFilter, dueDateFilter]);

  const groupedBySeverity = useMemo(() => {
    const groups: Record<string, ExtractedTask[]> = {};
    const sorted = [...filteredTasks].sort(
      (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
    );
    for (const task of sorted) {
      if (!groups[task.severity]) groups[task.severity] = [];
      groups[task.severity].push(task);
    }
    return groups;
  }, [filteredTasks]);

  const flatTaskIds = useMemo(() => {
    const ids: string[] = [];
    for (const severity of ['urgent', 'high', 'medium', 'low'] as const) {
      const group = groupedBySeverity[severity] || [];
      for (const t of group) ids.push(t.id);
    }
    return ids;
  }, [groupedBySeverity]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeTask = tasks.find((t) => t.id === active.id);
    const overTask = tasks.find((t) => t.id === over.id);
    if (!activeTask || !overTask) return;

    if (activeTask.severity !== overTask.severity) return;

    const group = groupedBySeverity[activeTask.severity] || [];
    const oldIndex = group.findIndex((t) => t.id === active.id);
    const newIndex = group.findIndex((t) => t.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(group, oldIndex, newIndex);
    reordered.forEach((t, i) => {
      onUpdateTask(t.id, { order: i });
    });
  };

  const pendingCount = tasks.filter((t) => !t.done).length;
  const doneCount = tasks.filter((t) => t.done).length;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <h1 className="text-sm font-semibold text-gray-900 dark:text-white">Task Board</h1>
          </div>
          {pendingCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full">
              {pendingCount} pending
            </span>
          )}
          {doneCount > 0 && (
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {doneCount} done
            </span>
          )}
        </div>

        {/* View toggle + Filters */}
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-white'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              title="List view"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'calendar'
                  ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-white'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              title="Calendar view"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
          </div>

          {/* Filters (shown in list view only) */}
          {viewMode === 'list' && (
            <>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value as SeverityFilter)}
                className="text-xs bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-2.5 py-1.5 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Severity</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>

              <select
                value={dueDateFilter}
                onChange={(e) => setDueDateFilter(e.target.value as DueDateFilter)}
                className="text-xs bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-2.5 py-1.5 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Dates</option>
                <option value="overdue">Overdue</option>
                <option value="today">Today</option>
                <option value="this_week">This Week</option>
                <option value="later">Later</option>
                <option value="no_date">No Date</option>
              </select>
            </>
          )}
        </div>
      </div>

      {/* Content area */}
      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-indigo-500 rounded-full animate-spin mb-4" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Analyzing emails for tasks...</p>
        </div>
      ) : viewMode === 'calendar' ? (
        <CalendarView tasks={filteredTasks} onUpdateTask={onUpdateTask} />
      ) : flatTaskIds.length > 0 ? (
        <div className="flex-1 overflow-y-auto">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={flatTaskIds} strategy={verticalListSortingStrategy}>
              <div className="p-4 space-y-2">
                {(['urgent', 'high', 'medium', 'low'] as const).map((severity) => {
                  const group = groupedBySeverity[severity];
                  if (!group || group.length === 0) return null;
                  const canDrag = group.length > 1;
                  return group.map((task) => (
                    <SortableTaskRow
                      key={task.id}
                      task={task}
                      onUpdateTask={onUpdateTask}
                      canDrag={canDrag}
                    />
                  ));
                })}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center mb-4">
            <svg className="w-7 h-7 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">No tasks yet</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm">
            {tasks.length === 0
              ? 'Tasks will appear here once your emails are analyzed.'
              : 'No tasks match your current filters.'}
          </p>
        </div>
      )}
    </div>
  );
}
