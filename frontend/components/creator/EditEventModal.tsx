"use client";

import { useState, useEffect } from "react";
import { X, Loader2, Calendar, MapPin, Link as LinkIcon } from "lucide-react";
import DeleteConfirmationModal from "./DeleteConfirmationModal";

interface Event {
  id: string;
  city: string;
  date: string;
  venue: string;
  ticketLink?: string;
}

interface EditEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event | null;
  onUpdate: (updatedEvent: Event) => void;
  onDelete: (eventId: string) => void;
}

export default function EditEventModal({ isOpen, onClose, event, onUpdate, onDelete }: EditEventModalProps) {
  const [city, setCity] = useState("");
  const [date, setDate] = useState("");
  const [venue, setVenue] = useState("");
  const [ticketLink, setTicketLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  useEffect(() => {
    if (event) {
      setCity(event.city || "");
      setDate(event.date || "");
      setVenue(event.venue || "");
      setTicketLink(event.ticketLink || "");
    }
  }, [event]);

  const handleSave = async () => {
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
      const response = await fetch(`${API_URL}/api/creators/events/${event?.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          city: city.trim(),
          date,
          venue: venue.trim(),
          ticketLink: ticketLink.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        onUpdate({
          ...event!,
          city: city.trim(),
          date,
          venue: venue.trim(),
          ticketLink: ticketLink.trim() || undefined,
        });
        onClose();
      } else {
        setError(data.error || "Failed to update event");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/creators/events/${event?.id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` },
      });

      if (response.ok) {
        onDelete(event!.id);
        setShowDeleteConfirm(false);
        onClose();
      } else {
        const data = await response.json();
        setError(data.error || "Failed to delete event");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  if (!isOpen || !event) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
        <div className="bg-gray-900 rounded-2xl max-w-md w-full">
          <div className="p-6 border-b border-white/10 flex justify-between items-center">
            <h2 className="text-white text-xl font-bold">Edit Event</h2>
            <button onClick={onClose} className="text-white/50 hover:text-white">
              <X size={20} />
            </button>
          </div>

          <div className="p-6 space-y-4">
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

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all"
              >
                Delete Event
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-gold to-gold-dark text-black font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 size={18} className="animate-spin mx-auto" /> : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <DeleteConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Event"
        message={`Are you sure you want to delete the event in "${event.city}" on "${event.date}"? This action cannot be undone.`}
        loading={deleting}
      />
    </>
  );
}