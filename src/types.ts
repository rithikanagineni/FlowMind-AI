export interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  category: 'work' | 'personal' | 'health' | 'learning' | 'creative';
  status: 'todo' | 'in-progress' | 'done';
  dueDate: string;
  createdAt: string;
  aiSuggested: boolean;
  estimatedMinutes: number;
  parentId?: string | null;
}

export interface FocusSession {
  id: string;
  duration: number;
  completedAt: string;
  taskTitle: string;
}

export interface QuickNote {
  id: string;
  content: string;
  tags: string[];
  createdAt: string;
  isIdea: boolean;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export type Page = 'dashboard' | 'tasks' | 'focus' | 'assistant' | 'planner' | 'capture' | 'analytics' | 'calendar';

export interface CalendarSlot {
  id: string;
  time: string;
  label: string;
  description: string;
  icon: string;
  color: string;
  date: string;
}
