// app/dashboard/TaskFilters.tsx
'use client'

import { useState } from 'react'

export function TaskFilters({ projects, onFilterChange }: { projects: any[], onFilterChange: (id: string | null) => void }) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const handleSelect = (id: string | null) => {
    setActiveId(id);
    onFilterChange(id);
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
          onClick={() => handleSelect(project.id)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${
            activeId === project.id 
              ? "bg-orange-500 text-white" 
              : "bg-white text-muted-foreground border shadow-sm"
          }`}
        >
          {project.is_system ? "📥" : "🚀"}
          {project.title}
        </button>
      ))}
    </div>
  )
}