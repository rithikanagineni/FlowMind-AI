import { useState, useEffect, useCallback, useRef } from 'react';
import { Task, FocusSession } from '../types';
import { localDateString, localTimestamp } from '../utils/dates';
import {
  Play,
  Pause,
  RotateCcw,
  Flame,
  Clock,
  CheckCircle2,
  Sparkles,
  SkipForward,
  Volume2,
  VolumeX,
  BellRing,
} from 'lucide-react';

interface FocusTimerProps {
  tasks: Task[];
  sessions: FocusSession[];
  onAddSession: (session: Omit<FocusSession, 'id'>) => void;
}

const TIMER_PRESETS = [
  { label: '25m Pomodoro', minutes: 25, icon: '🍅' },
  { label: '50m Deep Work', minutes: 50, icon: '🧠' },
  { label: '15m Quick Focus', minutes: 15, icon: '⚡' },
  { label: '5m Break', minutes: 5, icon: '☕' },
];

// Create audio context for alarm sound
function createAlarmSound() {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  
  const playTone = (frequency: number, startTime: number, duration: number) => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
    
    oscillator.start(startTime);
    oscillator.stop(startTime + duration);
  };

  return () => {
    const now = audioContext.currentTime;
    // Play a pleasant alarm melody (ascending tones)
    playTone(523.25, now, 0.3);        // C5
    playTone(659.25, now + 0.15, 0.3);  // E5
    playTone(783.99, now + 0.3, 0.3);   // G5
    playTone(1046.50, now + 0.45, 0.5); // C6
    
    // Repeat after short pause
    setTimeout(() => {
      const now2 = audioContext.currentTime;
      playTone(523.25, now2, 0.3);
      playTone(659.25, now2 + 0.15, 0.3);
      playTone(783.99, now2 + 0.3, 0.3);
      playTone(1046.50, now2 + 0.45, 0.5);
    }, 800);
  };
}

