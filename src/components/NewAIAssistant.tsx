import { useState, useRef, useEffect } from 'react';
import { AIMessage, Task } from '../types';
import {
  Send,
  Bot,
  User,
  ListTodo,
  Lightbulb,
  Plus,
} from 'lucide-react';

interface AIAssistantProps {
  messages: AIMessage[];
  tasks: Task[];
  onAddMessage: (msg: Omit<AIMessage, 'id' | 'timestamp'>) => void;
  onAddTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
}

interface Subtask {
  title: string;
  estimatedMinutes: number;
  priority: Task['priority'];
}

function generateSubtasks(task: Task): Subtask[] {
  const keywords = task.title.toLowerCase();

  if (keywords.includes('build') || keywords.includes('project') || keywords.includes('app')) {
    return [
      { title: 'Research & gather requirements', estimatedMinutes: 30, priority: 'high' },
      { title: 'Design architecture', estimatedMinutes: 45, priority: 'high' },
      { title: 'Set up development environment', estimatedMinutes: 20, priority: 'medium' },
      { title: 'Implement core functionality', estimatedMinutes: 60, priority: 'urgent' },
      { title: 'Write tests & debug', estimatedMinutes: 30, priority: 'high' },
      { title: 'Deploy & review', estimatedMinutes: 25, priority: 'medium' },
    ];
  }

  if (keywords.includes('write') || keywords.includes('blog') || keywords.includes('report')) {
    return [
      { title: 'Research & outline', estimatedMinutes: 25, priority: 'high' },
      { title: 'Write first draft', estimatedMinutes: 40, priority: 'urgent' },
      { title: 'Edit & refine', estimatedMinutes: 20, priority: 'medium' },
      { title: 'Proofread & publish', estimatedMinutes: 15, priority: 'low' },
    ];
  }

  if (keywords.includes('design') || keywords.includes('mockup') || keywords.includes('landing')) {
    return [
      { title: 'Research competitor designs', estimatedMinutes: 20, priority: 'medium' },
      { title: 'Create wireframes', estimatedMinutes: 30, priority: 'high' },
      { title: 'Design high-fidelity mockups', estimatedMinutes: 50, priority: 'urgent' },
      { title: 'Get feedback & iterate', estimatedMinutes: 30, priority: 'high' },
      { title: 'Finalize & handoff', estimatedMinutes: 20, priority: 'medium' },
    ];
  }

  return [
    { title: `Plan approach for "${task.title}"`, estimatedMinutes: 15, priority: 'high' },
    { title: 'Execute main work', estimatedMinutes: 30, priority: 'urgent' },
    { title: 'Review & refine', estimatedMinutes: 15, priority: 'high' },
    { title: 'Finalize & deliver', estimatedMinutes: 15, priority: 'medium' },
  ];
}

function generateAIResponse(userMessage: string, tasks: Task[]): string {
  const msg = userMessage.toLowerCase();
  const activeTasks = tasks.filter(t => t.status !== 'done');

  if (msg.includes('break') && (msg.includes('down') || msg.includes('split') || msg.includes('step'))) {
    const target = activeTasks.find(t => t.priority === 'urgent') || activeTasks[0];
    if (!target) return 'No active tasks found to break down.';
    const subs = generateSubtasks(target);
    return `📋 **Task Breakdown: "${target.title}"**\n\nI split this into ${subs.length} subtasks:\n\n${subs.map(s => `• **${s.title}** (${s.estimatedMinutes}m) — ${s.priority}`).join('\n')}\n\n🚀 Use the "Subtasks" button below to create them.`;
  }

  if (msg.includes('tip') || msg.includes('productivity') || msg.includes('advice')) {
    return `🧠 **Personalized Productivity Tips**\n\n1. **Time Blocking** — Block 50-min focus sessions\n2. **2-Minute Rule** — Do quick tasks immediately\n3. **Peak Energy** — Schedule hard tasks 8-11 AM\n4. **Daily Review** — Spend 5 min reviewing each evening`;
  }

  return `👋 I'm your FlowMind AI Assistant!\n\nI can help you with:\n\n📋 **Break down tasks** — Split complex work into steps\n💡 **Productivity tips** — Personalized advice\n📊 **Task overview** — Review your workload\n\nYou have **${activeTasks.length}** active tasks.\n\nWhat would you like help with?`;
}

