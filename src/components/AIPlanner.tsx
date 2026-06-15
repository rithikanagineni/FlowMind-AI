import { useState, useRef } from 'react';
import { Task, CalendarSlot } from '../types';
import {
  Sparkles,
  Calendar,
  Sun,
  Moon,
  Plus,
  CheckCircle2,
  Lightbulb,
  Loader2,
} from 'lucide-react';

interface AIPlannerProps {
  tasks: Task[];
  onAddTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  onApplyToCalendar: (slots: Omit<CalendarSlot, 'id'>[]) => void;
  onNavigate: (page: string) => void;
  onToast: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
  onAddNotification: (title: string, description: string, tone: 'violet' | 'emerald' | 'amber') => void;
}

interface PlanSlot {
  time: string;
  label: string;
  description: string;
  icon: string;
  color: string;
  minutesOfDay: number;
}

// Convert "2:00 PM" style time to minutes since midnight
export function timeToMinutes(time: string): number {
  const match = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return 0;
  let hours = parseInt(match[1], 10);
  const mins = parseInt(match[2], 10);
  const isPM = match[3].toUpperCase() === 'PM';
  if (isPM && hours !== 12) hours += 12;
  if (!isPM && hours === 12) hours = 0;
  return hours * 60 + mins;
}

function minutesToTime(totalMins: number): string {
  let hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  const period = hours >= 12 ? 'PM' : 'AM';
  if (hours > 12) hours -= 12;
  if (hours === 0) hours = 12;
  return `${hours}:${String(mins).padStart(2, '0')} ${period}`;
}

interface ParsedActivity {
  title: string;
  icon: string;
  duration: number; // minutes
  priority: 'urgent' | 'high' | 'medium' | 'low';
  category: string;
  fixedTime?: number;      // exact minutes-of-day if user said "at 2pm"
  preferredPeriod?: 'morning' | 'afternoon' | 'evening' | 'night';
}

