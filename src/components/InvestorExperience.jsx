import { useEffect, useMemo, useState } from 'react';
import { getFirestore, doc, updateDoc, serverTimestamp, setDoc, getDoc } from 'firebase/firestore';
import { auth } from '../../firebase';
import { detectTimezone } from '../../utils/timezone';
import TimezoneSettings from './TimezoneSettings';

function ParticleField() {
  const particles = useMemo(
    () =>
      Array.from({ length: 55 }, (_, index) => ({
        id: index,
        size: 1 + Math.random() * 2,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 8,
        duration: 28 + Math.random() * 18,
        opacity: 0.05 + Math.random() * 0.12,
        gold: Math.random() < 0.18,
      })),
    []
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((particle) => (
        <span
          key={particle.id}
          className="absolute rounded-full blur-sm particle"
          style={{
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            animationDelay: `${particle.delay}s`,
            animationDuration: `${particle.duration}s`,
            animationTimingFunction: 'ease-in-out',
            opacity: particle.opacity,
            backgroundColor: particle.gold ? 'rgba(212, 175, 55, 0.16)' : 'rgba(255,255,255,0.12)',
          }}
        />
      ))}
    </div>
  );
}

const MEETINGS_STORAGE_KEY = 'meetings';
const INVESTOR_NAME = 'Venture Halo Capital';

function loadMeetings() {
  return [];
}

function saveMeetings(meetings) {
  // localStorage disabled - meetings stored in Firestore only
}

function NotificationCard({ notification, onDismiss }) {
  const formattedDate = (() => {
    try {
      const d = new Date(notification.createdAt);
      if (isNaN(d.getTime())) return notification.createdAt;
      return d.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return notification.createdAt;
    }
  })();

  const formattedMeetingDate = (() => {
    try {
      const d = new Date(notification.meetingDate);
      if (isNaN(d.getTime())) return notification.meetingDate;
      return d.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return notification.meetingDate;
    }
  })();

  return (
    <div className="rounded-[28px] border border-gold/20 bg-gold/5 p-6 shadow-panel backdrop-blur-soft">
      <div className="flex items-start gap-4">
        <div className="text-2xl">🔔</div>
        <div className="flex-1 space-y-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-gold font-semibold">Meeting Cancelled</p>
            <h4 className="mt-2 text-lg font-semibold text-white">{notification.meetingTitle}</h4>
          </div>
          
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-graymuted">Date</p>
              <p className="mt-1 text-sm text-white">{formattedMeetingDate}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-graymuted">Notified</p>
              <p className="mt-1 text-sm text-white">{formattedDate}</p>
            </div>
          </div>

          {notification.cancellationMessage && (
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-graymuted">Message</p>
              <p className="mt-1 text-sm text-graysoft">{notification.cancellationMessage}</p>
            </div>
          )}

          <button
            onClick={() => onDismiss(notification.id)}
            className="mt-2 text-sm uppercase tracking-[0.15em] text-graymuted hover:text-gold transition"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}

function RescheduleModal({ meeting, isOpen, onClose, onConfirm }) {
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [rescheduleMessage, setRescheduleMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      setNewDate('');
      setNewTime('');
      setRescheduleMessage('');
    }
  }, [isOpen]);

  if (!isOpen || !meeting) return null;

  const formattedCurrentDate = (() => {
    try {
      const d = new Date(meeting.time);
      if (isNaN(d.getTime())) return meeting.time;
      return d.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return meeting.time;
    }
  })();

  const handleConfirm = () => {
    console.log('=== RESCHEDULE VALIDATION DEBUG ===');
    console.log('Selected Date:', newDate);
    console.log('Selected Time:', newTime);
    console.log('Date type:', typeof newDate);
    console.log('Time type:', typeof newTime);
    console.log('Date is empty string:', newDate === '');
    console.log('Time is empty string:', newTime === '');
    console.log('Date truthy:', !!newDate);
    console.log('Time truthy:', !!newTime);
    console.log('===================================');
    
    if (!newDate || !newTime) {
      console.error('VALIDATION FAILED: Date or Time is missing');
      alert('Please select both date and time');
      return;
    }

    const newDateTime = new Date(`${newDate}T${newTime}`);
    if (isNaN(newDateTime.getTime())) {
      alert('Invalid date or time');
      return;
    }

    const now = new Date();
    if (newDateTime <= now) {
      alert('Please select a future date and time');
      return;
    }

    onConfirm(newDate, newTime, rescheduleMessage);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-[32px] border border-white/10 bg-[#0d0d12]/95 p-8 shadow-panel backdrop-blur-soft">
        <button onClick={onClose} className="absolute right-5 top-5 text-sm uppercase tracking-[0.24em] text-graymuted transition hover:text-gold">
          Cancel
        </button>
        <div className="space-y-4">
          <p className="text-sm uppercase tracking-[0.32em] text-graymuted">Reschedule Meeting</p>
          <h2 className="text-3xl font-semibold text-white">Reschedule Meeting</h2>
        </div>

        <div className="mt-8 space-y-4">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-graymuted">Current Date</p>
            <p className="mt-2 text-base text-white">{formattedCurrentDate}</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-graysoft">
              <span className="text-xs uppercase tracking-[0.3em] text-graymuted">New Date</span>
            </label>
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition duration-200 focus:border-gold/40"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-graysoft">
              <span className="text-xs uppercase tracking-[0.3em] text-graymuted">New Time</span>
            </label>
            <input
              type="time"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition duration-200 focus:border-gold/40"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-graysoft">
              <span className="text-xs uppercase tracking-[0.3em] text-graymuted">Optional Message</span>
            </label>
            <textarea
              rows={3}
              value={rescheduleMessage}
              onChange={(e) => setRescheduleMessage(e.target.value)}
              placeholder="Example: I have a scheduling conflict and would like to move this meeting."
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition duration-200 focus:border-gold/40"
            />
          </div>
        </div>

        <div className="mt-8 flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 rounded-full border border-white/10 bg-white/5 py-3 text-sm font-semibold uppercase tracking-[0.15em] text-white transition duration-300 hover:border-gold/30 hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 rounded-full border border-gold/20 bg-gold/10 py-3 text-sm font-semibold uppercase tracking-[0.15em] text-gold transition duration-300 hover:border-gold/40 hover:bg-gold/20"
          >
            Confirm Reschedule
          </button>
        </div>
      </div>
    </div>
  );
}

