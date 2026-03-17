export function ProgressHeader({ percent }: { percent: number }) {
  return (
    <div className="mb-8">
      <div className="flex justify-between items-end mb-3">
        <div>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Current path</p>
          <h2 className="text-3xl font-black text-gray-900">Machine Learning Engineer</h2>
        </div>
        <span className="text-2xl font-black text-gray-900">{percent}%</span>
      </div>
      <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
        <div 
          className="bg-gray-900 h-full transition-all duration-1000 ease-out" 
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}