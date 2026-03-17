import { CheckCircle2, PlayCircle, Lock, BookOpen } from 'lucide-react'

export default function LearningPath({ courses }: { courses: any[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      {courses.map((course) => (
        <div 
          key={course.id}
          className={`relative group rounded-3xl p-6 transition-all duration-300 border ${
            course.status === 'done' 
              ? 'bg-green-50/50 border-green-100' 
              : course.status === 'active'
              ? 'bg-white border-blue-500 shadow-xl shadow-blue-500/10'
              : 'bg-white/80 border-slate-100 hover:border-blue-200'
          }`}
        >
          {/* Категория и уровень */}
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-slate-50 px-2 py-1 rounded">
              {course.category}
            </span>
            <span className="text-[10px] font-medium text-blue-500">
              {course.level}
            </span>
          </div>

          {/* Заголовок */}
          <h3 className="text-lg font-bold text-slate-800 mb-2 leading-tight">
            {course.title}
          </h3>

          {/* Иконка статуса и текст */}
          <div className="flex items-center mt-6 justify-between">
            <div className="flex items-center gap-2">
              {course.status === 'done' && (
                <div className="flex items-center gap-1.5 text-green-600 text-xs font-bold">
                  <CheckCircle2 size={16} /> Завершено
                </div>
              )}
              {course.status === 'active' && (
                <div className="flex items-center gap-1.5 text-blue-600 text-xs font-bold animate-pulse">
                  <PlayCircle size={16} /> В процессе
                </div>
              )}
              {course.status === 'not_started' && (
                <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
                  <BookOpen size={16} /> Начать обучение
                </div>
              )}
            </div>

            {/* Декоративная иконка в углу */}
            <div className={`p-2 rounded-xl ${
              course.status === 'active' ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-300'
            }`}>
              {course.status === 'done' ? <CheckCircle2 size={18} /> : <PlayCircle size={18} />}
            </div>
          </div>

          {/* Прогресс-бар (показываем только для активных) */}
          {course.status === 'active' && (
            <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-100 overflow-hidden rounded-b-3xl">
              <div className="h-full bg-blue-600 w-1/3 animate-progress" />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}