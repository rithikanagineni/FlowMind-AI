import { Page } from '../types';
import {
  LayoutDashboard,
  CheckSquare,
  Timer,
  Lightbulb,
  BarChart3,
  Zap,
  CalendarDays,
  Bot,
  CalendarClock,
} from 'lucide-react';

const navItems: { page: Page; label: string; icon: typeof LayoutDashboard }[] = [
  { page: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { page: 'planner', label: 'AI Daily Planner', icon: CalendarClock },
  { page: 'calendar', label: 'My Calendar', icon: CalendarDays },
  { page: 'tasks', label: 'Smart Tasks', icon: CheckSquare },
  { page: 'assistant', label: 'AI Assistant', icon: Bot },
  { page: 'focus', label: 'Focus Timer', icon: Timer },
  { page: 'capture', label: 'Quick Capture', icon: Lightbulb },
  { page: 'analytics', label: 'Insights', icon: BarChart3 },
];

interface SidebarProps {
  activePage: Page;
  onPageChange: (page: Page) => void;
}

export default function Sidebar({ activePage, onPageChange }: SidebarProps) {
  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-[220px] flex-col border-r border-violet-100 bg-white/80 backdrop-blur-xl">
      {/* Logo */}
      <div className="flex items-center gap-2.5 border-b border-violet-100 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-md shadow-violet-200">
          <Zap className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-base font-bold tracking-tight text-slate-800">FlowMind</h1>
          <p className="text-[10px] font-medium text-violet-500">AI Productivity OS</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map(({ page, label, icon: Icon }) => {
          const isActive = activePage === page;
          return (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-violet-500 to-indigo-500 text-white shadow-md shadow-violet-200'
                  : 'text-slate-600 hover:bg-violet-50 hover:text-violet-700'
              }`}
            >
              <Icon className={`h-[18px] w-[18px] ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-violet-500'}`} />
              {label}
            </button>
          );
        })}
      </nav>

      {/* Bottom CTA */}
      <div className="mx-3 mb-4 rounded-xl bg-gradient-to-br from-violet-50 to-indigo-50 p-3">
        <p className="text-xs font-semibold text-violet-700">⚡ FlowMind OS</p>
        <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
          AI-powered productivity operating system
        </p>
      </div>
    </aside>
  );
}
