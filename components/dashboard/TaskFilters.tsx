// app/dashboard/TaskFilters.tsx
'use client'

import { updateProjectActiveStatus } from '@/app/dashboard/actions';
import { useState } from 'react'

export function TaskFilters({ projects, onFilterChange }: { projects: any[], onFilterChange: (id: string | null) => void }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [longPressTimer, setLongPressTimer] = useState<any>(null);

  const handleSelect = (id: string | null) => {
    setActiveId(id);
    onFilterChange(id);
  };

  // Логика долгого нажатия
  const startPress = (project: any) => {
    const timer = setTimeout(() => {
      // Инвертируем статус активности (предполагаем, что true, если не задано)
      const currentActive = project.is_active !== false;
      updateProjectActiveStatus(project.id, !currentActive);
      if (navigator.vibrate) navigator.vibrate(50);
    }, 700);
    setLongPressTimer(timer);
  };

  const endPress = () => {
    if (longPressTimer) clearTimeout(longPressTimer);
  };

  return (
    <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar items-center">
      {/* Кнопка "Все" */}
      <button
        onClick={() => handleSelect(null)}
        className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
          activeId === null ? "bg-black text-white" : "bg-secondary text-muted-foreground border"
        }`}
      >
        Все задачи
      </button>

      {/* Список проектов */}
      {projects.map((project) => (
        <button
          key={project.id}
          onMouseDown={() => startPress(project)}
          onMouseUp={endPress}
          onMouseLeave={endPress}
          onTouchStart={() => startPress(project)}
          onTouchEnd={endPress}
          onClick={() => handleSelect(project.id)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${
            activeId === project.id 
              ? "bg-orange-500 text-white" 
              : "bg-white text-muted-foreground border shadow-sm"
            } ${project.is_active === false ? 'opacity-40 grayscale' : 'opacity-100'}`}
        >
          {project.is_system ? "📥" : "🚀"}
          {project.title}
        </button>
      ))}
    </div>
  )
}