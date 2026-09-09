export default function ManageLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <div className="bg-[#0d0d0d] border-b border-white/10">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center gap-6 text-xs text-white/50">
          <span className="text-white/30 font-medium">Manage</span>
          <a href="/manage" className="hover:text-white transition-colors">Dashboard</a>
          <a href="/manage/newsletters" className="hover:text-white transition-colors">Newsletters</a>
          <a href="/manage/subscribers" className="hover:text-white transition-colors">Subscribers</a>
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-6 py-10">{children}</div>
    </div>
  )
}
