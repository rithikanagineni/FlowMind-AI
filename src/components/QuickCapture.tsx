import { useState } from 'react';
import { QuickNote } from '../types';
import {
  Lightbulb,
  Plus,
  Tag,
  Trash2,
  Sparkles,
  FileText,
  Search,
} from 'lucide-react';

interface QuickCaptureProps {
  notes: QuickNote[];
  onAddNote: (note: Omit<QuickNote, 'id' | 'createdAt'>) => void;
  onDeleteNote: (id: string) => void;
}

export default function QuickCapture({ notes, onAddNote, onDeleteNote }: QuickCaptureProps) {
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [isIdea, setIsIdea] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleAdd = () => {
    if (!content.trim()) return;
    onAddNote({
      content: content.trim(),
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      isIdea,
    });
    setContent('');
    setTags('');
    setIsIdea(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleAdd();
    }
  };

  const filteredNotes = notes.filter(note => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return note.content.toLowerCase().includes(q) ||
           note.tags.some(t => t.toLowerCase().includes(q));
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const ideas = notes.filter(n => n.isIdea);
  const totalTags = [...new Set(notes.flatMap(n => n.tags))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Quick Capture 💡</h1>
        <p className="mt-1 text-sm text-slate-500">Capture ideas and notes instantly — never lose a thought</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Capture Input */}
        <div className="space-y-4 lg:col-span-2">
          {/* Main Input Card */}
          <div className="rounded-2xl border border-violet-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <h2 className="text-base font-bold text-slate-800">New Capture</h2>
            </div>

            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="What's on your mind? Capture a thought, idea, meeting note, or task..."
              rows={4}
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition-all focus:border-violet-300 focus:ring-2 focus:ring-violet-100 focus:bg-white"
            />

            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex-1">
                <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  <Tag className="h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={tags}
                    onChange={e => setTags(e.target.value)}
                    placeholder="Tags (comma separated)"
                    className="flex-1 bg-transparent text-sm outline-none"
                  />
                </div>
              </div>
              <button
                onClick={() => setIsIdea(!isIdea)}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  isIdea
                    ? 'bg-amber-100 text-amber-700 border border-amber-200'
                    : 'bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Lightbulb className={`h-4 w-4 ${isIdea ? 'text-amber-500' : ''}`} />
                Mark as Idea
              </button>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Tip: Press ⌘+Enter to save quickly
              </span>
              <button
                onClick={handleAdd}
                disabled={!content.trim()}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-violet-200 transition-all hover:shadow-lg disabled:opacity-50 disabled:shadow-none"
              >
                <Plus className="h-4 w-4" />
                Save Capture
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search notes and ideas..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
            />
          </div>

          {/* Notes List */}
          <div className="space-y-3">
            {filteredNotes.map(note => (
              <div
                key={note.id}
                className={`group rounded-2xl border p-4 transition-all hover:shadow-md ${
                  note.isIdea
                    ? 'border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50'
                    : 'border-slate-100 bg-white'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {note.isIdea ? (
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100">
                        <Lightbulb className="h-4 w-4 text-amber-600" />
                      </div>
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
                        <FileText className="h-4 w-4 text-blue-600" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-slate-700 leading-relaxed">{note.content}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {note.tags.map(tag => (
                          <span key={tag} className="rounded-md bg-violet-50 px-2 py-0.5 text-[10px] font-medium text-violet-600">
                            #{tag}
                          </span>
                        ))}
                        <span className="text-[10px] text-slate-400">
                          {new Date(note.createdAt).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => onDeleteNote(note.id)}
                    className="rounded-lg p-1.5 text-slate-300 opacity-0 transition-all hover:bg-rose-50 hover:text-rose-500 group-hover:opacity-100"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}

            {filteredNotes.length === 0 && (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-12">
                <Lightbulb className="h-10 w-10 text-slate-200" />
                <p className="mt-3 text-sm text-slate-400">
                  {searchQuery ? 'No notes match your search' : 'No captures yet — start capturing ideas!'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Stats */}
        <div className="space-y-4">
          {/* Quick Stats */}
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800">Capture Stats</h3>
            <div className="mt-3 space-y-3">
              <div className="flex items-center justify-between rounded-xl bg-violet-50 p-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-violet-500" />
                  <span className="text-xs text-slate-600">Total Notes</span>
                </div>
                <span className="text-sm font-bold text-slate-800">{notes.length}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-amber-50 p-3">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                  <span className="text-xs text-slate-600">Ideas</span>
                </div>
                <span className="text-sm font-bold text-slate-800">{ideas.length}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-blue-50 p-3">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-blue-500" />
                  <span className="text-xs text-slate-600">Unique Tags</span>
                </div>
                <span className="text-sm font-bold text-slate-800">{totalTags.length}</span>
              </div>
            </div>
          </div>

          {/* Popular Tags */}
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800">Popular Tags</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {totalTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setSearchQuery(tag)}
                  className="rounded-lg bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-600 transition-colors hover:bg-violet-100"
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>

          {/* AI Suggestion */}
          <div className="rounded-2xl bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-100 p-5">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-violet-500" />
              <h3 className="text-sm font-bold text-violet-700">AI Insight</h3>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">
              Your most productive idea capture time is <strong>between 8-10 AM</strong>. 
              Consider setting a daily reminder to capture thoughts during this window.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
