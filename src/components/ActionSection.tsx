import { useState } from 'react';
import type { ActionItem } from '../types';
import { ActionCard } from './ActionCard';

interface ActionSectionProps {
  title: string;
  icon: React.ReactNode;
  actions: ActionItem[];
  onMarkDone: (id: string) => void;
  onDismiss: (id: string) => void;
  defaultOpen?: boolean;
}

export function ActionSection({
  title,
  icon,
  actions,
  onMarkDone,
  onDismiss,
  defaultOpen = true,
}: ActionSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const unreadCount = actions.filter((a) => !a.isRead).length;

  if (actions.length === 0) return null;

  return (
    <section className="mb-8">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between mb-3 group"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-gray-400 dark:text-gray-500">{icon}</span>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide">
            {title}
          </h2>
          <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
            {actions.length}
          </span>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-full">
              {unreadCount} new
            </span>
          )}
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-0' : '-rotate-90'}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="space-y-2">
          {actions.map((action) => (
            <ActionCard
              key={action.id}
              action={action}
              onMarkDone={onMarkDone}
              onDismiss={onDismiss}
            />
          ))}
        </div>
      )}
    </section>
  );
}
