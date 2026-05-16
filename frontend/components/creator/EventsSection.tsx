"use client";

import { useEffect, useState } from "react";
import { Calendar, MapPin, Ticket, Clock, Users } from "lucide-react";
import { motion } from "framer-motion";

interface Event {
  id: string;
  title: string;
  description?: string;
  venue: string;
  date: string;
  ticketLink?: string;
}

interface EventsSectionProps {
  events: Event[];
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function CountdownTimer({ targetDate }: { targetDate: string }) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const calcTime = () => {
      const now = Date.now();
      const target = new Date(targetDate).getTime();
      const diff = target - now;

      if (diff <= 0) {
        setExpired(true);
        return;
      }

      setExpired(false);
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };

    calcTime();
    const interval = setInterval(calcTime, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  if (expired) {
    return (
      <div className="text-green-400 font-semibold text-sm flex items-center gap-1 justify-center">
        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        LIVE NOW
      </div>
    );
  }

  const pad = (n: number) => n.toString().padStart(2, "0");

  return (
    <div className="flex gap-2 justify-center">
      {[
        { label: "Days", value: timeLeft.days },
        { label: "Hrs", value: timeLeft.hours },
        { label: "Min", value: timeLeft.minutes },
        { label: "Sec", value: timeLeft.seconds },
      ].map((unit, i) => (
        <div key={unit.label} className="flex items-center gap-1">
          <div className="text-center">
            <div className="text-xl md:text-2xl font-bold text-gold tabular-nums leading-tight">
              {pad(unit.value)}
            </div>
            <div className="text-white/30 text-[10px] uppercase tracking-wider">
              {unit.label}
            </div>
          </div>
          {i < 3 && (
            <span className="text-gold/50 text-xl font-light -mt-3">:</span>
          )}
        </div>
      ))}
    </div>
  );
}

export default function EventsSection({ events }: EventsSectionProps) {
  if (!events || events.length === 0) return null;

  // Sort by soonest
  const sorted = [...events].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return (
    <section className="py-12 md:py-16 px-4 bg-black/30">
      <div className="container mx-auto max-w-6xl">
        <h2 className="text-2xl md:text-3xl font-bold text-gold mb-8 text-center flex items-center justify-center gap-2">
          <Ticket size={24} className="text-gold" /> Upcoming Shows
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {sorted.map((event, idx) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ y: -3 }}
              className="glass-card rounded-xl p-5 text-center flex flex-col items-center gap-3"
            >
              <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center">
                <Calendar size={22} className="text-gold" />
              </div>

              <h3 className="text-white font-bold text-lg line-clamp-1">
                {event.title}
              </h3>

              <div className="flex items-center gap-1.5 text-white/50 text-xs">
                <MapPin size={13} className="text-gold/60" />
                <span className="line-clamp-1">{event.venue}</span>
              </div>

              <div className="flex items-center gap-1.5 text-white/40 text-xs">
                <Clock size={13} className="text-gold/60" />
                {new Date(event.date).toLocaleDateString("en-ZA", {
                  weekday: "short",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>

              <div className="my-2">
                <CountdownTimer targetDate={event.date} />
              </div>

              {event.ticketLink ? (
                <a
                  href={event.ticketLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-gold to-gold-dark text-black font-semibold rounded-full text-sm hover:shadow-lg hover:shadow-gold/20 transition-all"
                >
                  <Ticket size={14} /> Get Tickets
                </a>
              ) : (
                <span className="text-white/30 text-xs flex items-center gap-1">
                  <Users size={14} /> Tickets coming soon
                </span>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}