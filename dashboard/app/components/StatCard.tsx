export default function StatCard({ title, value, danger }: { title: string, value: string | number, danger?: boolean }) {
  return (
    <div className={`bg-[#0f172a] p-3 rounded-xl border ${danger ? 'border-red-500 bg-red-950/20 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : 'border-gray-800'} flex justify-between items-center transition-all duration-300`}>
      <span className="text-gray-400 text-sm">{title}</span>
      <span className={`text-base font-bold ${danger ? 'text-red-500 glow-red' : 'text-white'}`}>{value}</span>
    </div>
  )
}
