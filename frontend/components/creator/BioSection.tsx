"use client";

import { Award, History, Sparkles, Music, Calendar } from "lucide-react";

interface BioSectionProps {
  creator: {
    bio: string;
    musicJourney?: string;
    achievements?: string[];
    category?: string;
    createdAt?: string;
    songs?: any[];
    videos?: any[];
    fullBio?: string;
    shortBio?: string;
  };
}

export default function BioSection({ creator }: BioSectionProps) {
  const achievements: string[] =
    creator.achievements ||
    (typeof creator.achievements === "string"
      ? (creator.achievements as string).split(/\n/).filter(Boolean)
      : []);
  const bio = creator.fullBio || creator.shortBio || creator.bio || "";

  return (
    <section className="py-12 md:py-16 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="grid md:grid-cols-2 gap-10">
          {/* Main Bio */}
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gold mb-4 flex items-center gap-2">
                <Music size={22} className="text-gold" /> Biography
              </h2>
              <p className="text-white/70 leading-relaxed text-base">
                {bio}
              </p>
            </div>

            {creator.musicJourney && (
              <div className="mt-6 p-4 bg-gold/5 border border-gold/10 rounded-lg">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-2">
                  <History size={18} className="text-gold" /> Music Journey
                </h3>
                <p className="text-white/60 leading-relaxed text-sm">
                  {creator.musicJourney}
                </p>
              </div>
            )}
          </div>

          {/* Achievements & Stats */}
          <div className="space-y-6">
            {achievements.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold text-white flex items-center gap-2 mb-3">
                  <Award size={20} className="text-gold" /> Achievements
                </h3>
                <ul className="space-y-2">
                  {achievements.map((achievement: string, idx: number) => (
                    <li
                      key={idx}
                      className="text-white/70 flex items-start gap-2"
                    >
                      <Sparkles size={16} className="text-gold mt-0.5 shrink-0" />
                      <span>{achievement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="bg-gold/5 border border-gold/20 rounded-xl p-5">
              <h4 className="text-gold font-semibold mb-3 text-sm uppercase tracking-wider">
                Quick Facts
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-white/40 text-xs uppercase tracking-wide block">
                    Category
                  </span>
                  <span className="text-white capitalize">
                    {creator.category || "Artist"}
                  </span>
                </div>
                <div>
                  <span className="text-white/40 text-xs uppercase tracking-wide block">
                    Joined
                  </span>
                  <span className="text-white flex items-center gap-1">
                    <Calendar size={12} />
                    {creator.createdAt
                      ? new Date(creator.createdAt).toLocaleDateString(
                          "en-ZA",
                          { year: "numeric", month: "short" }
                        )
                      : "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-white/40 text-xs uppercase tracking-wide block">
                    Songs
                  </span>
                  <span className="text-white">
                    {creator.songs?.length || 0}
                  </span>
                </div>
                <div>
                  <span className="text-white/40 text-xs uppercase tracking-wide block">
                    Videos
                  </span>
                  <span className="text-white">
                    {creator.videos?.length || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}