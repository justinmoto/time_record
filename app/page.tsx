"use client";

import { useState, useEffect, useCallback } from "react";
import {
  LogIn,
  LogOut,
  Plus,
  Trash2,
  Check,
  Clock,
  Calendar,
  Sparkles,
  ListTodo,
  X,
  Maximize2,
  Pencil,
} from "lucide-react";

type Status = { timedIn: boolean };
type HistoryItem = { date: string; timeIn: string; timeOut: string; totalHours: string | number; totalHoursDisplay?: string; dateRaw?: string };
type Summary = { today: number; week: number; month: number; total: number };

const HOURS_GOAL = 200;
type Todo = { id: number; task: string; isCompleted: boolean; completedAt: string | null };

const MOTIVATIONAL_QUOTES = [
  "The only way to do great work is to love what you do.",
  "Start where you are. Use what you have. Do what you can.",
  "Small steps every day lead to big results.",
  "Progress, not perfection.",
  "You are capable of more than you know.",
  "Today is a new opportunity to make it count.",
  "Focus on progress, not perfection.",
  "Your future is created by what you do today.",
  "One step at a time is still progress.",
  "Make today count.",
  "Every moment is a fresh beginning.",
  "You've got this!",
  "Do it now. Sometimes later becomes never.",
  "Believe you can and you're halfway there.",
  "The best time to start was yesterday. The next best time is now.",
];

function getQuoteOfDay() {
  const start = new Date(new Date().getFullYear(), 0, 0);
  const now = new Date();
  const dayOfYear = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return MOTIVATIONAL_QUOTES[dayOfYear % MOTIVATIONAL_QUOTES.length];
}

function formatHours(h: number): string {
  const hrs = Math.floor(h);
  const mins = Math.round((h - hrs) * 60);
  return mins === 0 ? `${hrs}hrs` : `${hrs}hrs ${mins}mins`;
}

function formatHoursShort(h: number): string {
  const hrs = Math.floor(h);
  const mins = Math.round((h - hrs) * 60);
  return mins === 0 ? `${hrs}h` : `${hrs}h ${mins}m`;
}