function CancelMeetingModal({ meeting, isOpen, onClose, onConfirm }) {
  const [cancellationMessage, setCancellationMessage] = useState('');

  if (!isOpen || !meeting) return null;

  const formattedDate = (() => {
    try {
      const d = new Date(meeting.time);
      if (isNaN(d.getTime())) return meeting.time;
      return d.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return meeting.time;
    }
  })();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-[32px] border border-white/10 bg-[#0d0d12]/95 p-8 shadow-panel backdrop-blur-soft">
        <button onClick={onClose} className="absolute right-5 top-5 text-sm uppercase tracking-[0.24em] text-graymuted transition hover:text-gold">
          Keep Meeting
        </button>
        <div className="space-y-4">
          <p className="text-sm uppercase tracking-[0.32em] text-graymuted">Cancel Meeting?</p>
          <h2 className="text-3xl font-semibold text-white">Cancel Meeting</h2>
          <p className="text-sm leading-7 text-graysoft">This action will cancel the meeting for both participants and send a notification.</p>
        </div>

        <div className="mt-8 space-y-4">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-graymuted">Meeting</p>
            <p className="mt-2 text-base font-semibold text-white">{meeting.title}</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-graymuted">Date & Time</p>
            <p className="mt-2 text-base text-white">{formattedDate}</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm text-graysoft">
              <span className="text-xs uppercase tracking-[0.3em] text-graymuted">Reason for cancellation (optional)</span>
            </label>
            <textarea
              rows={3}
              value={cancellationMessage}
              onChange={(e) => setCancellationMessage(e.target.value)}
              placeholder="Example: Scheduling conflict. Happy to reschedule next week."
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition duration-200 focus:border-gold/40"
            />
          </div>
        </div>

        <div className="mt-8 flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 rounded-full border border-white/10 bg-white/5 py-3 text-sm font-semibold uppercase tracking-[0.15em] text-white transition duration-300 hover:border-gold/30 hover:bg-white/10"
          >
            Keep Meeting
          </button>
          <button
            onClick={() => onConfirm(cancellationMessage)}
            className="flex-1 rounded-full border border-gold/20 bg-gold/10 py-3 text-sm font-semibold uppercase tracking-[0.15em] text-gold transition duration-300 hover:border-gold/40 hover:bg-gold/20"
          >
            Cancel Meeting
          </button>
        </div>
      </div>
    </div>
  );
}

