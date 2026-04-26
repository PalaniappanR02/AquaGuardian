export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-slate-950 overflow-hidden">
      {children}
    </div>
  );
}
