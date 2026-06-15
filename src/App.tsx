import { useEffect, useMemo, useRef, useState } from 'react';
import { Page } from './types';
import { useStore } from './store';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import SmartTasks from './components/SmartTasks';
import FocusTimer from './components/FocusTimer';
import QuickCapture from './components/QuickCapture';
import Analytics from './components/Analytics';
import CalendarView from './components/CalendarView';
import AIPlanner from './components/AIPlanner';
import NewAIAssistant from './components/NewAIAssistant';
import AuthPage, { RegisteredUser } from './components/AuthPage';
import ChangePasswordModal from './components/ChangePasswordModal';
import { ToastContainer, ToastItem, ToastType } from './components/Toast';
import {
  Bell,
  Search,
  Menu,
  CheckCheck,
  X,
  LogOut,
  KeyRound,
} from 'lucide-react';
import {
  saveRegisteredUsers,
  loadRegisteredUsers,
  saveLastUser,
  loadLastUser,
  saveUserData,
  loadUserData,
} from './storage';

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  unread: boolean;
  tone: 'violet' | 'emerald' | 'amber';
}

const initialNotifications: NotificationItem[] = [
  {
    id: 'n1',
    title: 'AI planning suggestion ready',
    description: 'FlowMind created a better schedule for your high-priority tasks.',
    time: '2m ago',
    unread: true,
    tone: 'violet',
  },
  {
    id: 'n2',
    title: 'Focus streak updated',
    description: 'You completed 2 deep work sessions today. Keep it going!',
    time: '18m ago',
    unread: true,
    tone: 'emerald',
  },
  {
    id: 'n3',
    title: 'Task deadline approaching',
    description: 'Prepare Q4 Product Roadmap is due soon. Consider starting it now.',
    time: '1h ago',
    unread: true,
    tone: 'amber',
  },
];

