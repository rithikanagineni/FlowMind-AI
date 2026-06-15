import { Task, FocusSession } from '../types';
import { localDateString } from '../utils/dates';
import {
  Clock,
  Flame,
  Target,
  Zap,
  Sparkles,
  Brain,
  ListTodo,
  Timer,
} from 'lucide-react';

interface DashboardProps {
  tasks: Task[];
  sessions: FocusSession[];
  onNavigate: (page: string) => void;
  burnoutScore: number;
}

function StatCard({ icon: Icon, label, value, sub, gradient, iconBg }: {
  icon: typeof Target; label: string; value: string | number; sub: string;
  gradient: string; iconBg: string;
}) {
  return (
    <div className={`rounded-2xl ${gradient} p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-bold text-slate-800">{value}</p>
          <p className="mt-0.5 text-[11px] text-slate-400">{sub}</p>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconBg}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard({ tasks, sessions, onNavigate, burnoutScore }: DashboardProps) {
  const today = localDateString();
  const completedTasks = tasks.filter(t => t.status === 'done').length;
  const totalTasks = tasks.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  // Calculate today's focus time only
  const todaySessions = sessions.filter(s => s.completedAt.startsWith(today));
  const todayFocusMinutes = todaySessions.reduce((acc, s) => acc + s.duration, 0);
  const focusHours = Math.floor(todayFocusMinutes / 60);
  const focusMinutes = todayFocusMinutes % 60;
  
  const urgentTasks = tasks.filter(t => t.priority === 'urgent' && t.status !== 'done').length;
  const aiTasks = tasks.filter(t => t.aiSuggested).length;
  const todoCount = tasks.filter(t => t.status === 'todo').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Good Morning! ☀️
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Your AI-powered productivity overview
          </p>
        </div>
        <button
          onClick={() => onNavigate('assistant')}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-violet-200 transition-all hover:shadow-lg hover:-translate-y-0.5"
        >
          <Sparkles className="h-4 w-4" />
          AI Smart Planner
        </button>
      </div>

      {/* Burnout Detection Banner */}
      {burnoutScore >= 60 && (
        <div className={`relative overflow-hidden rounded-2xl border p-5 ${burnoutScore >= 70 ? 'border-rose-200 bg-gradient-to-r from-rose-50 to-pink-50' : 'border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50'}`}>
          <div className="relative z-10 flex items-start gap-4">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${burnoutScore >= 70 ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
              <Brain className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-slate-800">
                {burnoutScore >= 70 ? '⚠️ Burnout Risk Detected' : '💡 Wellness Reminder'}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {burnoutScore >= 70
                  ? `You have ${urgentTasks} urgent tasks and ${todoCount} pending. Consider using the AI Planner to redistribute your workload.`
                  : 'Your productivity is solid. Remember to take breaks between deep work sessions.'}
              </p>
              <button
                onClick={() => onNavigate('assistant')}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-violet-700 shadow-sm hover:bg-violet-50"
              >
                <Sparkles className="h-3.5 w-3.5" /> Let AI optimize my day
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Target}
          label="Tasks Completed"
          value={`${completedTasks}/${totalTasks}`}
          sub={`${completionRate}% completion rate`}
          gradient="bg-gradient-to-br from-violet-50 to-purple-50"
          iconBg="bg-gradient-to-br from-violet-500 to-purple-600"
        />
        <StatCard
          icon={Clock}
          label="Focus Time Today"
          value={`${focusHours}h ${focusMinutes}m`}
          sub="Total deep work sessions"
          gradient="bg-gradient-to-br from-blue-50 to-indigo-50"
          iconBg="bg-gradient-to-br from-blue-500 to-indigo-600"
        />
        <StatCard
          icon={Flame}
          label="Urgent Tasks"
          value={urgentTasks}
          sub="Need immediate attention"
          gradient="bg-gradient-to-br from-amber-50 to-orange-50"
          iconBg="bg-gradient-to-br from-amber-500 to-orange-600"
        />
        <StatCard
          icon={Brain}
          label="AI Suggestions"
          value={aiTasks}
          sub="Smart recommendations"
          gradient="bg-gradient-to-br from-emerald-50 to-teal-50"
          iconBg="bg-gradient-to-br from-emerald-500 to-teal-600"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { icon: Sparkles, label: 'AI Smart Planner', page: 'assistant', gradient: 'from-violet-500 to-purple-600', desc: 'Generate your day plan' },
          { icon: Timer, label: 'Start Focus', page: 'focus', gradient: 'from-blue-500 to-indigo-600', desc: 'Deep work session' },
          { icon: ListTodo, label: 'Smart Tasks', page: 'tasks', gradient: 'from-amber-500 to-orange-600', desc: 'Manage & break down' },
          { icon: Zap, label: 'Quick Capture', page: 'capture', gradient: 'from-emerald-500 to-teal-600', desc: 'Capture ideas fast' },
        ].map(action => (
          <button
            key={action.label}
            onClick={() => onNavigate(action.page)}
            className={`flex flex-col items-start gap-3 rounded-2xl bg-gradient-to-br ${action.gradient} p-5 text-white shadow-sm transition-all hover:shadow-lg hover:-translate-y-0.5`}
          >
            <action.icon className="h-6 w-6" />
            <div className="text-left">
              <span className="text-sm font-bold">{action.label}</span>
              <p className="mt-0.5 text-xs opacity-80">{action.desc}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Upcoming Tasks */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-800">Today's Priority Tasks</h2>
          <button onClick={() => onNavigate('tasks')} className="text-xs font-semibold text-violet-600 hover:text-violet-700">
            View All →
          </button>
        </div>
        <div className="mt-3 space-y-2">
          {tasks.filter(t => t.status !== 'done').slice(0, 5).map(task => (
            <div key={task.id} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 transition-colors hover:bg-slate-50">
              <div className={`h-2 w-2 rounded-full ${
                task.priority === 'urgent' ? 'bg-rose-500' :
                task.priority === 'high' ? 'bg-amber-500' :
                task.priority === 'medium' ? 'bg-blue-500' : 'bg-slate-300'
              }`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700 truncate">{task.title}</p>
                <p className="text-[11px] text-slate-400">{task.estimatedMinutes} min · {task.category}</p>
              </div>
              {task.aiSuggested && <Sparkles className="h-3.5 w-3.5 text-violet-400" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