// Vocabulary of recognizable activities
const ACTIVITY_PATTERNS: { keywords: string[]; make: () => Omit<ParsedActivity, 'fixedTime' | 'preferredPeriod'> }[] = [
  { keywords: ['grandmother', 'grandma', 'grandparents'], make: () => ({ title: "Visit Grandma's house", icon: '👵', duration: 120, priority: 'high', category: 'personal' }) },
  { keywords: ['family function', 'function', 'wedding', 'ceremony', 'celebration', 'party'], make: () => ({ title: 'Family function', icon: '🎉', duration: 180, priority: 'high', category: 'personal' }) },
  { keywords: ['house chores', 'chores', 'cleaning', 'laundry', 'housework'], make: () => ({ title: 'House chores', icon: '🧹', duration: 90, priority: 'medium', category: 'personal' }) },
  { keywords: ['office work', 'office', 'work from home', 'wfh', 'work tasks'], make: () => ({ title: 'Office work', icon: '💼', duration: 180, priority: 'high', category: 'work' }) },
  { keywords: ['swimming', 'swim'], make: () => ({ title: 'Swimming', icon: '🏊', duration: 60, priority: 'medium', category: 'health' }) },
  { keywords: ['husband', 'wife', 'partner', 'spouse', 'spending time with', 'quality time', 'family time'], make: () => ({ title: 'Quality time together', icon: '💑', duration: 90, priority: 'high', category: 'personal' }) },
  { keywords: ['meeting', 'meetings', 'call', 'standup'], make: () => ({ title: 'Meeting', icon: '👥', duration: 60, priority: 'high', category: 'work' }) },
  { keywords: ['gym', 'workout', 'exercise'], make: () => ({ title: 'Gym / Workout', icon: '💪', duration: 60, priority: 'medium', category: 'health' }) },
  { keywords: ['study', 'exam', 'assignment', 'homework'], make: () => ({ title: 'Study & Assignments', icon: '📚', duration: 120, priority: 'urgent', category: 'learning' }) },
  { keywords: ['cooking', 'cook', 'meal prep'], make: () => ({ title: 'Cooking', icon: '🍳', duration: 60, priority: 'medium', category: 'personal' }) },
  { keywords: ['shopping', 'groceries', 'grocery'], make: () => ({ title: 'Shopping & groceries', icon: '🛒', duration: 60, priority: 'medium', category: 'personal' }) },
  { keywords: ['doctor', 'dentist', 'appointment', 'checkup'], make: () => ({ title: 'Appointment', icon: '🩺', duration: 60, priority: 'high', category: 'personal' }) },
  { keywords: ['temple', 'church', 'prayer', 'mosque'], make: () => ({ title: 'Prayer / Worship', icon: '🙏', duration: 45, priority: 'medium', category: 'personal' }) },
  { keywords: ['email', 'emails'], make: () => ({ title: 'Emails & communication', icon: '📧', duration: 30, priority: 'medium', category: 'work' }) },
  { keywords: ['report', 'writing', 'write'], make: () => ({ title: 'Writing / Report', icon: '📝', duration: 60, priority: 'high', category: 'work' }) },
  { keywords: ['code review', 'coding', 'programming', 'develop'], make: () => ({ title: 'Coding / Review', icon: '💻', duration: 90, priority: 'high', category: 'work' }) },
  { keywords: ['learn', 'course', 'framework', 'tutorial'], make: () => ({ title: 'Learning session', icon: '📖', duration: 60, priority: 'medium', category: 'learning' }) },
  { keywords: ['errand', 'errands'], make: () => ({ title: 'Personal errands', icon: '🚗', duration: 45, priority: 'low', category: 'personal' }) },
  { keywords: ['project', 'deadline'], make: () => ({ title: 'Project work', icon: '🎯', duration: 120, priority: 'urgent', category: 'work' }) },
  { keywords: ['walk', 'jog', 'jogging', 'running'], make: () => ({ title: 'Walk / Run', icon: '🏃', duration: 45, priority: 'medium', category: 'health' }) },
  { keywords: ['reading', 'read a book'], make: () => ({ title: 'Reading', icon: '📖', duration: 45, priority: 'low', category: 'personal' }) },
  { keywords: ['movie', 'film'], make: () => ({ title: 'Movie time', icon: '🎬', duration: 120, priority: 'low', category: 'personal' }) },
  { keywords: ['kids', 'children', 'son', 'daughter'], make: () => ({ title: 'Time with kids', icon: '👶', duration: 90, priority: 'high', category: 'personal' }) },
  { keywords: ['yoga', 'meditation', 'meditate'], make: () => ({ title: 'Yoga / Meditation', icon: '🧘', duration: 45, priority: 'medium', category: 'health' }) },
  { keywords: ['reunite', 'friends', 'friend', 'fiends', 'hangout', 'hang out', 'catch up'], make: () => ({ title: 'Meet friends', icon: '👯', duration: 90, priority: 'medium', category: 'personal' }) },
  { keywords: ['play', 'games', 'cricket', 'football', 'badminton', 'basketball', 'sports'], make: () => ({ title: 'Play / Sports', icon: '⚽', duration: 60, priority: 'medium', category: 'health' }) },
  { keywords: ['music', 'guitar', 'piano', 'singing'], make: () => ({ title: 'Music practice', icon: '🎵', duration: 45, priority: 'low', category: 'personal' }) },
  { keywords: ['travel', 'trip', 'drive'], make: () => ({ title: 'Travel', icon: '🚗', duration: 90, priority: 'medium', category: 'personal' }) },
];

// Detect time-of-day words near the activity ("chores in the morning")
function extractPeriod(segment: string): ParsedActivity['preferredPeriod'] {
  if (/morning/i.test(segment)) return 'morning';
  if (/afternoon/i.test(segment)) return 'afternoon';
  if (/evening/i.test(segment)) return 'evening';
  if (/night/i.test(segment)) return 'night';
  return undefined;
}

