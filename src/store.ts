import { useState, useCallback } from 'react';
import { Task, FocusSession, QuickNote, AIMessage, CalendarSlot } from './types';

const generateId = () => Math.random().toString(36).substr(2, 9);

const initialTasks: Task[] = [
  {
    id: '1',
    title: 'Prepare Q4 Product Roadmap',
    description: 'Define key milestones and deliverables for the next quarter',
    priority: 'urgent',
    category: 'work',
    status: 'in-progress',
    dueDate: '2026-03-20',
    createdAt: '2026-03-14',
    aiSuggested: true,
    estimatedMinutes: 120,
  },
  {
    id: '2',
    title: 'Review team performance metrics',
    description: 'Analyze sprint velocity and identify bottlenecks',
    priority: 'high',
    category: 'work',
    status: 'todo',
    dueDate: '2026-03-18',
    createdAt: '2026-03-14',
    aiSuggested: false,
    estimatedMinutes: 60,
  },
  {
    id: '3',
    title: 'Morning workout routine',
    description: '30 min cardio + strength training',
    priority: 'medium',
    category: 'health',
    status: 'done',
    dueDate: '2026-03-15',
    createdAt: '2026-03-14',
    aiSuggested: true,
    estimatedMinutes: 45,
  },
  {
    id: '4',
    title: 'Complete React Advanced Patterns course',
    description: 'Finish remaining modules on compound components',
    priority: 'medium',
    category: 'learning',
    status: 'in-progress',
    dueDate: '2026-03-25',
    createdAt: '2026-03-10',
    aiSuggested: false,
    estimatedMinutes: 180,
  },
  {
    id: '5',
    title: 'Design new landing page mockup',
    description: 'Create wireframes and high-fidelity designs for the new feature launch',
    priority: 'high',
    category: 'creative',
    status: 'todo',
    dueDate: '2026-03-22',
    createdAt: '2026-03-13',
    aiSuggested: true,
    estimatedMinutes: 150,
  },
  {
    id: '6',
    title: 'Schedule dentist appointment',
    description: 'Annual checkup overdue',
    priority: 'low',
    category: 'personal',
    status: 'todo',
    dueDate: '2026-03-30',
    createdAt: '2026-03-14',
    aiSuggested: false,
    estimatedMinutes: 10,
  },
  {
    id: '7',
    title: 'Write blog post on AI productivity',
    description: 'Share insights from the hackathon experience',
    priority: 'medium',
    category: 'creative',
    status: 'todo',
    dueDate: '2026-03-28',
    createdAt: '2026-03-15',
    aiSuggested: true,
    estimatedMinutes: 90,
  },
  {
    id: '8',
    title: 'Set up CI/CD pipeline for new microservice',
    description: 'Configure GitHub Actions with automated testing and deployment',
    priority: 'high',
    category: 'work',
    status: 'todo',
    dueDate: '2026-03-19',
    createdAt: '2026-03-15',
    aiSuggested: true,
    estimatedMinutes: 100,
  },
];

const initialSessions: FocusSession[] = [];

const initialNotes: QuickNote[] = [
  { id: 'n1', content: 'Use AI to auto-categorize tasks based on description and context', tags: ['AI', 'feature'], createdAt: '2026-03-14T08:00:00', isIdea: true },
  { id: 'n2', content: 'Meeting with design team at 3pm tomorrow to discuss the new dashboard layout', tags: ['meeting', 'design'], createdAt: '2026-03-14T15:00:00', isIdea: false },
  { id: 'n3', content: 'Integrate calendar API for smart scheduling suggestions', tags: ['integration', 'AI'], createdAt: '2026-03-15T09:00:00', isIdea: true },
];

const initialMessages: AIMessage[] = [
  {
    id: 'm1',
    role: 'assistant',
    content: "👋 Hi! I'm FlowMind AI, your productivity copilot. I can help you plan your day, break down complex tasks, suggest priorities, and optimize your workflow. What would you like to work on today?",
    timestamp: '2026-03-15T08:00:00',
  },
];

export function useStore() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [sessions, setSessions] = useState<FocusSession[]>(initialSessions);
  const [notes, setNotes] = useState<QuickNote[]>(initialNotes);
  const [messages, setMessages] = useState<AIMessage[]>(initialMessages);
  const [calendarSlots, setCalendarSlots] = useState<CalendarSlot[]>([]);

  const addTask = useCallback((task: Omit<Task, 'id' | 'createdAt'>) => {
    setTasks(prev => [...prev, { ...task, id: generateId(), createdAt: new Date().toISOString().split('T')[0] }]);
  }, []);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  }, []);

  const toggleTaskStatus = useCallback((id: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t;
      const nextStatus = t.status === 'done' ? 'todo' : t.status === 'todo' ? 'in-progress' : 'done';
      return { ...t, status: nextStatus };
    }));
  }, []);

  const addSession = useCallback((session: Omit<FocusSession, 'id'>) => {
    setSessions(prev => [...prev, { ...session, id: generateId() }]);
  }, []);

  const addNote = useCallback((note: Omit<QuickNote, 'id' | 'createdAt'>) => {
    setNotes(prev => [...prev, { ...note, id: generateId(), createdAt: new Date().toISOString() }]);
  }, []);

  const deleteNote = useCallback((id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
  }, []);

  const addMessage = useCallback((msg: Omit<AIMessage, 'id' | 'timestamp'>) => {
    setMessages(prev => [...prev, { ...msg, id: generateId(), timestamp: new Date().toISOString() }]);
  }, []);

  const setCalendarSlotsBulk = useCallback((slots: Omit<CalendarSlot, 'id'>[]) => {
    const withIds = slots.map(s => ({ ...s, id: generateId() }));
    setCalendarSlots(withIds);
  }, []);

  const clearCalendar = useCallback(() => {
    setCalendarSlots([]);
  }, []);

  // Bulk restore functions for loading persisted data
  const restoreTasks = useCallback((data: Task[]) => {
    setTasks(data);
  }, []);

  const restoreSessions = useCallback((data: FocusSession[]) => {
    setSessions(data);
  }, []);

  const restoreNotes = useCallback((data: QuickNote[]) => {
    setNotes(data);
  }, []);

  const restoreMessages = useCallback((data: AIMessage[]) => {
    setMessages(data);
  }, []);

  const restoreCalendarSlots = useCallback((data: CalendarSlot[]) => {
    setCalendarSlots(data);
  }, []);

  return {
    tasks,
    sessions,
    notes,
    messages,
    calendarSlots,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskStatus,
    addSession,
    addNote,
    deleteNote,
    addMessage,
    setCalendarSlots: setCalendarSlotsBulk,
    clearCalendar,
    restoreTasks,
    restoreSessions,
    restoreNotes,
    restoreMessages,
    restoreCalendarSlots,
  };
}
