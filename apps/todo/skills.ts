export const todoSkills = [
  {
    name: 'create_task',
    description: 'Создание новой задачи. Используй только эти ключи в параметрах: title, priority, due_at.',
    parameters: { 
      title: 'string', 
      priority: 'low|medium|high', 
      due_at: 'ISO datetime string' 
    }
  },
  {
    name: 'query_tasks',
    description: 'Просмотр списка дел. Например: "что на сегодня", "какие планы".',
    parameters: { timeframe: 'today|tomorrow|all' }
  },
  {
    name: 'delete_tasks',
    description: 'Удаление задач. Можно удалять выполненные или по дате.',
    parameters: { only_completed: 'boolean', date_filter: 'today|tomorrow|null' }
  },
  {
    name: 'complete_tasks',
    description: 'Отметка задач как выполненных.',
    parameters: { tag: 'string|null', date_filter: 'today|tomorrow|null' }
  },
  {
    name: 'ui_filter',
    description: 'Используй, когда пользователь просит отфильтровать список (например, "покажи только важные") или ПОКАЗАТЬ ВСЕ задачи обратно (в этом случае priority_level должен быть null).',
    parameters: { priority_level: 'low|medium|high|null' }
  }
];