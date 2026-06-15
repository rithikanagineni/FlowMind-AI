import { useEffect, useState } from 'react';
import { Task } from '../types';
import {
  Plus,
  Sparkles,
  Filter,
  Clock,
  Trash2,
  CheckCircle2,
  Circle,
  PlayCircle,
  Calendar,
  AlertTriangle,
  ArrowUp,
  ArrowUpRight,
  Minus,
  X,
  Pencil,
  Save,
} from 'lucide-react';

interface SmartTasksProps {
  tasks: Task[];
  onAddTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  onDeleteTask: (id: string) => void;
}

type TaskFormState = {
  title: string;
  description: string;
  priority: Task['priority'];
  category: Task['category'];
  dueDate: string;
  estimatedMinutes: number;
};

const createDefaultTaskForm = (): TaskFormState => ({
  title: '',
  description: '',
  priority: 'medium',
  category: 'work',
  dueDate: new Date().toISOString().split('T')[0],
  estimatedMinutes: 30,
});

const priorityConfig = {
  urgent: { label: 'Urgent', color: 'bg-rose-100 text-rose-700 border-rose-200', icon: AlertTriangle },
  high: { label: 'High', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: ArrowUp },
  medium: { label: 'Medium', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: ArrowUpRight },
  low: { label: 'Low', color: 'bg-slate-100 text-slate-600 border-slate-200', icon: Minus },
};

const categoryConfig: Record<Task['category'], { emoji: string; bg: string }> = {
  work: { emoji: '💼', bg: 'bg-blue-50' },
  personal: { emoji: '🏠', bg: 'bg-pink-50' },
  health: { emoji: '💪', bg: 'bg-emerald-50' },
  learning: { emoji: '📚', bg: 'bg-amber-50' },
  creative: { emoji: '🎨', bg: 'bg-purple-50' },
};

const statusConfig: Record<Task['status'], { label: string; progress: number; badge: string; bar: string }> = {
  todo: {
    label: 'Started',
    progress: 20,
    badge: 'bg-sky-100 text-sky-700 border-sky-200',
    bar: 'from-sky-400 to-blue-500',
  },
  'in-progress': {
    label: 'In Progress',
    progress: 65,
    badge: 'bg-amber-100 text-amber-700 border-amber-200',
    bar: 'from-amber-400 to-orange-500',
  },
  done: {
    label: 'Completed',
    progress: 100,
    badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    bar: 'from-emerald-400 to-teal-500',
  },
};

function StatusIcon({ status }: { status: Task['status'] }) {
  if (status === 'done') return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
  if (status === 'in-progress') return <PlayCircle className="h-5 w-5 text-amber-500" />;
  return <Circle className="h-5 w-5 text-sky-400" />;
}

