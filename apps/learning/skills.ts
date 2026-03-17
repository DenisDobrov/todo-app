export const learningSkills = [
  {
    name: 'explain_course',
    description: 'Объяснение содержания конкретного курса из программы (Python, Data Science, Deep Learning, MLOps).',
    parameters: { course_name: 'string' }
  },
  {
    name: 'get_progress',
    description: 'Запрос текущего прогресса пользователя по всей карьерной траектории или конкретному курсу.',
    parameters: { detail_level: 'full|current' }
  },
  {
    name: 'navigate_learning',
    description: 'Переход к конкретному модулю обучения.',
    parameters: { module_id: 'string' }
  },
  {
  name: 'update_learning_status',
  description: 'Используй, когда пользователь говорит, что прошел курс, начал новый или хочет отметить прогресс.',
  parameters: { 
    course_id: 'string', 
    new_status: 'active|done' 
    }
  }
];