export default function AIAssistant({ messages, tasks, onAddMessage, onAddTask }: AIAssistantProps) {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeTasks = tasks.filter(t => t.status !== 'done' && !t.parentId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText) return;

    onAddMessage({ role: 'user', content: messageText });
    setInput('');
    setIsTyping(true);

    await new Promise(resolve => setTimeout(resolve, 700 + Math.random() * 800));
    const response = generateAIResponse(messageText, tasks);
    onAddMessage({ role: 'assistant', content: response });
    setIsTyping(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const createSubtasksForTask = (task: Task) => {
    const subtasks = generateSubtasks(task);
    subtasks.forEach(sub => {
      onAddTask({
        title: sub.title,
        description: `Subtask of: ${task.title}`,
        priority: sub.priority,
        category: task.category,
        dueDate: task.dueDate,
        estimatedMinutes: sub.estimatedMinutes,
        status: 'todo',
        aiSuggested: true,
        parentId: task.id,
      });
    });
    onAddMessage({
      role: 'assistant',
      content: `✅ Created ${subtasks.length} subtasks for **"${task.title}"**! Find them nested inside the parent task in Smart Tasks.`,
    });
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">FlowMind AI Assistant</h1>
        <p className="mt-1 text-sm text-slate-500">Context optimization & assistance</p>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Chat Panel */}
        <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm xl:col-span-2" style={{ height: 'calc(100vh - 16rem)' }}>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map(message => (
              <div key={message.id} className={`flex items-start gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                  message.role === 'assistant' ? 'bg-gradient-to-br from-violet-500 to-indigo-600' : 'bg-gradient-to-br from-emerald-500 to-teal-600'
                }`}>
                  {message.role === 'assistant' ? <Bot className="h-4 w-4 text-white" /> : <User className="h-4 w-4 text-white" />}
                </div>
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === 'assistant' ? 'bg-slate-50 text-slate-700' : 'bg-gradient-to-r from-violet-500 to-indigo-600 text-white'
                }`}>
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {message.content.split(/(\*\*.*?\*\*)/g).map((part, i) => {
                      if (part.startsWith('**') && part.endsWith('**')) {
                        return <strong key={i} className={message.role === 'assistant' ? 'text-slate-800' : 'text-white'}>{part.slice(2, -2)}</strong>;
                      }
                      return <span key={i}>{part}</span>;
                    })}
                  </div>
                  <span className={`mt-1 block text-[10px] ${message.role === 'assistant' ? 'text-slate-400' : 'text-white/60'}`}>
                    {new Date(message.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 animate-bounce rounded-full bg-violet-400" style={{ animationDelay: '0ms' }} />
                    <div className="h-2 w-2 animate-bounce rounded-full bg-violet-400" style={{ animationDelay: '150ms' }} />
                    <div className="h-2 w-2 animate-bounce rounded-full bg-violet-400" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-slate-100 p-4">
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Ask FlowMind to construct a focused block strategy..."
                  rows={1}
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-12 text-sm outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100 focus:bg-white"
                />
              </div>
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isTyping}
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 text-white shadow-md shadow-violet-200 transition-all hover:shadow-lg disabled:opacity-50 disabled:shadow-none"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="space-y-4" style={{ height: 'calc(100vh - 16rem)', overflowY: 'auto' }}>
          {/* Break Down Tasks */}
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <ListTodo className="h-5 w-5 text-violet-500" />
              <h3 className="text-sm font-bold text-slate-800">Break Down Tasks</h3>
              <span className="text-[10px] text-slate-400 ml-auto">Decompose workflow items with one click</span>
            </div>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {activeTasks.slice(0, 8).map(task => (
                <div key={task.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-3 hover:bg-slate-50">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-slate-700 truncate">{task.title}</p>
                    <p className="text-[10px] text-slate-400">{task.estimatedMinutes}m · {task.priority}</p>
                  </div>
                  <button
                    onClick={() => createSubtasksForTask(task)}
                    className="ml-2 flex shrink-0 items-center gap-1 rounded-lg bg-violet-50 px-2.5 py-1.5 text-[10px] font-semibold text-violet-700 hover:bg-violet-100 transition-colors"
                  >
                    <Plus className="h-3 w-3" />
                    Subtasks
                  </button>
                </div>
              ))}
              {activeTasks.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-4">Create tasks to break them down</p>
              )}
            </div>
          </div>

          {/* Quick Relief */}
          <div className="rounded-2xl bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-100 p-5">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-violet-500" />
              <h3 className="text-sm font-bold text-violet-700">Quick Relief</h3>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">
              Break tasks into manageable milestones to reduce daily burnout risk. Use the subtask buttons above to decompose large tasks instantly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
