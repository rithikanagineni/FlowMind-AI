import { CalendarSlot } from '../types';
import {
  Calendar,
  Trash2,
  Sparkles,
  Zap,
  Sun,
  Moon,
} from 'lucide-react';

interface CalendarViewProps {
  slots: CalendarSlot[];
  onClear: () => void;
  onNavigateToPlanner: () => void;
}

export default function CalendarView({ slots, onClear, onNavigateToPlanner }: CalendarViewProps) {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  // Convert "2:00 PM" style time to minutes since midnight for correct grouping
  const timeToMinutes = (time: string): number => {
    const match = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!match) return 0;
    let hours = parseInt(match[1], 10);
    const mins = parseInt(match[2], 10);
    const isPM = match[3].toUpperCase() === 'PM';
    if (isPM && hours !== 12) hours += 12;
    if (!isPM && hours === 12) hours = 0;
    return hours * 60 + mins;
  };

  // Sort all slots chronologically, then group by time period
  const sortedSlots = [...slots].sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));
  const morningSlots = sortedSlots.filter(s => timeToMinutes(s.time) < 12 * 60);
  const afternoonSlots = sortedSlots.filter(s => {
    const m = timeToMinutes(s.time);
    return m >= 12 * 60 && m < 17 * 60;
  });
  const eveningSlots = sortedSlots.filter(s => timeToMinutes(s.time) >= 17 * 60);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">📅 My Calendar</h1>
          <p className="mt-1 text-sm text-slate-500">{today}</p>
        </div>
        <div className="flex items-center gap-2">
          {slots.length > 0 && (
            <button
              onClick={onClear}
              className="inline-flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-100 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Clear Calendar
            </button>
          )}
          <button
            onClick={onNavigateToPlanner}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-violet-200 transition-all hover:shadow-lg hover:-translate-y-0.5"
          >
            <Sparkles className="h-4 w-4" />
            Generate Plan
          </button>
        </div>
      </div>

      {/* Calendar Content */}
      {slots.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-16">
          <Calendar className="h-14 w-14 text-slate-200" />
          <p className="mt-4 text-base font-semibold text-slate-500">No plans yet</p>
          <p className="mt-1 text-sm text-slate-400">
            Go to the AI Planner, generate your daily plan, and click "Apply to Calendar"
          </p>
          <button
            onClick={onNavigateToPlanner}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-violet-200 transition-all hover:shadow-lg hover:-translate-y-0.5"
          >
            <Sparkles className="h-4 w-4" />
            Open AI Smart Planner
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Morning */}
          {morningSlots.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Sun className="h-5 w-5 text-amber-500" />
                <h2 className="text-base font-bold text-slate-700">Morning</h2>
                <span className="text-xs text-slate-400">6 AM – 12 PM</span>
              </div>
              <div className="space-y-2">
                {morningSlots.map((slot) => (
                  <div key={slot.id} className={`rounded-xl border p-4 ${slot.color} shadow-sm hover:shadow-md transition-all`}>
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-lg shadow-sm">
                        {slot.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-slate-700 truncate">{slot.label}</p>
                          <span className="text-[10px] font-medium text-slate-400">{slot.time}</span>
                        </div>
                        {slot.description && (
                          <p className="mt-0.5 text-xs text-slate-500">{slot.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Afternoon */}
          {afternoonSlots.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Zap className="h-5 w-5 text-blue-500" />
                <h2 className="text-base font-bold text-slate-700">Afternoon</h2>
                <span className="text-xs text-slate-400">12 PM – 5 PM</span>
              </div>
              <div className="space-y-2">
                {afternoonSlots.map((slot) => (
                  <div key={slot.id} className={`rounded-xl border p-4 ${slot.color} shadow-sm hover:shadow-md transition-all`}>
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-lg shadow-sm">
                        {slot.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-slate-700 truncate">{slot.label}</p>
                          <span className="text-[10px] font-medium text-slate-400">{slot.time}</span>
                        </div>
                        {slot.description && (
                          <p className="mt-0.5 text-xs text-slate-500">{slot.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Evening */}
          {eveningSlots.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Moon className="h-5 w-5 text-indigo-500" />
                <h2 className="text-base font-bold text-slate-700">Evening</h2>
                <span className="text-xs text-slate-400">5 PM onwards</span>
              </div>
              <div className="space-y-2">
                {eveningSlots.map((slot) => (
                  <div key={slot.id} className={`rounded-xl border p-4 ${slot.color} shadow-sm hover:shadow-md transition-all`}>
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-lg shadow-sm">
                        {slot.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-slate-700 truncate">{slot.label}</p>
                          <span className="text-[10px] font-medium text-slate-400">{slot.time}</span>
                        </div>
                        {slot.description && (
                          <p className="mt-0.5 text-xs text-slate-500">{slot.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