function MeetingCard({ meeting, onCancel, onReschedule }) {
  const formattedTime = (() => {
    try {
      const d = new Date(meeting.time);
      if (isNaN(d.getTime())) return meeting.time;
      return d.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return meeting.time;
    }
  })();

  const participantsList = (() => {
    if (!meeting.participants) return "";
    return Array.isArray(meeting.participants)
      ? meeting.participants.join(", ")
      : meeting.participants;
  })();

  const isUpcoming = (() => {
    try {
      const meetingTime = new Date(meeting.time);
      const now = new Date();
      return meetingTime > now;
    } catch {
      return false;
    }
  })();

  const isCancelled = meeting.status === 'cancelled';

  return (
    <article className={`rounded-[28px] border border-white/10 bg-black/40 p-6 shadow-panel backdrop-blur-soft transition duration-300 hover:-translate-y-1 hover:border-gold/30 relative ${isCancelled ? 'opacity-75' : ''}`}>
      {!isCancelled && (
        <div className="absolute top-4 right-4 flex gap-2">
          {isUpcoming && (
            <button
              onClick={() => onReschedule(meeting)}
              className="text-graymuted hover:text-gold transition duration-200"
              title="Reschedule Meeting"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
          )}
          <button
            onClick={() => onCancel(meeting)}
            className="text-graymuted hover:text-gold transition duration-200"
            title="Cancel Meeting"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      )}
      <div className={`flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between ${!isCancelled ? 'pr-16' : ''}`}>
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-graymuted">Meeting</p>
          <h4 className="mt-2 text-2xl font-semibold text-white">{meeting.title}</h4>
        </div>
        <span className={`inline-flex rounded-full border px-3 py-1 text-xs uppercase tracking-[0.3em] ${
          isCancelled 
            ? 'border-red-500/20 bg-red-500/10 text-red-400' 
            : 'border-gold/20 bg-gold/10 text-gold'
        }`}>
          {isCancelled ? 'Cancelled' : 'Scheduled'}
        </span>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-graymuted">Time (Local)</p>
          <p className="mt-2 text-sm text-white">{formattedTime}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-graymuted">Participants</p>
          <p className="mt-2 text-sm text-white">{participantsList}</p>
        </div>
        {meeting.joinUrl && !isCancelled && (
          <div className="flex items-end">
            <a
              href={meeting.joinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-full border border-gold/20 bg-gold/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-gold hover:bg-gold/20 transition duration-300"
            >
              Join Meeting
            </a>
          </div>
        )}
      </div>
      {isCancelled && meeting.cancellationMessage && (
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3">
          <p className="text-xs uppercase tracking-[0.3em] text-graymuted">Cancellation Reason</p>
          <p className="mt-1 text-sm text-graysoft">{meeting.cancellationMessage}</p>
        </div>
      )}
    </article>
  );
}

function MeetingScheduler({ startup, selectedDate, onSelectDate, selectedSlot, onSelectSlot, slots, topic, setTopic, notes, setNotes, onConfirm, confirmed, onCancel }) {
  const year = selectedDate.getFullYear();
  const month = selectedDate.toLocaleString('en-US', { month: 'long' });
  const daysInMonth = new Date(year, selectedDate.getMonth() + 1, 0).getDate();
  const monthStart = new Date(year, selectedDate.getMonth(), 1).getDay();
  const calendarDays = Array.from({ length: daysInMonth + monthStart }, (_, index) => {
    if (index < monthStart) return null;
    return new Date(year, selectedDate.getMonth(), index - monthStart + 1);
  });

  const formatDate = (date) =>
    date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  const selectedDateLabel = formatDate(selectedDate);

  return (
    <div className="rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-panel backdrop-blur-soft">
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.32em] text-graymuted">Schedule a Meeting</p>
            <h3 className="text-3xl font-semibold text-white">Arrange a focused call with {startup.name}</h3>
          </div>
          <button onClick={onCancel} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm uppercase tracking-[0.3em] text-graysoft transition hover:border-gold/30 hover:text-gold">Cancel</button>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[28px] border border-white/10 bg-black/40 p-6">
            <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-graymuted">Selected month</p>
                <p className="mt-2 text-lg font-semibold text-white">{month} {year}</p>
              </div>
              <div className="rounded-3xl border border-gold/20 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.3em] text-gold">Premium calendar</div>
            </div>

            <div className="mt-6 grid grid-cols-7 gap-2 text-[11px] uppercase tracking-[0.3em] text-graymuted">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <span key={day} className="flex h-8 items-center justify-center">{day}</span>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-7 gap-2">
              {calendarDays.map((day, index) => {
                if (!day) {
                  return <span key={`blank-${index}`} className="h-12 rounded-2xl" />;
                }
                const isSelected = day.toDateString() === selectedDate.toDateString();
                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => onSelectDate(day)}
                    className={`flex h-12 items-center justify-center rounded-2xl text-sm transition duration-200 ${isSelected ? 'bg-gold text-black shadow-glow' : 'bg-white/5 text-white hover:bg-white/10'}`}
                  >
                    {day.getDate()}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-4 rounded-[28px] border border-white/10 bg-black/40 p-6">
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-graymuted">Meeting</p>
              <p className="mt-2 text-lg font-semibold text-white">{selectedDateLabel}</p>
              <p className="mt-1 text-sm text-graysoft">{selectedSlot}</p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-graymuted">Available time slots</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {slots.map((slot) => {
                  const isSelected = slot === selectedSlot;
                  return (
                    <button
                      key={slot}
                      onClick={() => onSelectSlot(slot)}
                      className={`rounded-full border px-4 py-3 text-sm font-semibold transition duration-200 ${isSelected ? 'border-gold bg-gold/10 text-gold shadow-glow' : 'border-white/10 bg-white/5 text-white hover:border-gold/30 hover:bg-white/10'}`}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4">
              <label className="space-y-2 text-sm text-graysoft">
                <span className="text-xs uppercase tracking-[0.3em] text-graymuted">Meeting Topic</span>
                <input
                  value={topic}
                  onChange={(event) => setTopic(event.target.value)}
                  placeholder="Brief topic summary"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition duration-200 focus:border-gold/40"
                />
              </label>
              <label className="space-y-2 text-sm text-graysoft">
                <span className="text-xs uppercase tracking-[0.3em] text-graymuted">Short Agenda / Notes</span>
                <textarea
                  rows={4}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Add the key highlights for the meeting"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition duration-200 focus:border-gold/40"
                />
              </label>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:justify-end">
              <button
                onClick={onConfirm}
                className="w-full rounded-full border border-gold/20 bg-white/5 px-6 py-3 text-sm font-semibold uppercase tracking-[0.15em] text-gold shadow-glow transition duration-300 hover:border-gold/40 hover:bg-white/10 sm:w-auto"
              >
                Confirm Meeting
              </button>
            </div>

            {confirmed && (
              <div className="rounded-[28px] border border-gold/20 bg-black/60 p-6 text-white">
                <p className="text-sm uppercase tracking-[0.3em] text-gold">Meeting Scheduled Successfully</p>
                <h4 className="mt-3 text-2xl font-semibold">Your meeting is reserved</h4>
                <p className="mt-3 text-sm leading-7 text-graysoft">The meeting will appear in the shared upcoming meetings section for both founders and investors.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const mockStartups = [
  {
    id: 1,
    name: 'HelioForge',
    founder: 'Sarah Chen',
    pitch: 'Adaptive capital intelligence for frontier founders.',
    industry: 'Deep Tech',
    stage: 'Series A',
    fundingGoal: '$18M',
    users: '2,400',
    growth: '145%',
    interest: 24,
  },
  {
    id: 2,
    name: 'AuraSphere',
    founder: 'Marcus Wei',
    pitch: 'AI-curated investor networks with real-time signal flow.',
    industry: 'Investor Intelligence',
    stage: 'Seed',
    fundingGoal: '$4.2M',
    users: '890',
    growth: '234%',
    interest: 18,
  },
  {
    id: 3,
    name: 'Nexus Cove',
    founder: 'Priya Sharma',
    pitch: 'Premium deal discovery for founders with traction.',
    industry: 'Marketplace',
    stage: 'Growth',
    fundingGoal: '$27M',
    users: '15,600',
    growth: '89%',
    interest: 42,
  },
  {
    id: 4,
    name: 'Lumen Vault',
    founder: 'Alex Rodriguez',
    pitch: 'Cohort-backed risk insights for strategic capital.',
    industry: 'Climate Tech',
    stage: 'Pre-Series A',
    fundingGoal: '$7.4M',
    users: '1,200',
    growth: '178%',
    interest: 15,
  },
  {
    id: 5,
    name: 'Quantum Labs',
    founder: 'Dr. Emily Park',
    pitch: 'Enterprise security through quantum-resistant cryptography.',
    industry: 'Deep Tech',
    stage: 'Series A',
    fundingGoal: '$12M',
    users: '450',
    growth: '567%',
    interest: 31,
  },
  {
    id: 6,
    name: 'ChainHealth',
    founder: 'James Morrison',
    pitch: 'Decentralized healthcare records for patient empowerment.',
    industry: 'HealthTech',
    stage: 'Seed',
    fundingGoal: '$3.8M',
    users: '2,100',
    growth: '321%',
    interest: 22,
  },
];

function StartupCard({ startup, onViewProfile }) {
  return (
    <div className="group relative overflow-hidden rounded-[28px] border border-white/10 bg-white/5 p-7 shadow-panel backdrop-blur-soft transition duration-300 hover:-translate-y-1 hover:border-gold/30 hover:bg-white/10">
      <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-gold/10 to-transparent opacity-0 transition duration-500 group-hover:opacity-100" />
      <div className="relative space-y-4">
        <div>
          <h4 className="text-lg font-semibold text-white">{startup.name}</h4>
          <p className="mt-1 text-sm text-gold">by {startup.founder}</p>
          <p className="mt-3 text-sm leading-6 text-graysoft">{startup.pitch}</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-graymuted">Industry</p>
            <p className="mt-1 text-sm font-semibold text-white">{startup.industry}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-graymuted">Stage</p>
            <p className="mt-1 text-sm font-semibold text-white">{startup.stage}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-graymuted">Seeking</p>
            <p className="mt-1 text-sm font-semibold text-gold">{startup.fundingGoal}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-graymuted">Growth</p>
            <p className="mt-1 text-sm font-semibold text-white">{startup.growth}</p>
          </div>
        </div>

        <div className="flex gap-2 border-t border-white/10 pt-4">
          <div className="flex-1">
            <p className="text-xs uppercase tracking-[0.3em] text-graymuted">Active Users</p>
            <p className="mt-1 text-sm text-white">{startup.users}</p>
          </div>
          <div className="flex-1">
            <p className="text-xs uppercase tracking-[0.3em] text-graymuted">Investor Interest</p>
            <p className="mt-1 text-sm text-white">{startup.interest} watching</p>
          </div>
        </div>

        <button
          onClick={() => onViewProfile(startup)}
          className="mt-4 w-full rounded-full border border-gold/20 bg-white/5 py-2 text-sm font-semibold uppercase tracking-[0.15em] text-gold transition duration-300 hover:border-gold/40 hover:bg-white/10"
        >
          View Startup
        </button>
      </div>
    </div>
  );
}

function StartupProfileModal({ startup, onClose, onInterested, onSave, onSchedule, interested, saved }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 px-4 py-8 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl rounded-[32px] border border-white/10 bg-[#0d0d12]/95 p-8 shadow-panel backdrop-blur-soft">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 text-sm uppercase tracking-[0.24em] text-graymuted transition hover:text-gold"
        >
          Close
        </button>

        <div className="space-y-6">
          <div>
            <p className="text-sm uppercase tracking-[0.32em] text-graymuted">Startup Profile</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">{startup.name}</h2>
            <p className="mt-2 text-base text-gold">Founded by {startup.founder}</p>
          </div>

          <p className="text-base leading-7 text-graysoft">{startup.pitch}</p>

          <div className="grid gap-4 rounded-[28px] border border-white/10 bg-black/40 p-6 sm:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-graymuted">Stage</p>
              <p className="mt-2 text-lg font-semibold text-white">{startup.stage}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-graymuted">Funding Goal</p>
              <p className="mt-2 text-lg font-semibold text-gold">{startup.fundingGoal}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-graymuted">Industry</p>
              <p className="mt-2 text-lg font-semibold text-white">{startup.industry}</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-graymuted">Active Users</p>
              <p className="mt-3 text-2xl font-semibold text-white">{startup.users}</p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-graymuted">Growth Rate</p>
              <p className="mt-3 text-2xl font-semibold text-white">{startup.growth}</p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-graymuted">Watching</p>
              <p className="mt-3 text-2xl font-semibold text-white">{startup.interest}</p>
            </div>
          </div>

          <div className="space-y-4 rounded-[28px] border border-white/10 bg-black/40 p-6">
            <h3 className="text-lg font-semibold text-white">Investment Opportunity</h3>
            <p className="text-sm leading-7 text-graysoft">
              This startup presents a compelling investment opportunity with strong traction metrics, experienced founder leadership, and significant market potential. The premium terms reflect the quality of the founding team and the scalability of their business model.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              onClick={onSave}
              className={`rounded-full border px-6 py-3 text-sm font-semibold uppercase tracking-[0.15em] transition duration-300 ${
                saved
                  ? 'border-gold/40 bg-gold/10 text-gold'
                  : 'border-white/10 bg-white/5 text-white hover:border-white/20 hover:bg-white/10'
              }`}
            >
              {saved ? '✓ Saved' : 'Save Startup'}
            </button>
            <button
              onClick={onInterested}
              className={`rounded-full border px-6 py-3 text-sm font-semibold uppercase tracking-[0.15em] transition duration-300 ${
                interested
                  ? 'border-gold/40 bg-gold/10 text-gold'
                  : 'border-gold/20 bg-white/5 text-gold hover:border-gold/40 hover:bg-white/10'
              }`}
            >
              {interested ? '✓ Interested' : 'Mark Interested'}
            </button>
            <button
              onClick={onSchedule}
              className="rounded-full border border-gold/20 bg-white/5 px-6 py-3 text-sm font-semibold uppercase tracking-[0.15em] text-gold shadow-glow transition duration-300 hover:border-gold/40 hover:bg-white/10"
            >
              Schedule Meeting
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterPanel({ filters, onFilterChange }) {
  const industries = ['All', 'Deep Tech', 'HealthTech', 'FinTech', 'Climate Tech', 'Marketplace', 'Investor Intelligence'];
  const stages = ['All', 'Seed', 'Pre-Series A', 'Series A', 'Growth'];
  const fundingRanges = ['All', '<$5M', '$5M-$15M', '$15M-$50M', '>$50M'];

  return (
    <div className="grid gap-6 rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-panel backdrop-blur-soft lg:grid-cols-3">
      <div>
        <p className="text-sm uppercase tracking-[0.32em] text-graymuted">Filter by Industry</p>
        <div className="mt-4 space-y-2">
          {industries.map((industry) => (
            <button
              key={industry}
              onClick={() => onFilterChange('industry', industry)}
              className={`block w-full rounded-2xl border px-4 py-2 text-left text-sm transition duration-200 ${
                filters.industry === industry
                  ? 'border-gold/40 bg-gold/10 text-gold'
                  : 'border-white/10 bg-white/5 text-graysoft hover:border-white/20 hover:bg-white/10'
              }`}
            >
              {industry}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm uppercase tracking-[0.32em] text-graymuted">Filter by Stage</p>
        <div className="mt-4 space-y-2">
          {stages.map((stage) => (
            <button
              key={stage}
              onClick={() => onFilterChange('stage', stage)}
              className={`block w-full rounded-2xl border px-4 py-2 text-left text-sm transition duration-200 ${
                filters.stage === stage
                  ? 'border-gold/40 bg-gold/10 text-gold'
                  : 'border-white/10 bg-white/5 text-graysoft hover:border-white/20 hover:bg-white/10'
              }`}
            >
              {stage}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm uppercase tracking-[0.32em] text-graymuted">Filter by Funding</p>
        <div className="mt-4 space-y-2">
          {fundingRanges.map((range) => (
            <button
              key={range}
              onClick={() => onFilterChange('funding', range)}
              className={`block w-full rounded-2xl border px-4 py-2 text-left text-sm transition duration-200 ${
                filters.funding === range
                  ? 'border-gold/40 bg-gold/10 text-gold'
                  : 'border-white/10 bg-white/5 text-graysoft hover:border-white/20 hover:bg-white/10'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function InvestorExperience({ user }) {
  const [selectedStartup, setSelectedStartup] = useState(null);
  const [filters, setFilters] = useState({ industry: 'All', stage: 'All', funding: 'All' });
  const [interestedStartups, setInterestedStartups] = useState(new Set());
  const [savedStartups, setSavedStartups] = useState(new Set());
  
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [meetingToCancel, setMeetingToCancel] = useState(null);
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [meetingToReschedule, setMeetingToReschedule] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [timezoneSettingsOpen, setTimezoneSettingsOpen] = useState(false);

  // Save investor timezone to Firestore
  useEffect(() => {
    const saveInvestorProfile = async () => {
      if (!user?.uid) return;
      
      try {
        const db = getFirestore();
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        const timezone = detectTimezone();
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          // Only update if timezone is missing
          if (!userData.timezone) {
            await updateDoc(userDocRef, { 
              role: 'investor',
              timezone,
              updatedAt: serverTimestamp()
            });
            console.log('[InvestorExperience] Timezone added to existing investor:', timezone);
          }
        } else {
          // Create investor document with timezone
          await setDoc(userDocRef, {
            uid: user.uid,
            role: 'investor',
            timezone,
            createdAt: serverTimestamp()
          });
          console.log('[InvestorExperience] New investor profile created with timezone:', timezone);
        }
      } catch (error) {
        console.error('[InvestorExperience] Failed to save investor profile:', error);
      }
    };
    
    saveInvestorProfile();
  }, [user]);

  const fetchMeetings = async () => {
    if (!user?.uid) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/meetings?uid=${user.uid}&role=investor`);
      if (!res.ok) {
        throw new Error(`Failed to load meetings from database (Status ${res.status})`);
      }
      const data = await res.json();
      if (data && data.success && Array.isArray(data.meetings)) {
        setMeetings(data.meetings);
      } else {
        throw new Error(data?.message || "Failed to load meetings.");
      }
    } catch (err) {
      console.error("Error loading meetings:", err);
      setError(err.message || "Failed to retrieve meetings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, [user]);

  const handleCancelClick = (meeting) => {
    setMeetingToCancel(meeting);
    setCancelModalOpen(true);
  };

  const handleCancelConfirm = async (cancellationMessage) => {
    if (!meetingToCancel || !user?.uid) return;

    try {
      const res = await fetch('/api/cancel-meeting', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          meetingId: meetingToCancel.id,
          uid: user.uid,
          cancellationMessage,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to cancel meeting');
      }

      const data = await res.json();
      if (data.success) {
        await fetchMeetings();
        setCancelModalOpen(false);
        setMeetingToCancel(null);
      } else {
        throw new Error(data.message || 'Failed to cancel meeting');
      }
    } catch (err) {
      console.error('Error cancelling meeting:', err);
      setError(err.message || 'Failed to cancel meeting');
    }
  };

  const handleCancelClose = () => {
    setCancelModalOpen(false);
    setMeetingToCancel(null);
  };

  const handleRescheduleClick = (meeting) => {
    setMeetingToReschedule(meeting);
    setRescheduleModalOpen(true);
  };

  const handleRescheduleConfirm = async (newDate, newTime, rescheduleMessage) => {
    console.log("Reschedule Triggered");
    console.log("Selected Date:", newDate);
    console.log("Selected Time:", newTime);
    console.log("Meeting ID:", meetingToReschedule?.id);
    
    if (!meetingToReschedule || !user?.uid) return;

    try {
      console.log("Reschedule payload:", { newDate, newTime, meetingId: meetingToReschedule.id, uid: user.uid });
      
      const newDateTime = new Date(`${newDate}T${newTime}`);
      const utcTimeISO = newDateTime.toISOString();

      console.log("Reschedule UTC time:", utcTimeISO);

      const requestBody = {
        meetingId: meetingToReschedule.id,
        uid: user.uid,
        newTime: utcTimeISO,
        rescheduleMessage,
      };
      
      console.log("API Request Payload:", requestBody);

      const res = await fetch('/api/reschedule-meeting', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log("API Response Status:", res.status);

      if (!res.ok) {
        const errorText = await res.text();
        console.error("API Error Response:", errorText);
        throw new Error('Failed to reschedule meeting');
      }

      const data = await res.json();
      console.log("API Response Data:", data);
      
      if (data.success) {
        await fetchMeetings();
        setRescheduleModalOpen(false);
        setMeetingToReschedule(null);
      } else {
        throw new Error(data.message || 'Failed to reschedule meeting');
      }
    } catch (err) {
      console.error('Error rescheduling meeting:', err);
      setError(err.message || 'Failed to reschedule meeting');
    }
  };

  const handleRescheduleClose = () => {
    setRescheduleModalOpen(false);
    setMeetingToReschedule(null);
  };

  const fetchNotifications = async () => {
    if (!user?.uid) return;
    try {
      const res = await fetch(`/api/notifications?uid=${user.uid}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.notifications)) {
          setNotifications(data.notifications);
        }
      }
    } catch (err) {
      console.error('Error loading notifications:', err);
    }
  };

  const handleDismissNotification = async (notificationId) => {
    try {
      const res = await fetch('/api/mark-notification-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId }),
      });
      if (res.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      }
    } catch (err) {
      console.error('Error dismissing notification:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user]);
  const [schedulingStartup, setSchedulingStartup] = useState(null);
  const [scheduleConfirmed, setScheduleConfirmed] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => {
    const nextDay = new Date();
    nextDay.setDate(nextDay.getDate() + 1);
    return nextDay;
  });
  const [selectedSlot, setSelectedSlot] = useState('10:00 AM');
  const [meetingTopic, setMeetingTopic] = useState('Investment strategy and market fit');
  const [meetingNotes, setMeetingNotes] = useState('Review traction, runway, and growth milestones.');

  const filteredStartups = useMemo(() => {
    return mockStartups.filter((startup) => {
      if (filters.industry !== 'All' && startup.industry !== filters.industry) return false;
      if (filters.stage !== 'All' && startup.stage !== filters.stage) return false;
      return true;
    });
  }, [filters]);

  const handleFilterChange = (filterType, value) => {
    setFilters((prev) => ({ ...prev, [filterType]: value }));
  };

  const handleInterested = (startupId) => {
    setInterestedStartups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(startupId)) {
        newSet.delete(startupId);
      } else {
        newSet.add(startupId);
      }
      return newSet;
    });
  };

  const handleSave = (startupId) => {
    setSavedStartups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(startupId)) {
        newSet.delete(startupId);
      } else {
        newSet.add(startupId);
      }
      return newSet;
    });
  };

  const upcomingMeetings = useMemo(() => {
    if (!Array.isArray(meetings)) return [];
    const now = new Date();
    return meetings
      .filter((m) => {
        try {
          return new Date(m.time) > now && m.status !== 'cancelled';
        } catch {
          return false;
        }
      })
      .sort((a, b) => new Date(a.time) - new Date(b.time));
  }, [meetings]);

  const pastMeetings = useMemo(() => {
    if (!Array.isArray(meetings)) return [];
    const now = new Date();
    return meetings
      .filter((m) => {
        try {
          return new Date(m.time) <= now;
        } catch {
          return false;
        }
      })
      .sort((a, b) => new Date(b.time) - new Date(a.time));
  }, [meetings]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-ink text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(212,175,55,0.12),_transparent_24%),radial-gradient(circle_at_80%_30%,_rgba(255,255,255,0.08),_transparent_18%),linear-gradient(180deg,_#050507_0%,_#0d0d12_100%)] opacity-95" />
      <div className="absolute inset-0 bg-[radial-gradient(circle,_rgba(0,0,0,0.18),transparent_60%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.04),transparent_22%,rgba(0,0,0,0.5)_100%)]" />
      <ParticleField />

      {timezoneSettingsOpen && (
        <TimezoneSettings user={user} onClose={() => setTimezoneSettingsOpen(false)} />
      )}

      <div className="relative mx-auto max-w-7xl px-6 py-8 sm:px-8 lg:px-10">
        <div className="mt-8 space-y-12">
          {/* Investor Hero Section */}
          <div className="rounded-[32px] border border-white/10 bg-white/5 p-10 shadow-panel backdrop-blur-soft">
            <p className="text-sm uppercase tracking-[0.32em] text-graymuted">Investor workspace</p>
            <div className="mt-6 space-y-4">
              <h1 className="text-5xl font-semibold text-white sm:text-6xl">Discover The Next Generation</h1>
              <p className="mt-4 max-w-2xl text-lg leading-8 text-graysoft">
                Explore premium investment opportunities from vetted founders across deep tech, health innovation, and emerging markets. Access founder profiles, traction metrics, and real-time investor signal data.
              </p>
            </div>
            <div className="mt-8 flex flex-wrap gap-4">
              <div className="rounded-full border border-gold/20 bg-white/5 px-4 py-2 text-sm font-semibold uppercase tracking-[0.24em] text-gold">
                {filteredStartups.length} Startups
              </div>
              <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold uppercase tracking-[0.24em] text-graysoft">
                {savedStartups.size} Saved
              </div>
              <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold uppercase tracking-[0.24em] text-graysoft">
                {interestedStartups.size} Interested
              </div>
              <button
                onClick={() => setTimezoneSettingsOpen(true)}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold uppercase tracking-[0.24em] text-graysoft hover:border-gold/30 hover:text-gold transition"
              >
                Timezone
              </button>
            </div>
          </div>

          {/* Notifications Section */}
          {notifications.length > 0 && (
            <div className="rounded-[32px] border border-gold/20 bg-gold/5 p-8 shadow-panel backdrop-blur-soft">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-sm uppercase tracking-[0.32em] text-gold">Notifications</p>
                  <h3 className="mt-2 text-2xl font-semibold text-white">
                    {notifications.length} New {notifications.length === 1 ? 'Notification' : 'Notifications'}
                  </h3>
                </div>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="text-sm uppercase tracking-[0.15em] text-graymuted hover:text-gold transition"
                >
                  {showNotifications ? 'Hide' : 'Show'}
                </button>
              </div>

              {showNotifications && (
                <div className="space-y-4">
                  {notifications.map((notification) => (
                    <NotificationCard
                      key={notification.id}
                      notification={notification}
                      onDismiss={handleDismissNotification}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="rounded-[32px] border border-white/10 bg-white/5 p-10 shadow-panel backdrop-blur-soft">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.32em] text-graymuted">Meetings</p>
                <h3 className="mt-3 text-3xl font-semibold text-white">Shared calendar view</h3>
              </div>
              <p className="max-w-xl text-sm leading-7 text-graysoft">All scheduled meetings are securely synced with the database and Zoom integration.</p>
            </div>

            {error && (
              <div className="mt-8 rounded-3xl border border-red-500/20 bg-red-500/10 p-5 text-center text-red-400">
                <p className="font-semibold">Error Loading Meetings</p>
                <p className="mt-2 text-sm">{error}</p>
              </div>
            )}

            {loading ? (
              <div className="mt-8 text-center text-graysoft">
                <p className="animate-pulse text-gold">Syncing workspaces...</p>
              </div>
            ) : (
              <div className="mt-8 space-y-12">
                {/* Upcoming Meetings */}
                <div className="space-y-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-gold font-semibold">Upcoming Sessions</p>
                  {upcomingMeetings.length > 0 ? (
                    <div className="grid gap-4 xl:grid-cols-2">
                      {upcomingMeetings.map((meeting) => (
                        <MeetingCard key={meeting.id} meeting={meeting} onCancel={handleCancelClick} onReschedule={handleRescheduleClick} />
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-[28px] border border-white/10 bg-black/40 p-8 text-center text-graysoft">
                      <p className="text-white">No upcoming meetings scheduled yet.</p>
                      <p className="mt-2 text-sm">Schedule a meeting from a startup profile below to begin syncing your calendar.</p>
                    </div>
                  )}
                </div>

                {/* Past Meetings */}
                <div className="space-y-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-graymuted font-semibold">Past Sessions</p>
                  {pastMeetings.length > 0 ? (
                    <div className="grid gap-4 xl:grid-cols-2">
                      {pastMeetings.map((meeting) => (
                        <MeetingCard key={meeting.id} meeting={meeting} onCancel={handleCancelClick} onReschedule={handleRescheduleClick} />
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-[28px] border border-white/5 bg-black/20 p-8 text-center text-graymuted">
                      <p className="text-sm">No past meetings recorded.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {schedulingStartup && (
            <MeetingScheduler
              startup={schedulingStartup}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              selectedSlot={selectedSlot}
              onSelectSlot={setSelectedSlot}
              slots={['10:00 AM', '11:30 AM', '2:00 PM', '4:30 PM']}
              topic={meetingTopic}
              setTopic={setMeetingTopic}
              notes={meetingNotes}
              setNotes={setMeetingNotes}
              onConfirm={async () => {
                // Parse date and selected slot safely into a standardized UTC timestamp
                const dateStr = selectedDate.toISOString().split('T')[0];
                const [time, modifier] = selectedSlot.split(' ');
                let [hours, minutes] = time.split(':');
                if (hours === '12') {
                  hours = '00';
                }
                if (modifier === 'PM') {
                  hours = parseInt(hours, 10) + 12;
                }
                const meetingDateTime = new Date(`${dateStr}T${String(hours).padStart(2, '0')}:${minutes}:00`);
                const utcTimeISO = meetingDateTime.toISOString();

                setLoading(true);
                setScheduleConfirmed(false);
                setError(null);

                try {
                  const res = await fetch("/api/create-meeting", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      title: meetingTopic || `${schedulingStartup.name} x ${INVESTOR_NAME}`,
                      time: utcTimeISO,
                      participants: [schedulingStartup.founder, INVESTOR_NAME],
                      uid: user?.uid,
                      founderId: null,
                      investorId: user?.uid
                    }),
                  });

                  if (!res.ok) {
                    const errorData = await res.json().catch(() => ({}));
                    throw new Error(errorData?.message || `Failed to schedule meeting (Status ${res.status})`);
                  }

                  const data = await res.json();
                  if (data && data.success && data.meeting) {
                    setMeetings((prev) => [...prev, data.meeting]);
                    setScheduleConfirmed(true);
                  } else {
                    throw new Error(data?.message || "Failed to load scheduled meeting details from server.");
                  }
                } catch (err) {
                  console.error("Error scheduling meeting:", err);
                  setError(err.message || "Failed to schedule meeting.");
                } finally {
                  setLoading(false);
                }
              }}
              confirmed={scheduleConfirmed}
              onCancel={() => {
                setSchedulingStartup(null);
                setScheduleConfirmed(false);
              }}
            />
          )}

          {/* Filter Panel */}
          <FilterPanel filters={filters} onFilterChange={handleFilterChange} />

          {/* Startup Discovery */}
          <div className="space-y-6">
            <div>
              <p className="text-sm uppercase tracking-[0.32em] text-graymuted">Discovery</p>
              <h2 className="mt-3 text-3xl font-semibold text-white">Explore Premium Startups</h2>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredStartups.map((startup) => (
                <StartupCard key={startup.id} startup={startup} onViewProfile={setSelectedStartup} />
              ))}
            </div>

            {filteredStartups.length === 0 && (
              <div className="rounded-[32px] border border-white/10 bg-white/5 p-12 text-center shadow-panel backdrop-blur-soft">
                <p className="text-lg text-graysoft">No startups match your current filters.</p>
                <p className="mt-2 text-sm text-graymuted">Try adjusting your search criteria.</p>
              </div>
            )}
          </div>

          {/* Footer CTA */}
          <div className="rounded-[32px] border border-gold/20 bg-white/5 p-8 text-center shadow-panel backdrop-blur-soft">
            <p className="text-lg text-graysoft">Invest in the future of the startup ecosystem</p>
            <p className="mt-3 text-xs uppercase tracking-[0.32em] text-graymuted">
              Venture Halo — Premium Investor Discovery Platform
            </p>
          </div>
        </div>
      </div>

      {selectedStartup && (
        <StartupProfileModal
          startup={selectedStartup}
          onClose={() => setSelectedStartup(null)}
          onInterested={() => {
            handleInterested(selectedStartup.id);
          }}
          onSave={() => {
            handleSave(selectedStartup.id);
          }}
          onSchedule={() => {
            setSchedulingStartup(selectedStartup);
            setSelectedStartup(null);
            setScheduleConfirmed(false);
          }}
          interested={interestedStartups.has(selectedStartup.id)}
          saved={savedStartups.has(selectedStartup.id)}
        />
      )}

      <CancelMeetingModal
        meeting={meetingToCancel}
        isOpen={cancelModalOpen}
        onClose={handleCancelClose}
        onConfirm={handleCancelConfirm}
      />

      <RescheduleModal
        meeting={meetingToReschedule}
        isOpen={rescheduleModalOpen}
        onClose={handleRescheduleClose}
        onConfirm={handleRescheduleConfirm}
      />
    </div>
  );
}