function getCurrentTimeStr(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function getCurrentDateStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function Home() {
  const [status, setStatus] = useState<Status | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [todoInput, setTodoInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [quote] = useState(() => getQuoteOfDay());
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [timeModalOpen, setTimeModalOpen] = useState(false);
  const [timeModalType, setTimeModalType] = useState<"in" | "out">("in");
  const [timeInput, setTimeInput] = useState("");
  const [dateInput, setDateInput] = useState("");
  const [editingTodoId, setEditingTodoId] = useState<number | null>(null);
  const [editingTask, setEditingTask] = useState("");

  const fetchStatus = useCallback(async () => {
    try {
      const today = getCurrentDateStr();
      const res = await fetch(`/api/current-status?date=${today}&_=${Date.now()}`, { cache: "no-store" });
      if (res.ok) setStatus(await res.json());
    } catch {
      setError("Failed to load status");
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/history");
      if (res.ok) setHistory(await res.json());
    } catch {
      setError("Failed to load history");
    }
  }, []);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await fetch("/api/summary");
      if (res.ok) setSummary(await res.json());
    } catch {
      setError("Failed to load summary");
    }
  }, []);

  const fetchTodos = useCallback(async () => {
    try {
      const res = await fetch("/api/todos");
      if (res.ok) setTodos(await res.json());
    } catch {
      setError("Failed to load todos");
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      await Promise.all([fetchStatus(), fetchHistory(), fetchSummary(), fetchTodos()]);
      setLoading(false);
    };
    load();
  }, [fetchStatus, fetchHistory, fetchSummary, fetchTodos]);

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (timeModalOpen) setTimeModalOpen(false);
        else if (historyModalOpen) setHistoryModalOpen(false);
      }
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [historyModalOpen, timeModalOpen]);

  const refreshAll = useCallback(async () => {
    await Promise.all([fetchStatus(), fetchHistory(), fetchSummary()]);
  }, [fetchStatus, fetchHistory, fetchSummary]);

  const openTimeModal = (type: "in" | "out") => {
    setTimeModalType(type);
    setTimeInput(getCurrentTimeStr());
    setDateInput(getCurrentDateStr());
    setTimeModalOpen(true);
    setError(null);
  };

  const handleTimeInSubmit = async () => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/time-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ time: timeInput, date: dateInput }),
      });
      if (res.ok) {
        setTimeModalOpen(false);
        await refreshAll();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to time in");
        if (data.error === "Already timed in today") {
          setStatus({ timedIn: true });
        } else {
          fetchStatus();
        }
      }
    } catch {
      setError("Failed to time in");
    }
    setActionLoading(false);
  };

  const handleTimeOutSubmit = async () => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/time-out", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ time: timeInput }),
      });
      if (res.ok) {
        setTimeModalOpen(false);
        await refreshAll();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to time out");
        fetchStatus();
      }
    } catch {
      setError("Failed to time out");
    }
    setActionLoading(false);
  };

  const handleAddTodo = async () => {
    const task = todoInput.trim();
    if (!task) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task }),
      });
      if (res.ok) {
        setTodoInput("");
        fetchTodos();
      }
    } catch {
      setError("Failed to add todo");
    }
    setActionLoading(false);
  };

  const handleToggleTodo = async (id: number, isCompleted: boolean) => {
    try {
      const res = await fetch(`/api/todos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCompleted }),
      });
      if (res.ok) fetchTodos();
    } catch {
      setError("Failed to update todo");
    }
  };

  const handleDeleteTodo = async (id: number) => {
    try {
      const res = await fetch(`/api/todos/${id}`, { method: "DELETE" });
      if (res.ok) fetchTodos();
    } catch {
      setError("Failed to delete todo");
    }
  };

  const handleEditTodo = (todo: Todo) => {
    setEditingTodoId(todo.id);
    setEditingTask(todo.task);
  };

  const handleSaveEdit = async () => {
    if (editingTodoId === null) return;
    const task = editingTask.trim();
    if (!task) {
      handleCancelEdit();
      return;
    }
    const todo = todos.find((x) => x.id === editingTodoId);
    if (todo && todo.task === task) {
      handleCancelEdit();
      return;
    }
    try {
      const res = await fetch(`/api/todos/${editingTodoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task }),
      });
      if (res.ok) {
        fetchTodos();
        setEditingTodoId(null);
        setEditingTask("");
      }
    } catch {
      setError("Failed to update todo");
    }
  };

  const handleCancelEdit = () => {
    setEditingTodoId(null);
    setEditingTask("");
  };

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#4C1D95]/30 border-t-[#4C1D95] rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="h-screen overflow-y-auto overflow-x-hidden md:overflow-hidden md:flex md:flex-col bg-[#F9FAFB] overscroll-contain" 
      style={{ 
        paddingTop: "env(safe-area-inset-top)", 
        paddingBottom: "env(safe-area-inset-bottom)", 
        paddingLeft: "env(safe-area-inset-left)", 
        paddingRight: "env(safe-area-inset-right)",
        WebkitOverflowScrolling: "touch",
        touchAction: "pan-y"
      }}
    >
      <main className="py-4 px-4 pb-8 md:flex-1 md:overflow-hidden md:min-h-0">
        <div className="max-w-4xl mx-auto w-full md:h-full md:flex md:flex-col md:min-h-0">
          <div className="shrink-0 mb-4">
            <h1 className="text-xl font-semibold text-gray-800">Hi! Chryssa</h1>
            <p className="text-sm text-gray-500">{today}</p>
          </div>

          <div className="shrink-0 flex items-center gap-2 p-3 rounded-xl bg-[#4C1D95]/5 border border-[#4C1D95]/10 mb-4">
          <Sparkles className="w-5 h-5 text-[#4C1D95] shrink-0 mt-0.5" />
          <p className="text-sm text-gray-700 italic">&ldquo;{quote}&rdquo;</p>
        </div>

        {error && (
          <div className="shrink-0 mb-4 rounded-xl bg-red-50 text-red-700 px-4 py-2.5 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:flex-1 md:min-h-0 md:overflow-hidden">
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 order-2 md:order-2 md:flex md:flex-col md:min-h-0 md:overflow-hidden min-w-0">
          <div className="flex items-center gap-2 mb-1 shrink-0">
            <Clock className="w-5 h-5 text-[#4C1D95]" />
            <h2 className="text-lg font-semibold text-gray-800">Daily Time Tracker</h2>
          </div>
          <p className="text-sm text-gray-500 mb-2 shrink-0">{status?.timedIn ? "Timed in today" : "Not Timed In"}</p>

          <div className="flex gap-2 mb-3 shrink-0">
            {!status?.timedIn ? (
              <button
                onClick={() => openTimeModal("in")}
                disabled={actionLoading}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium text-white bg-[#4C1D95] hover:bg-[#5B21B6] disabled:opacity-60 disabled:cursor-not-allowed transition-all"
              >
                <LogIn className="w-4 h-4" />
                Time In
              </button>
            ) : (
              <button
                onClick={() => openTimeModal("out")}
                disabled={actionLoading}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium text-white bg-red-500 hover:bg-red-600 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
              >
                <LogOut className="w-4 h-4" />
                Time Out
              </button>
            )}
          </div>

          {summary && (
            <>
              <div className="mt-4 p-4 rounded-xl bg-[#4C1D95]/5 border border-[#4C1D95]/10 shrink-0">
                <p className="text-xs text-gray-500 font-medium mb-1">Total Hours</p>
                <p className="text-2xl font-bold text-[#4C1D95]">{formatHours(summary.total)}</p>
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Goal: {HOURS_GOAL}h</span>
                    <span>{Math.min(100, Math.round(((summary.total || 0) / HOURS_GOAL) * 100))}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#4C1D95] rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, ((summary.total || 0) / HOURS_GOAL) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3 shrink-0">
                <div className="text-center p-3 rounded-xl bg-gray-50 min-h-[72px] flex flex-col justify-center">
                  <p className="text-xs text-gray-500 font-medium mb-0.5">Today</p>
                  <p className="text-sm sm:text-base font-semibold text-[#4C1D95] whitespace-nowrap overflow-hidden text-ellipsis" title={formatHours(summary.today)}>{formatHoursShort(summary.today)}</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-gray-50 min-h-[72px] flex flex-col justify-center">
                  <p className="text-xs text-gray-500 font-medium mb-0.5">This Week</p>
                  <p className="text-sm sm:text-base font-semibold text-[#4C1D95] whitespace-nowrap overflow-hidden text-ellipsis" title={formatHours(summary.week)}>{formatHoursShort(summary.week)}</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-gray-50 min-h-[72px] flex flex-col justify-center">
                  <p className="text-xs text-gray-500 font-medium mb-0.5">This Month</p>
                  <p className="text-sm sm:text-base font-semibold text-[#4C1D95] whitespace-nowrap overflow-hidden text-ellipsis" title={formatHours(summary.month)}>{formatHoursShort(summary.month)}</p>
                </div>
              </div>
            </>
          )}

          <div className="mt-4 md:flex-1 md:min-h-0 md:flex md:flex-col">
            <div className="flex items-center justify-between mb-2 shrink-0">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <h3 className="text-sm font-medium text-gray-600">History</h3>
              </div>
              {history.length > 0 && (
                <button
                  onClick={() => setHistoryModalOpen(true)}
                  className="flex items-center gap-1.5 text-xs font-medium text-[#4C1D95] hover:text-[#5B21B6] transition-colors"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  View All
                </button>
              )}
            </div>
            <div className="space-y-2 pr-1 md:flex-1 md:overflow-y-auto md:overflow-x-hidden md:min-h-0 overscroll-contain" style={{ WebkitOverflowScrolling: "touch" }}>
              {history.length === 0 ? (
                <p className="py-8 text-center text-gray-400 text-sm">No records yet</p>
              ) : (
                history.slice(0, 5).map((h, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-3 py-2.5 px-3 rounded-lg bg-gray-50/80"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{h.date}</p>
                      <p className="text-xs text-gray-500">
                        {h.timeIn} → {h.timeOut}
                      </p>
                    </div>
                    <span className="shrink-0 px-2.5 py-1 rounded-md bg-[#4C1D95]/10 text-[#4C1D95] text-sm font-semibold">
                      {h.totalHoursDisplay ?? (h.totalHours === "-" ? "-" : `${h.totalHours}h`)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

        </section>

        <section className="bg-white rounded-2xl shadow-md border-2 border-[#4C1D95]/20 p-5 order-first md:order-first md:flex md:flex-col md:min-h-0 md:overflow-hidden min-w-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ListTodo className="w-5 h-5 text-[#4C1D95]" />
              <h2 className="text-lg font-semibold text-gray-800">Todo List</h2>
            </div>
            {todos.length > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-[#4C1D95]/10 text-[#4C1D95] text-xs font-semibold">
                {todos.filter((t) => !t.isCompleted).length} active
              </span>
            )}
          </div>
          <div className="flex gap-2 mb-3 min-w-0">
            <input
              type="text"
              value={todoInput}
              onChange={(e) => setTodoInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddTodo()}
              placeholder="Add a task..."
              className="flex-1 min-w-0 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4C1D95]/20 focus:border-[#4C1D95] transition-all"
            />
            <button
              onClick={handleAddTodo}
              disabled={actionLoading || !todoInput.trim()}
              className="shrink-0 flex items-center justify-center gap-1 px-3 py-2.5 rounded-xl font-medium text-white bg-[#4C1D95] hover:bg-[#5B21B6] disabled:opacity-60 disabled:cursor-not-allowed transition-all"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add</span>
            </button>
          </div>
          <ul className="space-y-2 md:flex-1 md:overflow-y-auto md:overflow-x-hidden md:min-h-0 overscroll-contain" style={{ WebkitOverflowScrolling: "touch" }}>
            {todos.length === 0 ? (
              <li className="py-8 text-center text-gray-400 text-sm">No tasks yet</li>
            ) : (
              todos.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center gap-2 py-2 px-2 rounded-lg hover:bg-gray-50/80 group"
                >
                  <button
                    onClick={() => handleToggleTodo(t.id, !t.isCompleted)}
                    className={`flex items-center justify-center w-6 h-6 rounded-lg border-2 transition-all shrink-0 ${
                      t.isCompleted
                        ? "bg-[#4C1D95] border-[#4C1D95] text-white"
                        : "border-gray-300 hover:border-[#4C1D95]/50"
                    }`}
                  >
                    {t.isCompleted && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                  </button>
                  <div className="flex-1 min-w-0">
                    {editingTodoId === t.id ? (
                      <input
                        type="text"
                        value={editingTask}
                        onChange={(e) => setEditingTask(e.target.value)}
                        onBlur={handleSaveEdit}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveEdit();
                          if (e.key === "Escape") handleCancelEdit();
                        }}
                        className="w-full px-2 py-1 text-sm border border-[#4C1D95]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4C1D95]/20"
                        autoFocus
                      />
                    ) : (
                      <>
                        <span
                          onClick={() => handleEditTodo(t)}
                          className={`text-sm ${t.isCompleted ? "line-through text-gray-400 cursor-pointer" : "text-gray-700 cursor-pointer"}`}
                        >
                          {t.task}
                        </span>
                        {t.isCompleted && t.completedAt && (
                          <p className="text-xs text-gray-400 mt-0.5">Done {t.completedAt}</p>
                        )}
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-all">
                    {editingTodoId !== t.id && (
                      <button
                        onClick={() => handleEditTodo(t)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-[#4C1D95] hover:bg-[#4C1D95]/10"
                        aria-label="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteTodo(t.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50"
                      aria-label="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </li>
              ))
            )}
          </ul>
        </section>
        </div>
        </div>
      </main>

      {timeModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50"
          style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
          onClick={() => setTimeModalOpen(false)}
        >
          <div
            className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full max-w-sm p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">{timeModalType === "in" ? "Time In" : "Time Out"}</h3>
              <button
                onClick={() => setTimeModalOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              {timeModalType === "in" && (
                <div>
                  <label className="block text-xs text-gray-500 font-medium mb-1">Date</label>
                  <input
                    type="date"
                    value={dateInput}
                    onChange={(e) => setDateInput(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-[#4C1D95]/30 focus:border-[#4C1D95]"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs text-gray-500 font-medium mb-1">Time</label>
                <input
                  type="time"
                  value={timeInput}
                  onChange={(e) => setTimeInput(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-[#4C1D95]/30 focus:border-[#4C1D95]"
                />
              </div>
              <button
                onClick={timeModalType === "in" ? handleTimeInSubmit : handleTimeOutSubmit}
                disabled={actionLoading}
                className={`w-full py-2.5 rounded-lg font-medium text-white flex items-center justify-center gap-2 ${timeModalType === "in" ? "bg-[#4C1D95] hover:bg-[#5B21B6]" : "bg-red-500 hover:bg-red-600"} disabled:opacity-60 disabled:cursor-not-allowed`}
              >
                {timeModalType === "in" ? <LogIn className="w-4 h-4" /> : <LogOut className="w-4 h-4" />}
                Confirm {timeModalType === "in" ? "Time In" : "Time Out"}
              </button>
            </div>
          </div>
        </div>
      )}

      {historyModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50"
          style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
          onClick={() => setHistoryModalOpen(false)}
        >
          <div
            className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full max-w-md flex flex-col"
            style={{ maxHeight: "min(85dvh, 85vh)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-100 shrink-0">
              <h3 className="font-semibold text-gray-800">Full History</h3>
              <button
                onClick={() => setHistoryModalOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 touch-manipulation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto overflow-x-hidden p-4 space-y-2 min-h-0 overscroll-contain" style={{ WebkitOverflowScrolling: "touch" }}>
              {history.map((h, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-3 py-3 px-4 rounded-xl bg-gray-50 min-w-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-800 truncate">{h.date}</p>
                    <p className="text-xs text-gray-500 truncate">{h.timeIn} → {h.timeOut}</p>
                  </div>
                      <span className="shrink-0 px-3 py-1.5 rounded-lg bg-[#4C1D95]/10 text-[#4C1D95] text-sm font-semibold">
                        {h.totalHoursDisplay ?? (h.totalHours === "-" ? "-" : `${h.totalHours}h`)}
                      </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
