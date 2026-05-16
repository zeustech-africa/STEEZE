"use client";

import { useEffect, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight, Clock, User, MapPin } from "lucide-react";

interface ScheduledPost {
  id: string;
  title: string;
  description?: string;
  scheduledFor: string;
  creator?: { username: string; artistName: string };
  type: string;
}

const CalendarPage = () => {
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"month" | "week">("month");

  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

  const fetchPosts = async () => {
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams({
        start: startOfMonth.toISOString(),
        end: endOfMonth.toISOString(),
      });
      const res = await fetch(`/api/admin/calendar?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setPosts(data.posts || []);
    } catch (err) {
      console.error("Failed to fetch calendar:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPosts(); }, [currentDate]);

  const changeMonth = (delta: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + delta, 1));
  };

  const daysInMonth = endOfMonth.getDate();
  const startDay = startOfMonth.getDay();
  const monthName = currentDate.toLocaleString("default", { month: "long", year: "numeric" });

  const getPostsForDay = (day: number) => {
    const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toISOString().split("T")[0];
    return posts.filter((p) => p.scheduledFor?.startsWith(dateStr));
  };

  const getUpcomingPosts = () => {
    const now = new Date();
    return posts
      .filter((p) => new Date(p.scheduledFor) > now)
      .sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime())
      .slice(0, 20);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Calendar className="text-gold" size={28} /> Content Calendar
        </h1>
        <p className="text-white/50 mt-1">{posts.length} scheduled posts this month</p>
      </div>

      {/* View toggle & navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => changeMonth(-1)}
            className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 transition"
          >
            <ChevronLeft size={18} />
          </button>
          <h2 className="text-xl font-semibold text-white min-w-[180px] text-center">{monthName}</h2>
          <button
            onClick={() => changeMonth(1)}
            className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 transition"
          >
            <ChevronRight size={18} />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/50 hover:text-white text-sm transition"
          >
            Today
          </button>
        </div>
        <div className="flex gap-1 bg-white/5 rounded-lg p-1">
          <button
            onClick={() => setView("month")}
            className={`px-3 py-1.5 rounded-md text-sm transition ${view === "month" ? "bg-gold/20 text-gold" : "text-white/50"}`}
          >
            Month
          </button>
          <button
            onClick={() => setView("week")}
            className={`px-3 py-1.5 rounded-md text-sm transition ${view === "week" ? "bg-gold/20 text-gold" : "text-white/50"}`}
          >
            Week
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      {loading ? (
        <div className="glass-card p-8 animate-pulse">
          <div className="h-96 bg-white/5 rounded" />
        </div>
      ) : (
        <div className="glass-card rounded-xl overflow-hidden">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-white/10">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="p-3 text-center text-white/40 text-xs font-medium uppercase tracking-wider">
                {day}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7">
            {/* Empty cells for days before the 1st */}
            {Array.from({ length: startDay }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[100px] p-2 border-r border-b border-white/5 bg-white/[0.01]" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayPosts = getPostsForDay(day);
              const isToday =
                new Date().getDate() === day &&
                new Date().getMonth() === currentDate.getMonth() &&
                new Date().getFullYear() === currentDate.getFullYear();

              return (
                <div
                  key={day}
                  className={`min-h-[100px] p-2 border-r border-b border-white/5 hover:bg-white/[0.02] transition ${
                    isToday ? "bg-gold/5 ring-1 ring-inset ring-gold/20" : ""
                  }`}
                >
                  <div className={`text-xs font-medium mb-1 ${isToday ? "text-gold" : "text-white/50"}`}>{day}</div>
                  <div className="space-y-1">
                    {dayPosts.slice(0, 3).map((post) => (
                      <div key={post.id} className="text-xs bg-gold/10 text-gold px-1.5 py-0.5 rounded truncate" title={post.title}>
                        {post.title || "Untitled"}
                      </div>
                    ))}
                    {dayPosts.length > 3 && (
                      <div className="text-xs text-white/30">+{dayPosts.length - 3} more</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Upcoming posts list */}
      <div className="glass-card rounded-xl p-6">
        <h2 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
          <Clock size={18} className="text-gold" /> Upcoming Scheduled Posts
        </h2>

        {getUpcomingPosts().length === 0 ? (
          <p className="text-white/40 text-sm py-4">No upcoming scheduled posts.</p>
        ) : (
          <div className="space-y-2">
            {getUpcomingPosts().map((post) => (
              <div key={post.id} className="flex items-center gap-4 p-3 bg-white/5 rounded-lg hover:bg-white/[0.08] transition">
                <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center text-gold">
                  <Calendar size={18} />
                </div>
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">{post.title || "Untitled Post"}</p>
                  <div className="flex items-center gap-3 text-xs text-white/40 mt-0.5">
                    <span className="flex items-center gap-1"><User size={10} /> {post.creator?.artistName || post.creator?.username || "Unknown"}</span>
                    <span className="flex items-center gap-1"><Clock size={10} /> {new Date(post.scheduledFor).toLocaleString()}</span>
                  </div>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-400 capitalize">{post.type}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarPage;