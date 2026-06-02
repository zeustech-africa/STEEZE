'use client';

import React from 'react';
import { Calendar, MapPin, Ticket, ExternalLink, Clock } from 'lucide-react';

export interface Event {
  id: string;
  city: string;
  date: string;
  venue: string;
  ticketLink?: string;
  description?: string;
  imageUrl?: string;
}

interface EventsListProps {
  events: Event[];
  title?: string;
  subtitle?: string;
  layout?: 'list' | 'cards';
  showPastEvents?: boolean;
  maxEvents?: number;
  onTicketClick?: (event: Event) => void;
  ticketButtonClassName?: string;
}

export function EventsList({
  events,
  title,
  subtitle,
  layout = 'cards',
  showPastEvents = false,
  maxEvents,
  onTicketClick,
  ticketButtonClassName
}: EventsListProps) {
  const now = new Date();

  // Filter events by date
  const filteredEvents = events.filter(event => {
    const eventDate = new Date(event.date);
    const isUpcoming = eventDate >= now;
    return showPastEvents ? true : isUpcoming;
  });

  // Sort events by date (upcoming first, then past)
  const sortedEvents = [...filteredEvents].sort((a, b) => {
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  const displayEvents = maxEvents ? sortedEvents.slice(0, maxEvents) : sortedEvents;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-ZA', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(date);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-ZA', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const isUpcoming = (dateString: string) => {
    return new Date(dateString) >= now;
  };

  const handleTicketClick = (event: Event) => {
    if (onTicketClick) {
      onTicketClick(event);
    } else if (event.ticketLink) {
      window.open(event.ticketLink, '_blank');
    }
  };

  if (displayEvents.length === 0) {
    return null;
  }

  // List Layout
  const renderList = () => (
    <div className="space-y-4">
      {displayEvents.map((event) => {
        const upcoming = isUpcoming(event.date);
        
        return (
          <div
            key={event.id}
            className={`flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl transition-all ${
              upcoming
                ? 'bg-gray-900 hover:bg-gray-800'
                : 'bg-gray-900/50 opacity-70'
            }`}
          >
            {/* Date */}
            <div className="flex items-center gap-4 min-w-[120px]">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">
                  {new Date(event.date).getDate()}
                </div>
                <div className="text-xs text-gray-400">
                  {new Date(event.date).toLocaleString('default', { month: 'short' })}
                </div>
              </div>
              <div className="hidden sm:block">
                <div className="text-xs text-gray-500">{formatTime(event.date)}</div>
              </div>
            </div>

            {/* Event Info */}
            <div className="flex-1">
              <h3 className="text-white font-semibold">{event.city}</h3>
              <p className="text-gray-400 text-sm">{event.venue}</p>
              {event.description && (
                <p className="text-gray-500 text-xs mt-1">{event.description}</p>
              )}
            </div>

            {/* Ticket Button */}
            {event.ticketLink && (
              <button
                onClick={() => handleTicketClick(event)}
                className={ticketButtonClassName || `flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  upcoming
                    ? 'bg-gold text-black hover:bg-gold-dark'
                    : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                }`}
                disabled={!upcoming}
              >
                <Ticket className="w-4 h-4" />
                <span className="text-sm font-medium">Tickets</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );

  // Card Layout
  const renderCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {displayEvents.map((event) => {
        const upcoming = isUpcoming(event.date);
        
        return (
          <div
            key={event.id}
            className={`group rounded-xl overflow-hidden transition-all duration-300 ${
              upcoming
                ? 'bg-gray-900 hover:scale-105 hover:shadow-xl'
                : 'bg-gray-900/50 opacity-70'
            }`}
          >
            {/* Event Image (optional) */}
            {event.imageUrl && (
              <div className="aspect-video relative">
                <img
                  src={event.imageUrl}
                  alt={event.city}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            {/* Event Content */}
            <div className="p-4">
              {/* Date Badge */}
              <div className="flex items-center gap-2 text-gold text-sm mb-3">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(event.date)}</span>
                <Clock className="w-4 h-4 ml-2" />
                <span>{formatTime(event.date)}</span>
              </div>
              
              {/* Location */}
              <h3 className="text-white font-bold text-lg mb-1 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gold" />
                {event.city}
              </h3>
              <p className="text-gray-400 text-sm mb-2">{event.venue}</p>
              
              {event.description && (
                <p className="text-gray-500 text-sm mb-4 line-clamp-2">
                  {event.description}
                </p>
              )}
              
              {/* Ticket Button */}
              {event.ticketLink && (
                <button
                  onClick={() => handleTicketClick(event)}
                  className={ticketButtonClassName || `w-full mt-2 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                    upcoming
                      ? 'bg-gold text-black hover:bg-gold-dark'
                      : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  }`}
                  disabled={!upcoming}
                >
                  <Ticket className="w-4 h-4" />
                  <span className="text-sm font-medium">Get Tickets</span>
                </button>
              )}
              
              {/* Past Event Badge */}
              {!upcoming && (
                <div className="mt-2 text-center">
                  <span className="text-xs text-gray-500">Past Event</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <section className="w-full py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        {(title || subtitle) && (
          <div className="text-center mb-10">
            {subtitle && (
              <p className="text-gold uppercase tracking-wider text-sm mb-2">
                {subtitle}
              </p>
            )}
            {title && (
              <h2 className="text-3xl md:text-4xl font-bold text-white">
                {title}
              </h2>
            )}
          </div>
        )}

        {/* Events */}
        {layout === 'list' ? renderList() : renderCards()}

        {/* View All Link (if maxEvents was applied) */}
        {maxEvents && events.length > maxEvents && (
          <div className="text-center mt-8">
            <button className="text-gold hover:text-gold-dark transition-colors text-sm font-medium">
              View All Events →
            </button>
          </div>
        )}
      </div>
    </section>
  );
}