export default function FocusTimer({ tasks, sessions, onAddSession }: FocusTimerProps) {
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(25 * 60);
  const [remainingSeconds, setRemainingSeconds] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [completedSessionsCount, setCompletedSessionsCount] = useState(0);
  const [isAlarmRinging, setIsAlarmRinging] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const alarmRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const playAlarmRef = useRef<(() => void) | null>(null);

  const progress = totalSeconds > 0 ? ((totalSeconds - remainingSeconds) / totalSeconds) * 100 : 0;
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;

  const activeTasks = tasks.filter(t => t.status !== 'done');
  const selectedTask = tasks.find(t => t.id === selectedTaskId);

  // Today's sessions (local timezone)
  const today = localDateString();
  const todaySessions = sessions.filter(s => s.completedAt.startsWith(today));
  const todayMinutes = todaySessions.reduce((acc, s) => acc + s.duration, 0);
  const sessionLoggedRef = useRef(false);

  // Initialize alarm sound
  useEffect(() => {
    playAlarmRef.current = createAlarmSound();
    return () => {
      if (alarmRef.current) clearInterval(alarmRef.current);
    };
  }, []);

  // Handle alarm ringing
  useEffect(() => {
    if (isAlarmRinging && audioEnabled && playAlarmRef.current) {
      // Play alarm immediately
      playAlarmRef.current();
      
      // Repeat every 2 seconds
      alarmRef.current = setInterval(() => {
        playAlarmRef.current!();
      }, 2000);
    }
    return () => {
      if (alarmRef.current) clearInterval(alarmRef.current);
    };
  }, [isAlarmRinging, audioEnabled]);

  // Tick the timer down (pure countdown — no side effects inside the updater)
  useEffect(() => {
    if (isRunning && remainingSeconds > 0) {
      intervalRef.current = setInterval(() => {
        setRemainingSeconds(prev => (prev <= 1 ? 0 : prev - 1));
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, remainingSeconds]);

  // Handle timer completion in a dedicated effect (reliable session logging)
  useEffect(() => {
    if (remainingSeconds === 0 && isRunning && !sessionLoggedRef.current) {
      sessionLoggedRef.current = true;
      setIsRunning(false);
      const preset = TIMER_PRESETS[selectedPreset];
      // Save ALL sessions (including breaks) with LOCAL timestamp
      onAddSession({
        duration: preset.minutes,
        completedAt: localTimestamp(),
        taskTitle: preset.minutes <= 5 ? 'Break' : (selectedTask?.title || 'General Focus'),
      });
      setCompletedSessionsCount(prev => prev + 1);
      setIsAlarmRinging(true);
    }
  }, [remainingSeconds, isRunning, selectedPreset, selectedTask, onAddSession]);

  const handlePresetChange = useCallback((index: number) => {
    setSelectedPreset(index);
    const seconds = TIMER_PRESETS[index].minutes * 60;
    setTotalSeconds(seconds);
    setRemainingSeconds(seconds);
    setIsRunning(false);
    setIsAlarmRinging(false);
    sessionLoggedRef.current = false;
  }, []);

  const toggleTimer = useCallback(() => {
    if (remainingSeconds === 0) {
      const seconds = TIMER_PRESETS[selectedPreset].minutes * 60;
      setTotalSeconds(seconds);
      setRemainingSeconds(seconds);
      setIsRunning(true);
      setIsAlarmRinging(false);
      sessionLoggedRef.current = false;
    } else {
      if (!isRunning) sessionLoggedRef.current = false;
      setIsRunning(prev => !prev);
    }
  }, [remainingSeconds, selectedPreset, isRunning]);

  const resetTimer = useCallback(() => {
    const seconds = TIMER_PRESETS[selectedPreset].minutes * 60;
    setTotalSeconds(seconds);
    setRemainingSeconds(seconds);
    setIsRunning(false);
    setIsAlarmRinging(false);
    sessionLoggedRef.current = false;
  }, [selectedPreset]);

  const skipSession = useCallback(() => {
    const preset = TIMER_PRESETS[selectedPreset];
    if (preset.minutes > 5 && remainingSeconds < totalSeconds) {
      const elapsed = totalSeconds - remainingSeconds;
      if (elapsed > 60) {
        onAddSession({
          duration: Math.round(elapsed / 60),
          completedAt: localTimestamp(),
          taskTitle: selectedTask?.title || 'General Focus',
        });
      }
    }
    const seconds = TIMER_PRESETS[selectedPreset].minutes * 60;
    setTotalSeconds(seconds);
    setRemainingSeconds(seconds);
    setIsRunning(false);
    setIsAlarmRinging(false);
    sessionLoggedRef.current = false;
  }, [selectedPreset, remainingSeconds, totalSeconds, selectedTask, onAddSession]);

  const stopAlarm = useCallback(() => {
    setIsAlarmRinging(false);
    if (alarmRef.current) {
      clearInterval(alarmRef.current);
      alarmRef.current = null;
    }
  }, []);

  const toggleAudio = useCallback(() => {
    setAudioEnabled(prev => !prev);
    if (isAlarmRinging) {
      setIsAlarmRinging(false);
      if (alarmRef.current) {
        clearInterval(alarmRef.current);
        alarmRef.current = null;
      }
    }
  }, [isAlarmRinging]);

  // Calculate ring
  const size = 240;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (progress / 100) * circumference;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Focus Timer 🎯</h1>
        <p className="mt-1 text-sm text-slate-500">Deep work sessions to maximize your productivity</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Timer */}
        <div className="flex flex-col items-center rounded-2xl border border-slate-100 bg-white p-6 shadow-sm lg:col-span-2">
          {/* Audio Toggle */}
          <div className="flex w-full items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Alarm Sound</span>
            <button
              onClick={toggleAudio}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                audioEnabled
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              {audioEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
              {audioEnabled ? 'On' : 'Off'}
            </button>
          </div>

          {/* Alarm Banner */}
          {isAlarmRinging && (
            <div className="mb-4 flex w-full items-center justify-between rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 p-4 text-white shadow-lg shadow-amber-200 animate-pulse">
              <div className="flex items-center gap-3">
                <BellRing className="h-6 w-6 animate-bounce" />
                <div>
                  <p className="text-sm font-bold">Session Complete! 🎉</p>
                  <p className="text-xs opacity-90">Great work! Time to take a break.</p>
                </div>
              </div>
              <button
                onClick={stopAlarm}
                className="flex items-center gap-2 rounded-lg bg-white/20 px-4 py-2 text-xs font-semibold backdrop-blur-sm hover:bg-white/30"
              >
                <VolumeX className="h-4 w-4" />
                Stop Alarm
              </button>
            </div>
          )}

          {/* Presets */}
          <div className="flex flex-wrap justify-center gap-2">
            {TIMER_PRESETS.map((preset, i) => (
              <button
                key={preset.label}
                onClick={() => handlePresetChange(i)}
                className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
                  selectedPreset === i
                    ? 'bg-violet-100 text-violet-700 shadow-sm'
                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                }`}
              >
                <span>{preset.icon}</span>
                {preset.label}
              </button>
            ))}
          </div>

          {/* Timer Ring */}
          <div className={`relative mt-8 ${isAlarmRinging ? 'animate-pulse' : ''}`}>
            <svg width={size} height={size} className="transform -rotate-90">
              <circle
                cx={size / 2} cy={size / 2} r={radius}
                stroke="currentColor" strokeWidth={strokeWidth}
                fill="none" className="text-slate-100"
              />
              <circle
                cx={size / 2} cy={size / 2} r={radius}
                stroke={isAlarmRinging ? 'url(#alarmGradient)' : 'url(#timerGradient)'}
                strokeWidth={strokeWidth}
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-linear"
              />
              <defs>
                <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
                <linearGradient id="alarmGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#ef4444" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-5xl font-bold tabular-nums ${isAlarmRinging ? 'text-amber-600' : 'text-slate-800'}`}>
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </span>
              <span className="mt-1 text-xs text-slate-400">
                {isAlarmRinging ? '🔔 Alarm ringing!' : isRunning ? 'Focus mode active' : remainingSeconds === totalSeconds ? 'Ready to start' : 'Paused'}
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="mt-6 flex items-center gap-3">
            <button
              onClick={resetTimer}
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200"
            >
              <RotateCcw className="h-5 w-5" />
            </button>
            <button
              onClick={toggleTimer}
              disabled={isAlarmRinging}
              className={`flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 ${
                isAlarmRinging
                  ? 'bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-200'
                  : isRunning
                    ? 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-amber-200'
                    : 'bg-gradient-to-br from-violet-500 to-indigo-600 shadow-violet-200'
              }`}
            >
              {isAlarmRinging ? (
                <BellRing className="h-6 w-6 text-white animate-bounce" />
              ) : isRunning ? (
                <Pause className="h-6 w-6 text-white" />
              ) : (
                <Play className="h-6 w-6 text-white ml-0.5" />
              )}
            </button>
            <button
              onClick={skipSession}
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200"
            >
              <SkipForward className="h-5 w-5" />
            </button>
          </div>

          {/* Task Selector */}
          <div className="mt-6 w-full max-w-xs">
            <label className="text-xs font-medium text-slate-500">Focus on task:</label>
            <select
              value={selectedTaskId}
              onChange={e => setSelectedTaskId(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
            >
              <option value="">General Focus</option>
              {activeTasks.map(task => (
                <option key={task.id} value={task.id}>{task.title}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Stats Sidebar */}
        <div className="space-y-4">
          {/* Today's Stats */}
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800">Today's Focus</h3>
            <div className="mt-3 space-y-3">
              <div className="flex items-center gap-3 rounded-xl bg-violet-50 p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-800">{todayMinutes}m</p>
                  <p className="text-[11px] text-slate-500">Total focus time</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-emerald-50 p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600">
                  <CheckCircle2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-800">{todaySessions.length}</p>
                  <p className="text-[11px] text-slate-500">Sessions completed</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-amber-50 p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600">
                  <Flame className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-800">{completedSessionsCount}</p>
                  <p className="text-[11px] text-slate-500">This session</p>
                </div>
              </div>
            </div>
          </div>

          {/* AI Tips */}
          <div className="rounded-2xl bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-100 p-5">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-violet-500" />
              <h3 className="text-sm font-bold text-violet-700">Focus Tips</h3>
            </div>
            <ul className="mt-3 space-y-2">
              {[
                '🔇 Silence notifications',
                '💧 Keep water nearby',
                '🎯 One task at a time',
                '🧘 Take breaks between sessions',
              ].map((tip, i) => (
                <li key={i} className="text-xs text-slate-600">{tip}</li>
              ))}
            </ul>
          </div>

          {/* Recent Sessions */}
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800">Recent Sessions</h3>
            <div className="mt-3 space-y-2">
              {sessions.slice(-4).reverse().map(session => (
                <div key={session.id} className="flex items-center gap-2 text-xs">
                  <div className="h-2 w-2 rounded-full bg-violet-400" />
                  <span className="flex-1 truncate text-slate-600">{session.taskTitle}</span>
                  <span className="text-slate-400">{session.duration}m</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
