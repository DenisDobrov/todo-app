const COURSES = [
  { id: 'python-ai', title: 'Python for AI', subtitle: 'Master the basics', status: 'Done' },
  { id: 'math-ml', title: 'Mathematics for ML', subtitle: 'Linear algebra & calculus', status: 'Active' },
  { id: 'deep-learning', title: 'Deep Learning', subtitle: 'Neural Networks', status: 'Locked' },
];

export function CourseList() {
  return (
    <div className="space-y-3">
      {COURSES.map((course) => (
        <div 
          key={course.id}
          className={`flex items-center justify-between p-4 bg-white border rounded-2xl transition-all hover:shadow-sm
            ${course.status === 'Locked' ? 'opacity-60 grayscale-[0.5]' : 'border-gray-100 shadow-sm'}`}
        >
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 
              ${course.status === 'Done' ? 'bg-green-50 border-green-500' : 'border-gray-100'}`}>
              {course.status === 'Done' ? '✅' : course.status === 'Locked' ? '🔒' : '🎯'}
            </div>
            <div>
              <h4 className="font-bold text-gray-900">{course.title}</h4>
              <p className="text-xs text-gray-500">{course.subtitle}</p>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter
            ${course.status === 'Done' ? 'bg-gray-100 text-gray-500' : 
              course.status === 'Active' ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-300'}`}>
            {course.status}
          </span>
        </div>
      ))}
    </div>
  );
}