// Extract an explicit time like "at 2pm" / "2:30 pm" / "by 9" from a text segment.
// Resolves conflicts: "morning ... by 9pm" → the word "morning" wins, time becomes 9 AM.
function extractExplicitTime(segment: string, period?: ParsedActivity['preferredPeriod']): number | undefined {
  const match = segment.match(/(?:at|by)?\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  // Require either an am/pm marker or an "at/by" prefix to treat a number as a time
  const hasMeridiem = match && match[3];
  const hasPrefix = match && /(?:at|by)\s*\d/i.test(segment);
  if (!match || (!hasMeridiem && !hasPrefix)) return undefined;

  let hours = parseInt(match[1], 10);
  if (isNaN(hours) || hours < 1 || hours > 12) return undefined;
  const mins = match[2] ? parseInt(match[2], 10) : 0;

  let isPM: boolean;
  if (hasMeridiem) {
    isPM = match[3]!.toLowerCase() === 'pm';
    // CONFLICT RESOLUTION: explicit period word overrides a likely-typo meridiem
    if (period === 'morning' && isPM) isPM = false;          // "morning ... 9pm" → 9 AM
    if ((period === 'evening' || period === 'night') && !isPM && hours !== 12) isPM = true; // "evening ... 7am" → 7 PM
  } else {
    // No am/pm given — infer from period word, else from common sense
    if (period === 'morning') isPM = false;
    else if (period === 'afternoon' || period === 'evening' || period === 'night') isPM = hours !== 12 ? true : true;
    else isPM = hours >= 1 && hours <= 6; // bare "at 2" → 2 PM; "at 9" → 9 AM
  }

  if (isPM && hours !== 12) hours += 12;
  if (!isPM && hours === 12) hours = 0;
  return hours * 60 + mins;
}

const PERIOD_WINDOWS: Record<NonNullable<ParsedActivity['preferredPeriod']>, [number, number]> = {
  morning: [7 * 60, 12 * 60],       // 7 AM – 12 PM
  afternoon: [12 * 60 + 60, 17 * 60], // 1 PM – 5 PM
  evening: [17 * 60, 21 * 60],      // 5 PM – 9 PM
  night: [20 * 60, 22 * 60],        // 8 PM – 10 PM
};

function generateDailyPlan(userInput: string): { summary: string; slots: PlanSlot[] } {
  const lowerInput = userInput.toLowerCase();

  // Split into segments so each activity picks up its own time qualifiers
  const segments = lowerInput.split(/,| and | then |\. |;/).map(s => s.trim()).filter(Boolean);

  // 1. Parse activities from each segment (de-duplicated)
  const activities: ParsedActivity[] = [];
  const usedTitles = new Set<string>();

  for (const segment of segments) {
    for (const pattern of ACTIVITY_PATTERNS) {
      if (pattern.keywords.some(k => segment.includes(k))) {
        const base = pattern.make();
        if (usedTitles.has(base.title)) continue;
        usedTitles.add(base.title);
        const period = extractPeriod(segment);
        activities.push({
          ...base,
          fixedTime: extractExplicitTime(segment, period),
          preferredPeriod: period,
        });
        break; // one activity per segment match
      }
    }
  }

  // Also scan whole input for any patterns missed by segmentation
  for (const pattern of ACTIVITY_PATTERNS) {
    if (pattern.keywords.some(k => lowerInput.includes(k))) {
      const base = pattern.make();
      if (!usedTitles.has(base.title)) {
        usedTitles.add(base.title);
        activities.push({ ...base });
      }
    }
  }

  // Fallback if nothing matched
  if (activities.length === 0 && lowerInput.length > 5) {
    activities.push({ title: 'Planned activities', icon: '📋', duration: 120, priority: 'medium', category: 'personal' });
  }

  // 2. Schedule: fixed-time activities first, then fill flexible ones
  const busy: [number, number][] = [];
  const LUNCH: [number, number] = [12 * 60 + 30, 13 * 60 + 15]; // 12:30–1:15 PM
  busy.push(LUNCH);

  const overlaps = (start: number, end: number) =>
    busy.some(([bs, be]) => start < be && end > bs);

  const reserve = (start: number, end: number) => {
    busy.push([start, end]);
  };

  const scheduled: (ParsedActivity & { start: number })[] = [];

  // Place fixed-time activities first
  for (const act of activities.filter(a => a.fixedTime !== undefined)) {
    const start = act.fixedTime!;
    reserve(start, start + act.duration);
    scheduled.push({ ...act, start });
  }

  // Place flexible activities — respect preferred period, else fill from 7:30 AM
  const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
  const flexible = activities
    .filter(a => a.fixedTime === undefined)
    .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  for (const act of flexible) {
    const [windowStart, windowEnd] = act.preferredPeriod
      ? PERIOD_WINDOWS[act.preferredPeriod]
      : [7 * 60 + 30, 21 * 60]; // default: 7:30 AM – 9 PM

    let placed = false;
    for (let start = windowStart; start + act.duration <= windowEnd; start += 15) {
      if (!overlaps(start, start + act.duration)) {
        reserve(start, start + act.duration);
        scheduled.push({ ...act, start });
        placed = true;
        break;
      }
    }
    // If the preferred window was full, place anywhere free in the day
    if (!placed) {
      for (let start = 7 * 60; start + act.duration <= 21 * 60 + 30; start += 15) {
        if (!overlaps(start, start + act.duration)) {
          reserve(start, start + act.duration);
          scheduled.push({ ...act, start });
          break;
        }
      }
    }
  }

  // 3. Build display slots
  const priorityColors: Record<string, string> = {
    urgent: 'bg-rose-50 border-rose-200',
    high: 'bg-amber-50 border-amber-200',
    medium: 'bg-blue-50 border-blue-200',
    low: 'bg-slate-50 border-slate-200',
  };

  const slots: PlanSlot[] = [
    { time: '6:30 AM', label: 'Morning Routine & Planning', description: 'Start fresh, review your day', icon: '🌅', color: 'bg-amber-50 border-amber-200', minutesOfDay: 6 * 60 + 30 },
    { time: '12:30 PM', label: 'Lunch Break', description: 'Eat and recharge', icon: '🍽️', color: 'bg-emerald-50 border-emerald-200', minutesOfDay: 12 * 60 + 30 },
  ];

  let totalMins = 0;
  for (const act of scheduled) {
    totalMins += act.duration;
    slots.push({
      time: minutesToTime(act.start),
      label: act.title,
      description: `${act.duration} min · ${act.priority} priority · ${act.category}`,
      icon: act.icon,
      color: priorityColors[act.priority],
      minutesOfDay: act.start,
    });
  }

  // Wind down after the last activity (cap at 10 PM)
  const lastEnd = Math.max(...scheduled.map(a => a.start + a.duration), 18 * 60);
  const windDownStart = Math.min(lastEnd + 30, 22 * 60);
  slots.push({
    time: minutesToTime(windDownStart),
    label: 'Wind Down',
    description: 'Relax and prepare for tomorrow',
    icon: '🌙',
    color: 'bg-slate-50 border-slate-200',
    minutesOfDay: windDownStart,
  });

  // 4. Sort numerically by time of day — correct AM/PM order
  slots.sort((a, b) => a.minutesOfDay - b.minutesOfDay);

  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;

  return {
    summary: `${scheduled.length} planned activities · ${hours}h ${mins}m scheduled`,
    slots,
  };
}

export default function AIPlanner({ tasks, onAddTask, onApplyToCalendar, onNavigate, onToast, onAddNotification }: AIPlannerProps) {
  const [userInput, setUserInput] = useState('');
  const [plan, setPlan] = useState<{ summary: string; slots: PlanSlot[] } | null>(null);
  const [applied, setApplied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const planRef = useRef<HTMLDivElement | null>(null);

  const tryExamples = [
    'Family function in the evening, house chores in the morning, office work, swim and time with my husband',
    'I have 2 assignments, gym in the morning, and exam prep',
    'Meeting at 2pm, code review, emails and evening walk',
    'Visit grandma, shopping, cooking and movie night',
  ];

  const handleGenerate = () => {
    if (!userInput.trim()) {
      onToast('warning', 'Please describe your tasks first');
      return;
    }
    setIsGenerating(true);
    onToast('info', 'AI is generating your plan...');
    // Simulate AI processing with 2-second delay
    setTimeout(() => {
      const result = generateDailyPlan(userInput);
      setPlan(result);
      setApplied(false);
      setIsGenerating(false);
      onToast('success', 'Your optimized day plan is ready! 🎯');
      onAddNotification('AI plan generated', `Created a schedule with ${result.slots.length} time slots based on your input.`, 'violet');
      // Smooth scroll to the plan area
      setTimeout(() => {
        planRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }, 2000);
  };

  const useExample = (example: string) => {
    setUserInput(example);
    onToast('info', 'Example loaded. Click Generate Plan to create your schedule.');
  };

  const applyToCalendar = () => {
    if (!plan) return;
    const today = new Date().toISOString().split('T')[0];
    const calendarSlots = plan.slots.map(s => ({ ...s, date: today }));
    onApplyToCalendar(calendarSlots);
    setApplied(true);
    onToast('success', 'Plan applied to your calendar! 📅');
    onAddNotification('Plan applied to calendar', 'Your AI-generated schedule is now in My Calendar.', 'emerald');
  };

  const generateFromPlan = () => {
    if (!plan) return;
    const active = tasks.filter(t => t.status !== 'done');
    let created = 0;

    plan.slots.forEach(slot => {
      if (!slot.description) return;
      const descLower = slot.description.toLowerCase();
      if (descLower.includes('morning routine') || descLower.includes('break') ||
          descLower.includes('lunch') || descLower.includes('wind down') ||
          descLower.includes('review & plan') || descLower.includes('stretch')) return;

      // Check if task already exists
      if (active.find(t => t.title === slot.label)) return;

      const priority = descLower.includes('urgent') ? 'urgent' : descLower.includes('high') ? 'high' : descLower.includes('medium') ? 'medium' : 'low';
      const category = descLower.includes('work') ? 'work' as const : descLower.includes('health') ? 'health' as const : descLower.includes('learning') ? 'learning' as const : 'personal' as const;
      const minutesMatch = descLower.match(/(\d+)\s*min/);
      const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 30;

      onAddTask({
        title: slot.label,
        description: slot.description,
        priority,
        category,
        dueDate: new Date().toISOString().split('T')[0],
        estimatedMinutes: minutes,
        status: 'todo',
        aiSuggested: true,
      });
      created++;
    });

    if (created > 0) {
      onToast('success', `Created ${created} tasks from your plan!`);
      onAddNotification('Tasks created from plan', `${created} new tasks added to Smart Tasks.`, 'violet');
    } else {
      onToast('info', 'All tasks from this plan are already in your list');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">AI Daily Planner</h1>
        <p className="mt-1 text-sm text-slate-500">Intelligent schedule optimization powered by AI</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: Input */}
        <div className="lg:col-span-2 space-y-5">
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <h2 className="text-base font-bold text-slate-800">
              What do you need to accomplish today?
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Describe your tasks in plain English and I'll create an optimized schedule.
            </p>

            <div className="mt-4">
              <textarea
                value={userInput}
                onChange={e => setUserInput(e.target.value)}
                placeholder="e.g. I have 2 assignments, gym, and exam prep..."
                rows={3}
                className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition-all focus:border-violet-300 focus:bg-white focus:ring-2 focus:ring-violet-100"
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={!userInput.trim() || isGenerating}
              className="mt-3 flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-violet-200 transition-all hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:shadow-none"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating Plan...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate Plan
                </>
              )}
            </button>
          </div>

          {/* Try examples */}
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-700">Try:</h3>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {tryExamples.map((example, i) => (
                <button
                  key={i}
                  onClick={() => useExample(example)}
                  className="text-left rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-600 transition-all hover:border-violet-200 hover:bg-violet-50"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>

          {/* Generated Plan */}
          {plan && (
            <div ref={planRef} className="rounded-2xl border border-violet-100 bg-white p-5 shadow-sm scroll-mt-24">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-violet-500" />
                  <h3 className="text-base font-bold text-slate-800">Your Optimized Day 🎯</h3>
                </div>
                <p className="text-xs font-medium text-slate-400">{plan.summary}</p>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Morning */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Sun className="h-4 w-4 text-amber-500" />
                    <h4 className="text-sm font-bold text-slate-700">Morning</h4>
                    <span className="text-[10px] text-slate-400">6 AM – 12 PM</span>
                  </div>
                  <div className="space-y-2">
                    {plan.slots.filter(s => s.minutesOfDay < 12 * 60).map((slot, i) => (
                      <div key={i} className={`rounded-xl border p-3 ${slot.color}`}>
                        <div className="flex items-start gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-base shadow-sm">
                            {slot.icon}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-semibold text-slate-700 truncate">{slot.label}</p>
                              <span className="text-[10px] font-medium text-slate-400">{slot.time}</span>
                            </div>
                            <p className="mt-0.5 text-[10px] text-slate-500">{slot.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {plan.slots.filter(s => s.minutesOfDay < 12 * 60).length === 0 && (
                      <p className="text-xs text-slate-400 text-center py-4">No morning activities</p>
                    )}
                  </div>
                </div>

                {/* Afternoon */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Sun className="h-4 w-4 text-orange-500" />
                    <h4 className="text-sm font-bold text-slate-700">Afternoon</h4>
                    <span className="text-[10px] text-slate-400">12 PM – 5 PM</span>
                  </div>
                  <div className="space-y-2">
                    {plan.slots.filter(s => s.minutesOfDay >= 12 * 60 && s.minutesOfDay < 17 * 60).map((slot, i) => (
                      <div key={i} className={`rounded-xl border p-3 ${slot.color}`}>
                        <div className="flex items-start gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-base shadow-sm">
                            {slot.icon}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-semibold text-slate-700 truncate">{slot.label}</p>
                              <span className="text-[10px] font-medium text-slate-400">{slot.time}</span>
                            </div>
                            <p className="mt-0.5 text-[10px] text-slate-500">{slot.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {plan.slots.filter(s => s.minutesOfDay >= 12 * 60 && s.minutesOfDay < 17 * 60).length === 0 && (
                      <p className="text-xs text-slate-400 text-center py-4">No afternoon activities</p>
                    )}
                  </div>
                </div>

                {/* Evening */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Moon className="h-4 w-4 text-indigo-500" />
                    <h4 className="text-sm font-bold text-slate-700">Evening</h4>
                    <span className="text-[10px] text-slate-400">5 PM onwards</span>
                  </div>
                  <div className="space-y-2">
                    {plan.slots.filter(s => s.minutesOfDay >= 17 * 60).map((slot, i) => (
                      <div key={i} className={`rounded-xl border p-3 ${slot.color}`}>
                        <div className="flex items-start gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-base shadow-sm">
                            {slot.icon}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-semibold text-slate-700 truncate">{slot.label}</p>
                              <span className="text-[10px] font-medium text-slate-400">{slot.time}</span>
                            </div>
                            <p className="mt-0.5 text-[10px] text-slate-500">{slot.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              {applied ? (
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span className="text-xs font-semibold text-emerald-700">Applied to Calendar</span>
                  </div>
                  <button
                    onClick={generateFromPlan}
                    className="flex items-center gap-2 rounded-xl bg-violet-100 px-4 py-2 text-xs font-semibold text-violet-700 hover:bg-violet-200"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Generate Tasks
                  </button>
                  <button
                    onClick={() => onNavigate('calendar')}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:shadow-lg"
                  >
                    View in My Calendar →
                  </button>
                </div>
              ) : (
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => { setUserInput(''); setPlan(null); }}
                    className="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200"
                  >
                    New Plan
                  </button>
                  <button
                    onClick={applyToCalendar}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:shadow-lg"
                  >
                    <Calendar className="h-3.5 w-3.5" />
                    Apply to Calendar
                  </button>
                  <button
                    onClick={generateFromPlan}
                    className="flex items-center gap-2 rounded-xl bg-violet-100 px-4 py-2 text-xs font-semibold text-violet-700 hover:bg-violet-200"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Generate Tasks
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Panel */}
        <div className="space-y-4">
          {/* Current Tasks Summary */}
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800">Active Tasks</h3>
            <div className="mt-3 space-y-2">
              {tasks.filter(t => t.status !== 'done').slice(0, 5).map(task => (
                <div key={task.id} className="flex items-center gap-2 text-xs">
                  <div className={`h-2 w-2 rounded-full ${
                    task.priority === 'urgent' ? 'bg-rose-500' :
                    task.priority === 'high' ? 'bg-amber-500' :
                    task.priority === 'medium' ? 'bg-blue-500' : 'bg-slate-300'
                  }`} />
                  <span className="flex-1 truncate text-slate-600">{task.title}</span>
                  <span className="text-slate-400">{task.estimatedMinutes}m</span>
                </div>
              ))}
              {tasks.filter(t => t.status !== 'done').length === 0 && (
                <p className="text-xs text-slate-400 text-center py-4">No active tasks</p>
              )}
            </div>
          </div>

          {/* Quick Tips */}
          <div className="rounded-2xl bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-100 p-5">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-violet-500" />
              <h3 className="text-sm font-bold text-violet-700">Planning Tips</h3>
            </div>
            <ul className="mt-3 space-y-2">
              {[
                '📋 List all tasks for accurate planning',
                '⏰ Include estimated durations',
                '🎯 Mention deadlines & priorities',
                '💡 Be specific for better results',
              ].map((tip, i) => (
                <li key={i} className="text-xs text-slate-600">{tip}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
