"use client";

import { useState } from "react";
import { X, Loader2, Calendar, MapPin, Link as LinkIcon } from "lucide-react";

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newEvent: any) => void;
}

export default function AddEventModal({ isOpen, onClose, onSuccess }: AddEventModalProps) {
  const [city, setCity] = useState("");
  const [date, setDate] = useState("");
  const [venue, setVenue] = useState("");
  const [ticketLink, setTicketLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  const resetForm = () => {
    setCity("");
    setDate("");
    setVenue("");
    setTicketLink("");
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!city.trim()) {
      setError("City is required");
      return;
    }
    if (!date.trim()) {
      setError("Date is required");
      return;
    }
    if (!venue.trim()) {
      setError("Venue is required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/creators/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          city: city.trim(),
          date,
          venue: venue.trim(),
          ticketLink: ticketLink.trim() || null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        onSuccess(data.event);
        handleClose();
      } else {
        setError(data.error || "Failed to add event");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl max-w-md w-full">
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <h2 className="text-white text-xl font-bold">Add New Event</h2>
          <button onClick={handleClose} className="text-white/50 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* City */}
          <div>
            <label className="block text-white/80 text-sm mb-1">City *</label>
            <div className="flex items-center gap-2">
              <MapPin size={18} className="text-white/40" />
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g., Cape Town, Lagos, London"
                className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-gold"
                required
              />
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-white/80 text-sm mb-1">Date *</label>
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-white/40" />
              <input
                type="text"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                placeholder="e.g., July 22, 2025"
                className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-gold"
                required
              />
            </div>
          </div>

          {/* Venue */}
          <div>
            <label className="block text-white/80 text-sm mb-1">Venue *</label>
            <input
              type="text"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              placeholder="e.g., DHL Stadium, O2 Arena"
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-gold"
              required
            />
          </div>

          {/* Ticket Link */}
          <div>
            <label className="block text-white/80 text-sm mb-1">Ticket Link</label>
            <div className="flex items-center gap-2">
              <LinkIcon size={18} className="text-white/40" />
              <input
                type="url"
                value={ticketLink}
                onChange={(e) => setTicketLink(e.target.value)}
                placeholder="https://..."
                className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-gold"
              />
            </div>
            <p className="text-white/30 text-xs mt-1">Optional. Link where fans can buy tickets.</p>
          </div>

          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={handleClose} className="flex-1 px-4 py-2 border border-white/30 text-white rounded-lg hover:border-gold transition-all">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-gold to-gold-dark text-black font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 size={18} className="animate-spin mx-auto" /> : "Add Event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}