export default function SmartTasks({ tasks, onAddTask, onUpdateTask, onDeleteTask }: SmartTasksProps) {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit' | null>(null);
  const [taskForm, setTaskForm] = useState<TaskFormState>(createDefaultTaskForm());

  // Top-level tasks are those without a parent
  const filteredTasks = tasks.filter((task) => {
    if (task.parentId) return false; // exclude subtasks from top-level list
    if (filterStatus !== 'all' && task.status !== filterStatus) return false;
    if (filterPriority !== 'all' && task.priority !== filterPriority) return false;
    return true;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    if (a.status === 'done' && b.status !== 'done') return 1;
    if (a.status !== 'done' && b.status === 'done') return -1;
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  // Helper: get subtasks for a given parent
  const getSubtasks = (parentId: string) =>
    tasks.filter((t) => t.parentId === parentId);

  useEffect(() => {
    if (activeTaskId && !tasks.some((task) => task.id === activeTaskId)) {
      setActiveTaskId(null);
    }
  }, [tasks, activeTaskId]);

  const selectedTask = tasks.find((task) => task.id === activeTaskId) ?? null;

  const openCreateForm = () => {
    setFormMode('create');
    setTaskForm(createDefaultTaskForm());
  };

  const openEditForm = (task: Task) => {
    setActiveTaskId(task.id);
    setFormMode('edit');
    setTaskForm({
      title: task.title,
      description: task.description,
      priority: task.priority,
      category: task.category,
      dueDate: task.dueDate,
      estimatedMinutes: task.estimatedMinutes,
    });
  };

  const closeForm = () => {
    setFormMode(null);
    setTaskForm(createDefaultTaskForm());
  };

  const saveTask = () => {
    if (!taskForm.title.trim()) return;

    if (formMode === 'edit' && selectedTask) {
      onUpdateTask(selectedTask.id, {
        title: taskForm.title,
        description: taskForm.description,
        priority: taskForm.priority,
        category: taskForm.category,
        dueDate: taskForm.dueDate,
        estimatedMinutes: taskForm.estimatedMinutes,
      });
    }

    if (formMode === 'create') {
      onAddTask({
        title: taskForm.title,
        description: taskForm.description,
        priority: taskForm.priority,
        category: taskForm.category,
        dueDate: taskForm.dueDate,
        estimatedMinutes: taskForm.estimatedMinutes,
        status: 'todo',
        aiSuggested: false,
      });
    }

    closeForm();
  };

  const handleDeleteTask = (id: string) => {
    if (activeTaskId === id) {
      setActiveTaskId(null);
    }
    // Cascade delete subtasks
    const subtasks = tasks.filter((t) => t.parentId === id);
    subtasks.forEach((sub) => onDeleteTask(sub.id));
    onDeleteTask(id);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Smart Tasks ✨</h1>
          <p className="mt-1 text-sm text-slate-500">Click a task to update status, edit details, or delete it instantly.</p>
        </div>
        <button
          onClick={openCreateForm}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-violet-200 transition-all hover:-translate-y-0.5 hover:shadow-lg"
        >
          <Plus className="h-4 w-4" />
          Add Task
        </button>
      </div>

      <div className="flex items-center gap-3 rounded-xl border border-violet-100 bg-gradient-to-r from-violet-50 to-indigo-50 px-4 py-3">
        <Sparkles className="h-5 w-5 shrink-0 text-violet-500" />
        <p className="text-sm text-slate-600">
          <span className="font-semibold text-violet-700">AI Suggestion:</span> Select a task to instantly move it between <strong>Started</strong>, <strong>In Progress</strong>, and <strong>Completed</strong>.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Filter className="h-4 w-4 text-slate-400" />
        {[
          { key: 'all', label: 'All' },
          { key: 'todo', label: 'Started' },
          { key: 'in-progress', label: 'In Progress' },
          { key: 'done', label: 'Completed' },
        ].map((status) => (
          <button
            key={status.key}
            onClick={() => setFilterStatus(status.key)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              filterStatus === status.key
                ? 'bg-violet-100 text-violet-700'
                : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
            }`}
          >
            {status.label}
          </button>
        ))}
        <div className="mx-1 h-4 w-px bg-slate-200" />
        {['all', 'urgent', 'high', 'medium', 'low'].map((priority) => (
          <button
            key={priority}
            onClick={() => setFilterPriority(priority)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              filterPriority === priority
                ? 'bg-violet-100 text-violet-700'
                : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
            }`}
          >
            {priority.charAt(0).toUpperCase() + priority.slice(1)}
          </button>
        ))}
      </div>

      {formMode === 'create' && (
        <div className="rounded-2xl border border-violet-100 bg-white p-5 shadow-lg shadow-violet-100/50">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-800">Create New Task</h3>
            <button onClick={closeForm} className="text-slate-400 hover:text-slate-600">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-4 space-y-3">
            <input
              type="text"
              placeholder="Task title..."
              value={taskForm.title}
              onChange={(event) => setTaskForm({ ...taskForm, title: event.target.value })}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
            />
            <textarea
              placeholder="Description (optional)..."
              value={taskForm.description}
              onChange={(event) => setTaskForm({ ...taskForm, description: event.target.value })}
              rows={3}
              className="w-full resize-none rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
            />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <label className="text-xs font-medium text-slate-500">Priority</label>
                <select
                  value={taskForm.priority}
                  onChange={(event) => setTaskForm({ ...taskForm, priority: event.target.value as Task['priority'] })}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-violet-300"
                >
                  <option value="urgent">🔴 Urgent</option>
                  <option value="high">🟠 High</option>
                  <option value="medium">🔵 Medium</option>
                  <option value="low">⚪ Low</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500">Category</label>
                <select
                  value={taskForm.category}
                  onChange={(event) => setTaskForm({ ...taskForm, category: event.target.value as Task['category'] })}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-violet-300"
                >
                  <option value="work">💼 Work</option>
                  <option value="personal">🏠 Personal</option>
                  <option value="health">💪 Health</option>
                  <option value="learning">📚 Learning</option>
                  <option value="creative">🎨 Creative</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500">Due Date</label>
                <input
                  type="date"
                  value={taskForm.dueDate}
                  onChange={(event) => setTaskForm({ ...taskForm, dueDate: event.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-violet-300"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500">Est. Minutes</label>
                <input
                  type="number"
                  min="0"
                  value={taskForm.estimatedMinutes}
                  onChange={(event) => setTaskForm({ ...taskForm, estimatedMinutes: parseInt(event.target.value, 10) || 0 })}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-violet-300"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={closeForm}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={saveTask}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-500 to-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:shadow-md"
              >
                <Save className="h-4 w-4" />
                Create Task
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {sortedTasks.map((task) => {
          const isSelected = activeTaskId === task.id;
          const priority = priorityConfig[task.priority];
          const category = categoryConfig[task.category];
          const status = statusConfig[task.status];
          const PriorityIcon = priority.icon;

          return (
            <div
              key={task.id}
              onClick={() => setActiveTaskId(isSelected ? null : task.id)}
              className={`cursor-pointer rounded-2xl border bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${
                isSelected
                  ? 'border-violet-200 shadow-lg shadow-violet-100/60'
                  : task.status === 'done'
                    ? 'border-slate-100 opacity-80'
                    : 'border-slate-100'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0">
                  <StatusIcon status={task.status} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className={`text-sm font-semibold ${task.status === 'done' ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
                          {task.title}
                        </h3>
                        {task.aiSuggested && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-600">
                            <Sparkles className="h-3 w-3" /> AI Pick
                          </span>
                        )}
                        {getSubtasks(task.id).length > 0 && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-600">
                            📋 {getSubtasks(task.id).filter(s => s.status === 'done').length}/{getSubtasks(task.id).length} subtasks
                          </span>
                        )}
                      </div>
                      <p className={`mt-1 text-xs ${isSelected ? 'text-slate-500' : 'line-clamp-1 text-slate-400'}`}>
                        {task.description || 'No description added yet.'}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${status.badge}`}>
                        {status.label}
                      </span>
                      <span className="text-xs font-bold text-slate-500">{status.progress}%</span>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-semibold ${priority.color}`}>
                      <PriorityIcon className="h-3 w-3" />
                      {priority.label}
                    </span>
                    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium text-slate-600 ${category.bg}`}>
                      {category.emoji} {task.category}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] text-slate-400">
                      <Clock className="h-3 w-3" />
                      {task.estimatedMinutes}m
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] text-slate-400">
                      <Calendar className="h-3 w-3" />
                      {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>

                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${status.bar} transition-all duration-300`}
                      style={{ width: `${status.progress}%` }}
                    />
                  </div>

                  {isSelected && (() => {
                    const subtasks = getSubtasks(task.id);
                    const subtaskProgress = subtasks.length > 0
                      ? Math.round((subtasks.filter(s => s.status === 'done').length / subtasks.length) * 100)
                      : 0;
                    return (
                    <div className="mt-4 space-y-4 rounded-xl border border-violet-100 bg-violet-50/50 p-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">Update Progress</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {([
                            { value: 'todo', label: 'Started' },
                            { value: 'in-progress', label: 'In Progress' },
                            { value: 'done', label: 'Completed' },
                          ] as const).map((option) => (
                            <button
                              key={option.value}
                              onClick={(event) => {
                                event.stopPropagation();
                                onUpdateTask(task.id, { status: option.value });
                              }}
                              className={`rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                                task.status === option.value
                                  ? 'bg-gradient-to-r from-violet-500 to-indigo-600 text-white shadow-md shadow-violet-200'
                                  : 'bg-white text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* AI-Generated Subtasks */}
                      {subtasks.length > 0 && (
                        <div onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Sparkles className="h-3.5 w-3.5 text-violet-500" />
                              <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">
                                AI Subtasks ({subtasks.filter(s => s.status === 'done').length}/{subtasks.length})
                              </p>
                            </div>
                            <span className="text-xs font-bold text-violet-600">{subtaskProgress}%</span>
                          </div>
                          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/80">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-500"
                              style={{ width: `${subtaskProgress}%` }}
                            />
                          </div>
                          <div className="mt-3 space-y-2">
                            {subtasks.map((sub) => {
                              const subPriority = priorityConfig[sub.priority];
                              return (
                                <div
                                  key={sub.id}
                                  className={`flex items-center gap-2 rounded-lg border border-slate-100 bg-white p-2.5 transition-all ${
                                    sub.status === 'done' ? 'opacity-60' : ''
                                  }`}
                                >
                                  <button
                                    onClick={() => {
                                      const next = sub.status === 'done' ? 'todo' : sub.status === 'todo' ? 'in-progress' : 'done';
                                      onUpdateTask(sub.id, { status: next });
                                    }}
                                    className="shrink-0"
                                  >
                                    <StatusIcon status={sub.status} />
                                  </button>
                                  <div className="min-w-0 flex-1">
                                    <p className={`text-xs font-medium ${sub.status === 'done' ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                                      {sub.title}
                                    </p>
                                    <div className="mt-0.5 flex items-center gap-2">
                                      <span className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[9px] font-semibold ${subPriority.color}`}>
                                        {subPriority.label}
                                      </span>
                                      <span className="text-[9px] text-slate-400">
                                        <Clock className="inline h-2.5 w-2.5 mr-0.5" />
                                        {sub.estimatedMinutes}m
                                      </span>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => onDeleteTask(sub.id)}
                                    className="shrink-0 rounded p-1 text-slate-300 hover:bg-rose-50 hover:text-rose-500"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            if (formMode === 'edit' && activeTaskId === task.id) {
                              closeForm();
                            } else {
                              openEditForm(task);
                            }
                          }}
                          className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold shadow-sm transition-all ${
                            formMode === 'edit' && activeTaskId === task.id
                              ? 'bg-violet-100 text-violet-700'
                              : 'bg-white text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          {formMode === 'edit' && activeTaskId === task.id ? 'Close Editor' : 'Edit Task'}
                        </button>
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            handleDeleteTask(task.id);
                          }}
                          className="inline-flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-100"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete Task
                        </button>
                      </div>

                      {/* Inline Edit Form */}
                      {formMode === 'edit' && activeTaskId === task.id && (
                        <div
                          onClick={(event) => event.stopPropagation()}
                          className="rounded-xl border border-violet-200 bg-white p-4 shadow-inner"
                        >
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-slate-800">✏️ Edit Task</h3>
                            <button onClick={closeForm} className="text-slate-400 hover:text-slate-600">
                              <X className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="mt-3 space-y-3">
                            <input
                              type="text"
                              placeholder="Task title..."
                              value={taskForm.title}
                              onChange={(event) => setTaskForm({ ...taskForm, title: event.target.value })}
                              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
                            />
                            <textarea
                              placeholder="Description (optional)..."
                              value={taskForm.description}
                              onChange={(event) => setTaskForm({ ...taskForm, description: event.target.value })}
                              rows={2}
                              className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
                            />
                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                              <div>
                                <label className="text-[10px] font-medium text-slate-500">Priority</label>
                                <select
                                  value={taskForm.priority}
                                  onChange={(event) => setTaskForm({ ...taskForm, priority: event.target.value as Task['priority'] })}
                                  className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs outline-none focus:border-violet-300"
                                >
                                  <option value="urgent">🔴 Urgent</option>
                                  <option value="high">🟠 High</option>
                                  <option value="medium">🔵 Medium</option>
                                  <option value="low">⚪ Low</option>
                                </select>
                              </div>
                              <div>
                                <label className="text-[10px] font-medium text-slate-500">Category</label>
                                <select
                                  value={taskForm.category}
                                  onChange={(event) => setTaskForm({ ...taskForm, category: event.target.value as Task['category'] })}
                                  className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs outline-none focus:border-violet-300"
                                >
                                  <option value="work">💼 Work</option>
                                  <option value="personal">🏠 Personal</option>
                                  <option value="health">💪 Health</option>
                                  <option value="learning">📚 Learning</option>
                                  <option value="creative">🎨 Creative</option>
                                </select>
                              </div>
                              <div>
                                <label className="text-[10px] font-medium text-slate-500">Due Date</label>
                                <input
                                  type="date"
                                  value={taskForm.dueDate}
                                  onChange={(event) => setTaskForm({ ...taskForm, dueDate: event.target.value })}
                                  className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs outline-none focus:border-violet-300"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-medium text-slate-500">Est. Minutes</label>
                                <input
                                  type="number"
                                  min="0"
                                  value={taskForm.estimatedMinutes}
                                  onChange={(event) => setTaskForm({ ...taskForm, estimatedMinutes: parseInt(event.target.value, 10) || 0 })}
                                  className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs outline-none focus:border-violet-300"
                                />
                              </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-1">
                              <button
                                onClick={closeForm}
                                className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={saveTask}
                                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-500 to-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:shadow-md"
                              >
                                <Save className="h-3.5 w-3.5" />
                                Save Changes
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          );
        })}

        {sortedTasks.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-12">
            <CheckCircle2 className="h-10 w-10 text-slate-200" />
            <p className="mt-3 text-sm text-slate-400">No tasks match your filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