export default function App() {
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [activePage, setActivePage] = useState<Page>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [registeredUsers, setRegisteredUsers] = useState<RegisteredUser[]>(() => loadRegisteredUsers());
  const profileRef = useRef<HTMLDivElement | null>(null);
  const notificationRef = useRef<HTMLDivElement | null>(null);
  const dataLoadedRef = useRef(false);
  const store = useStore();

  // Auto-restore last logged-in user on mount
  useEffect(() => {
    const lastEmail = loadLastUser();
    if (lastEmail) {
      const u = registeredUsers.find(r => r.email === lastEmail);
      if (u) {
        setUser({ name: u.name, email: u.email });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load user data when user logs in
  useEffect(() => {
    if (!user) return;
    // Block saving until we've finished loading this user's data
    dataLoadedRef.current = false;
    const data = loadUserData(user.email);
    if (data) {
      // Returning user — restore all their saved state
      store.restoreTasks(Array.isArray(data.tasks) ? (data.tasks as import('./types').Task[]) : []);
      store.restoreSessions(Array.isArray(data.sessions) ? (data.sessions as import('./types').FocusSession[]) : []);
      store.restoreNotes(Array.isArray(data.notes) ? (data.notes as import('./types').QuickNote[]) : []);
      store.restoreMessages(Array.isArray(data.messages) ? (data.messages as import('./types').AIMessage[]) : []);
      store.restoreCalendarSlots(Array.isArray(data.calendarSlots) ? (data.calendarSlots as import('./types').CalendarSlot[]) : []);
      setNotifications(Array.isArray(data.notifications) ? (data.notifications as NotificationItem[]) : []);
    } else {
      // Brand-new user — start with a clean slate (prevents seeing another user's data)
      store.restoreTasks([]);
      store.restoreSessions([]);
      store.restoreNotes([]);
      store.restoreMessages([]);
      store.restoreCalendarSlots([]);
      setNotifications([]);
    }
    // Allow saving again after the restore has been applied
    const enableSave = setTimeout(() => {
      dataLoadedRef.current = true;
    }, 50);
    return () => clearTimeout(enableSave);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email]);

  // Persist user data whenever it changes (only after load completes)
  useEffect(() => {
    if (!user) return;
    if (!dataLoadedRef.current) return; // don't overwrite saved data during login transition
    saveUserData(user.email, {
      tasks: store.tasks,
      sessions: store.sessions,
      notes: store.notes,
      messages: store.messages,
      calendarSlots: store.calendarSlots,
      notifications,
    });
  }, [user, store.tasks, store.sessions, store.notes, store.messages, store.calendarSlots, notifications]);

  // Toast helpers
  const showToast = (type: ToastType, message: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, type, message }]);
  };

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Notification helper
  const addNotification = (title: string, description: string, tone: 'violet' | 'emerald' | 'amber' = 'violet') => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [{
      id,
      title,
      description,
      time: 'Just now',
      unread: true,
      tone,
    }, ...prev]);
  };

  // Wrap store mutations to also add notifications
  const addTaskWithNotification = (task: Parameters<typeof store.addTask>[0]) => {
    store.addTask(task);
    addNotification('New task added', `"${task.title}" was added to your tasks.`, 'violet');
    showToast('success', `Task "${task.title}" added!`);
  };

  const deleteTaskWithNotification = (id: string) => {
    const task = store.tasks.find(t => t.id === id);
    store.deleteTask(id);
    if (task) {
      addNotification('Task deleted', `"${task.title}" was removed.`, 'amber');
    }
  };

  const updateTaskWithNotification = (id: string, updates: Parameters<typeof store.updateTask>[1]) => {
    store.updateTask(id, updates);
    if (updates.status === 'done') {
      const task = store.tasks.find(t => t.id === id);
      if (task) {
        addNotification('Task completed', `"${task.title}" marked as done! 🎉`, 'emerald');
        showToast('success', `"${task.title}" completed!`);
      }
    }
  };

  // Check for approaching deadlines on mount and periodically
  useEffect(() => {
    if (!user) return;
    const checkDeadlines = () => {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      store.tasks.forEach(task => {
        if (task.status === 'done') return;
        if (task.dueDate === tomorrowStr) {
          // Only add if not already notified (check by title)
          const alreadyNotified = notifications.some(n =>
            n.title === 'Deadline approaching' && n.description.includes(task.title)
          );
          if (!alreadyNotified) {
            addNotification('Deadline approaching', `"${task.title}" is due tomorrow!`, 'amber');
          }
        }
      });
    };
    const timer = setTimeout(checkDeadlines, 1500);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const unreadCount = useMemo(
    () => notifications.filter((item) => item.unread).length,
    [notifications],
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setNotificationsOpen(false);
      }
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    // Flush current data to storage before signing out
    if (user && dataLoadedRef.current) {
      saveUserData(user.email, {
        tasks: store.tasks,
        sessions: store.sessions,
        notes: store.notes,
        messages: store.messages,
        calendarSlots: store.calendarSlots,
        notifications,
      });
    }
    dataLoadedRef.current = false;
    showToast('info', 'You have been signed out');
    setUser(null);
    saveLastUser(null);
    setProfileOpen(false);
    setActivePage('dashboard');
  };

  const registerUser = (newUser: RegisteredUser) => {
    const updated = [...registeredUsers, newUser];
    setRegisteredUsers(updated);
    saveRegisteredUsers(updated);
  };

  const updateUserPassword = (email: string, newPassword: string) => {
    const updated = registeredUsers.map(u =>
      u.email === email ? { ...u, password: newPassword } : u
    );
    setRegisteredUsers(updated);
    saveRegisteredUsers(updated);
  };

  const handleAuthenticated = (name: string, email: string) => {
    setUser({ name, email });
    saveLastUser(email);
  };

  const openChangePassword = () => {
    setProfileOpen(false);
    setShowChangePassword(true);
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, unread: false })));
  };

  const openNotification = (id: string) => {
    setNotifications((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, unread: false } : item,
      ),
    );
  };

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((item) => item.id !== id));
  };

  // Burnout detection score
  const burnoutScore = useMemo(() => {
    const activeCount = store.tasks.filter(t => t.status !== 'done').length;
    const urgentCount = store.tasks.filter(t => t.priority === 'urgent' && t.status !== 'done').length;
    const totalSessions = store.sessions.filter(s => {
      const d = new Date();
      const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      return s.completedAt.startsWith(today);
    }).length;
    const score = Math.min(100, Math.round(
      (activeCount / Math.max(store.tasks.length, 1)) * 40 +
      (urgentCount * 12) +
      (totalSessions > 5 ? 0 : (5 - totalSessions) * 5)
    ));
    return score;
  }, [store.tasks, store.sessions]);

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return (
          <Dashboard
            tasks={store.tasks}
            sessions={store.sessions}
            burnoutScore={burnoutScore}
            onNavigate={(page) => setActivePage(page as Page)}
          />
        );
      case 'tasks':
        return (
          <SmartTasks
            tasks={store.tasks}
            onAddTask={addTaskWithNotification}
            onUpdateTask={updateTaskWithNotification}
            onDeleteTask={deleteTaskWithNotification}
          />
        );
      case 'focus':
        return (
          <FocusTimer
            tasks={store.tasks}
            sessions={store.sessions}
            onAddSession={store.addSession}
          />
        );
      case 'planner':
        return (
          <AIPlanner
            tasks={store.tasks}
            onAddTask={addTaskWithNotification}
            onApplyToCalendar={store.setCalendarSlots}
            onNavigate={(page) => setActivePage(page as Page)}
            onToast={showToast}
            onAddNotification={addNotification}
          />
        );
      case 'assistant':
        return (
          <NewAIAssistant
            messages={store.messages}
            tasks={store.tasks}
            onAddMessage={store.addMessage}
            onAddTask={store.addTask}
          />
        );
      case 'calendar':
        return (
          <CalendarView
            slots={store.calendarSlots}
            onClear={store.clearCalendar}
            onNavigateToPlanner={() => setActivePage('assistant')}
          />
        );
      case 'capture':
        return (
          <QuickCapture
            notes={store.notes}
            onAddNote={store.addNote}
            onDeleteNote={store.deleteNote}
          />
        );
      case 'analytics':
        return (
          <Analytics
            tasks={store.tasks}
            sessions={store.sessions}
            notes={store.notes}
          />
        );
      default:
        return null;
    }
  };

  // Auth gate — show login/signup if not authenticated
  if (!user) {
    return (
      <>
        <AuthPage
          registeredUsers={registeredUsers}
          onRegister={registerUser}
          onUpdatePassword={updateUserPassword}
          onAuthenticated={handleAuthenticated}
          onToast={showToast}
        />
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-indigo-50">
      <div className="hidden lg:block">
        <Sidebar activePage={activePage} onPageChange={setActivePage} />
      </div>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative z-10">
            <Sidebar
              activePage={activePage}
              onPageChange={(page) => {
                setActivePage(page);
                setMobileMenuOpen(false);
              }}
            />
          </div>
        </div>
      )}

      <div className="lg:pl-[220px]">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-violet-100 bg-white/70 px-4 py-3 backdrop-blur-xl lg:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search tasks, notes, or ask AI..."
                className="w-64 rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100 focus:bg-white"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setNotificationsOpen((prev) => !prev)}
                className={`relative flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${
                  notificationsOpen
                    ? 'bg-violet-100 text-violet-700'
                    : 'bg-violet-50 text-violet-600 hover:bg-violet-100'
                }`}
                aria-label="Open notifications"
                aria-expanded={notificationsOpen}
              >
                <Bell className="h-[18px] w-[18px]" />
                {unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 top-12 z-40 w-[330px] overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-xl shadow-violet-100/60">
                  <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                    <div>
                      <p className="text-sm font-bold text-slate-800">Notifications</p>
                      <p className="text-[11px] text-slate-400">
                        {unreadCount > 0 ? `${unreadCount} unread updates` : 'All caught up'}
                      </p>
                    </div>
                    <button
                      onClick={markAllNotificationsRead}
                      className="inline-flex items-center gap-1 rounded-lg bg-violet-50 px-2.5 py-1 text-[11px] font-semibold text-violet-700 hover:bg-violet-100"
                    >
                      <CheckCheck className="h-3.5 w-3.5" />
                      Mark all read
                    </button>
                  </div>

                  <div className="max-h-[360px] overflow-y-auto p-2">
                    {notifications.length > 0 ? (
                      notifications.map((item) => {
                        const toneClasses = {
                          violet: 'bg-violet-100 text-violet-600',
                          emerald: 'bg-emerald-100 text-emerald-600',
                          amber: 'bg-amber-100 text-amber-600',
                        };

                        return (
                          <div
                            key={item.id}
                            onClick={() => openNotification(item.id)}
                            className={`group mb-2 rounded-xl border p-3 transition-all hover:border-violet-200 hover:bg-violet-50/40 ${
                              item.unread
                                ? 'border-violet-100 bg-violet-50/60'
                                : 'border-slate-100 bg-white'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${toneClasses[item.tone]}`}>
                                <Bell className="h-4 w-4" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <p className="text-sm font-semibold text-slate-700">{item.title}</p>
                                    <p className="mt-1 text-xs leading-relaxed text-slate-500">
                                      {item.description}
                                    </p>
                                  </div>
                                  <button
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      dismissNotification(item.id);
                                    }}
                                    className="rounded-lg p-1 text-slate-300 opacity-0 transition-all hover:bg-rose-50 hover:text-rose-500 group-hover:opacity-100"
                                    aria-label="Dismiss notification"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                                <div className="mt-2 flex items-center justify-between">
                                  <span className="text-[11px] text-slate-400">{item.time}</span>
                                  {item.unread && (
                                    <span className="rounded-full bg-violet-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                                      New
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 px-4 py-10 text-center">
                        <Bell className="h-8 w-8 text-slate-300" />
                        <p className="mt-3 text-sm font-semibold text-slate-500">No notifications left</p>
                        <p className="mt-1 text-xs text-slate-400">
                          You're all caught up for now.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen((prev) => !prev)}
                className={`flex items-center gap-2 rounded-xl px-3 py-1.5 transition-colors ${
                  profileOpen ? 'bg-violet-100' : 'bg-violet-50 hover:bg-violet-100'
                }`}
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 text-xs font-bold text-white">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="hidden text-sm font-medium text-slate-700 sm:block">{user.name}</span>
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-12 z-40 w-64 overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-xl shadow-violet-100/60">
                  <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-sm font-bold text-white">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-800">{user.name}</p>
                      <p className="truncate text-[11px] text-slate-400">{user.email}</p>
                    </div>
                  </div>
                  <div className="p-2 space-y-1">
                    <button
                      onClick={openChangePassword}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-violet-50 hover:text-violet-700"
                    >
                      <KeyRound className="h-4 w-4" />
                      Change Password
                    </button>
                    <div className="h-px bg-slate-100 my-1" />
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-6">
          {renderPage()}
        </main>
      </div>
      {user && (
        <ChangePasswordModal
          isOpen={showChangePassword}
          onClose={() => setShowChangePassword(false)}
          userEmail={user.email}
          currentPassword={registeredUsers.find(u => u.email === user.email)?.password ?? ''}
          onUpdatePassword={updateUserPassword}
          onToast={showToast}
        />
      )}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
