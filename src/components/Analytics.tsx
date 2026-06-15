import { Task, FocusSession, QuickNote } from '../types';
import {
  Clock,
  Target,
  Flame,
  Brain,
  Zap,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';

interface AnalyticsProps {
  tasks: Task[];
  sessions: FocusSession[];
  notes: QuickNote[];
}

export default function Analytics({ tasks, sessions, notes }: AnalyticsProps) {
  const completedTasks = tasks.filter(t => t.status === 'done').length;
  const totalTasks = tasks.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const totalFocusMinutes = sessions.reduce((acc, s) => acc + s.duration, 0);
  const avgSessionLength = sessions.length > 0 ? Math.round(totalFocusMinutes / sessions.length) : 0;

  // Local-timezone date key (avoids UTC mismatch where sessions land on wrong day)
  const toDateKey = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };
  const startOfDay = (date: Date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  };
  const addDays = (date: Date, amount: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + amount);
    return d;
  };
  const isWithinRange = (value: Date, start: Date, end: Date) => value >= start && value < end;

  const today = startOfDay(new Date());
  const currentStart = addDays(today, -6);
  const nextDay = addDays(today, 1);
  const previousStart = addDays(currentStart, -7);

  const currentWeekSessions = sessions.filter((session) =>
    isWithinRange(new Date(session.completedAt), currentStart, nextDay),
  );
  const previousWeekSessions = sessions.filter((session) =>
    isWithinRange(new Date(session.completedAt), previousStart, currentStart),
  );
  const currentWeekMinutes = currentWeekSessions.reduce((acc, s) => acc + s.duration, 0);
  const previousWeekMinutes = previousWeekSessions.reduce((acc, s) => acc + s.duration, 0);
  const previousAvgSessionLength = previousWeekSessions.length > 0
    ? Math.round(previousWeekMinutes / previousWeekSessions.length)
    : 0;

  const formatSigned = (value: number, suffix = '') =>
    `${value >= 0 ? '+' : ''}${value}${suffix}`;

  // Category breakdown
  const categories = ['work', 'personal', 'health', 'learning', 'creative'] as const;
  const categoryData = categories.map(cat => ({
    name: cat,
    count: tasks.filter(t => t.category === cat).length,
    completed: tasks.filter(t => t.category === cat && t.status === 'done').length,
  }));
  const maxCatCount = Math.max(...categoryData.map(c => c.count), 1);

  // Priority breakdown
  const priorities = ['urgent', 'high', 'medium', 'low'] as const;
  const priorityData = priorities.map(p => ({
    name: p,
    count: tasks.filter(t => t.priority === p).length,
    done: tasks.filter(t => t.priority === p && t.status === 'done').length,
  }));

  // Live focus data for the last 7 days, including today.
  const weekData = Array.from({ length: 7 }, (_, index) => {
    const date = addDays(currentStart, index);
    const key = toDateKey(date);
    const daySessions = sessions.filter((session) => toDateKey(new Date(session.completedAt)) === key);
    return {
      key,
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      dateLabel: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      minutes: daySessions.reduce((acc, s) => acc + s.duration, 0),
      sessions: daySessions.length,
      isToday: key === toDateKey(today),
    };
  });
  const maxMinutes = Math.max(...weekData.map(d => d.minutes), 1);

  const focusTrendMinutes = currentWeekMinutes - previousWeekMinutes;
  const sessionTrend = currentWeekSessions.length - previousWeekSessions.length;
  const avgTrend = avgSessionLength - previousAvgSessionLength;

  // Productivity score (calculated)
  const productivityScore = Math.min(100, Math.round(
    (completionRate * 0.3) +
    (Math.min(totalFocusMinutes / 300, 1) * 40) +
    (notes.length > 0 ? 15 : 0) +
    (sessions.length > 5 ? 15 : sessions.length * 3)
  ));

  const scoreColor = productivityScore >= 80 ? 'text-emerald-600' : productivityScore >= 60 ? 'text-amber-600' : 'text-rose-600';

  const catColors: Record<string, string> = {
    work: 'from-blue-400 to-blue-600',
    personal: 'from-pink-400 to-pink-600',
    health: 'from-emerald-400 to-emerald-600',
    learning: 'from-amber-400 to-amber-600',
    creative: 'from-purple-400 to-purple-600',
  };

  const catEmojis: Record<string, string> = {
    work: '💼',
    personal: '🏠',
    health: '💪',
    learning: '📚',
    creative: '🎨',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Analytics 📊</h1>
        <p className="mt-1 text-sm text-slate-500">Insights into your productivity patterns</p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Target, label: 'Completion Rate', value: `${completionRate}%`, trend: `${completedTasks} done`, up: completionRate >= 50, gradient: 'from-violet-50 to-purple-50', iconBg: 'from-violet-500 to-purple-600', caption: 'overall' },
          { icon: Clock, label: 'Focus Time', value: `${Math.floor(totalFocusMinutes / 60)}h ${totalFocusMinutes % 60}m`, trend: formatSigned(focusTrendMinutes, 'm'), up: focusTrendMinutes >= 0, gradient: 'from-blue-50 to-indigo-50', iconBg: 'from-blue-500 to-indigo-600', caption: 'vs last 7 days' },
          { icon: Flame, label: 'Sessions', value: sessions.length.toString(), trend: formatSigned(sessionTrend), up: sessionTrend >= 0, gradient: 'from-amber-50 to-orange-50', iconBg: 'from-amber-500 to-orange-600', caption: 'vs last 7 days' },
          { icon: Zap, label: 'Avg Session', value: `${avgSessionLength}m`, trend: formatSigned(avgTrend, 'm'), up: avgTrend >= 0, gradient: 'from-emerald-50 to-teal-50', iconBg: 'from-emerald-500 to-teal-600', caption: 'vs last 7 days' },
        ].map((stat, i) => (
          <div key={i} className={`rounded-2xl ${stat.gradient} p-5 shadow-sm`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">{stat.label}</p>
                <p className="mt-1 text-2xl font-bold text-slate-800">{stat.value}</p>
                <div className="mt-1 flex items-center gap-1">
                  {stat.up ? (
                    <ArrowUp className="h-3 w-3 text-emerald-500" />
                  ) : (
                    <ArrowDown className="h-3 w-3 text-rose-500" />
                  )}
                  <span className={`text-[11px] font-medium ${stat.up ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {stat.trend}
                  </span>
                  <span className="text-[10px] text-slate-400">{stat.caption}</span>
                </div>
              </div>
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${stat.iconBg}`}>
                <stat.icon className="h-5 w-5 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Productivity Score */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <h2 className="text-base font-bold text-slate-800">Productivity Score</h2>
          <div className="mt-4 flex flex-col items-center">
            <div className="relative">
              <svg width="140" height="140" className="transform -rotate-90">
                <circle cx="70" cy="70" r="58" stroke="currentColor" strokeWidth="12" fill="none" className="text-slate-100" />
                <circle
                  cx="70" cy="70" r="58"
                  stroke="url(#scoreGradient)" strokeWidth="12" fill="none"
                  strokeDasharray={2 * Math.PI * 58}
                  strokeDashoffset={2 * Math.PI * 58 * (1 - productivityScore / 100)}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
                <defs>
                  <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#6366f1" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-3xl font-bold ${scoreColor}`}>{productivityScore}</span>
                <span className="text-[10px] text-slate-400">out of 100</span>
              </div>
            </div>
            <p className="mt-3 text-center text-xs text-slate-500">
              {productivityScore >= 80 ? '🎉 Excellent! Keep up the great work!' :
               productivityScore >= 60 ? '👍 Good progress! Room to grow.' :
               '💪 Let\'s boost your productivity!'}
            </p>
          </div>
        </div>

        {/* Weekly Focus Chart */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-800">Weekly Focus Trend</h2>
            <span className="text-xs text-slate-400">Last 7 days</span>
          </div>
          <div className="mt-5 overflow-x-auto pb-1">
            <div className="grid min-w-[560px] grid-cols-7 gap-3">
              {weekData.map((day) => {
                const barHeight = day.minutes > 0
                  ? Math.max(12, (day.minutes / maxMinutes) * 144)
                  : 6;

                return (
                  <div key={day.key} className="flex min-w-0 flex-col items-center">
                    <div className="mb-2 h-5 text-center">
                      <span className="text-[11px] font-semibold text-slate-500">
                        {day.minutes > 0 ? `${day.minutes}m` : '0m'}
                      </span>
                    </div>
                    <div className={`relative flex h-36 w-full items-end overflow-hidden rounded-xl ${day.isToday ? 'bg-violet-50 ring-1 ring-violet-100' : 'bg-slate-50'}`}>
                      <div
                        className={`w-full rounded-xl transition-all duration-700 ${
                          day.minutes > 0
                            ? 'bg-gradient-to-t from-violet-500 to-indigo-400'
                            : 'bg-slate-200'
                        }`}
                        style={{ height: `${barHeight}px` }}
                      />
                    </div>
                    <span className={`mt-2 text-xs font-semibold ${day.isToday ? 'text-violet-700' : 'text-slate-600'}`}>
                      {day.day}
                    </span>
                    <span className="text-[10px] text-slate-400">{day.dateLabel}</span>
                    <span className="mt-1 text-[10px] text-slate-400">
                      {day.sessions} {day.sessions === 1 ? 'session' : 'sessions'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="mt-4 rounded-xl bg-violet-50 px-4 py-3">
            <p className="text-xs text-slate-600">
              <span className="font-semibold text-violet-700">Live data:</span> this chart updates when you complete or skip focus sessions from the Focus Timer.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Category Breakdown */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <h2 className="text-base font-bold text-slate-800">Tasks by Category</h2>
          <div className="mt-4 space-y-3">
            {categoryData.map(cat => (
              <div key={cat.name} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>{catEmojis[cat.name]}</span>
                    <span className="text-sm font-medium text-slate-700 capitalize">{cat.name}</span>
                  </div>
                  <span className="text-xs text-slate-500">{cat.completed}/{cat.count} done</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${catColors[cat.name]} transition-all duration-1000 ease-out`}
                    style={{ width: `${cat.count > 0 ? (cat.count / maxCatCount) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Priority Distribution */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <h2 className="text-base font-bold text-slate-800">Priority Distribution</h2>
          <div className="mt-4 space-y-3">
            {priorityData.map(p => {
              const colors: Record<string, { bg: string; fill: string; emoji: string }> = {
                urgent: { bg: 'bg-rose-50', fill: 'bg-rose-500', emoji: '🔴' },
                high: { bg: 'bg-amber-50', fill: 'bg-amber-500', emoji: '🟠' },
                medium: { bg: 'bg-blue-50', fill: 'bg-blue-500', emoji: '🔵' },
                low: { bg: 'bg-slate-50', fill: 'bg-slate-400', emoji: '⚪' },
              };
              const config = colors[p.name];
              return (
                <div key={p.name} className={`flex items-center justify-between rounded-xl ${config.bg} p-3`}>
                  <div className="flex items-center gap-2">
                    <span>{config.emoji}</span>
                    <span className="text-sm font-medium text-slate-700 capitalize">{p.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-1">
                      {Array.from({ length: p.count }).map((_, i) => (
                        <div key={i} className={`h-4 w-4 rounded-full border-2 border-white ${config.fill}`} />
                      ))}
                    </div>
                    <span className="text-sm font-bold text-slate-700">{p.count}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Task Status */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <h2 className="text-base font-bold text-slate-800">Task Status</h2>
          <div className="mt-4 space-y-3">
            {[
              { status: 'To Do', count: tasks.filter(t => t.status === 'todo').length, color: 'bg-slate-200', emoji: '📋' },
              { status: 'In Progress', count: tasks.filter(t => t.status === 'in-progress').length, color: 'bg-amber-400', emoji: '⚡' },
              { status: 'Completed', count: completedTasks, color: 'bg-emerald-400', emoji: '✅' },
            ].map(item => (
              <div key={item.status} className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                <div className="flex items-center gap-2">
                  <span>{item.emoji}</span>
                  <span className="text-sm text-slate-600">{item.status}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`h-3 w-3 rounded-full ${item.color}`} />
                  <span className="text-sm font-bold text-slate-800">{item.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Insights */}
        <div className="rounded-2xl bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-100 p-5 lg:col-span-2">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-violet-500" />
            <h2 className="text-base font-bold text-violet-700">AI Productivity Insights</h2>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              { title: 'Peak Hours', desc: 'You\'re most productive between 9-11 AM. Schedule deep work then.', icon: '⏰' },
              { title: 'Focus Pattern', desc: `Your average session is ${avgSessionLength}min. Try extending to ${avgSessionLength + 10}min.`, icon: '🎯' },
              { title: 'Task Batching', desc: `Group your ${tasks.filter(t => t.estimatedMinutes <= 15).length} quick tasks together for efficiency.`, icon: '📦' },
              { title: 'Streak Status', desc: 'Maintain your 5-day streak! Consistency builds momentum.', icon: '🔥' },
            ].map((insight, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl bg-white/60 p-3 backdrop-blur-sm">
                <span className="text-xl">{insight.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-slate-700">{insight.title}</p>
                  <p className="mt-0.5 text-xs text-slate-500 leading-relaxed">{insight.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
