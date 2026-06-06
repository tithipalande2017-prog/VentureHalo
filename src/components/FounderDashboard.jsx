import { useEffect, useMemo, useState } from 'react';
import { getFirestore, doc, updateDoc, serverTimestamp, setDoc, getDoc } from 'firebase/firestore';
import { auth } from '../../firebase';
import { detectTimezone } from '../utils/timezone';
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
const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

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

function MetricCard({ label, value, description, trend }) {
  return (
    <div className="group rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-panel backdrop-blur-soft transition duration-300 hover:-translate-y-1 hover:border-gold/30 hover:bg-white/10">
      <p className="text-xs uppercase tracking-[0.3em] text-graymuted">{label}</p>
      <p className="mt-4 text-4xl font-semibold text-white">{value}</p>
      {description && <p className="mt-2 text-sm text-graysoft">{description}</p>}
      {trend && <p className="mt-3 text-xs font-semibold uppercase tracking-[0.24em] text-gold">{trend}</p>}
    </div>
  );
}

function RevenueGraph() {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const data = [10, 25, 40, 55, 72, 88];
  const maxValue = 100;

  return (
    <div className="rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-panel backdrop-blur-soft">
      <p className="text-sm uppercase tracking-[0.32em] text-graymuted">Revenue Projection</p>
      <h3 className="mt-2 text-2xl font-semibold text-white">Projected Revenue Growth</h3>

      <div className="mt-8 space-y-6">
        <div className="flex items-end gap-3" style={{ height: '200px' }}>
          {data.map((value, index) => {
            const height = (value / maxValue) * 100;
            return (
              <div key={index} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full bg-gradient-to-t from-gold/20 to-gold/5 rounded-t-lg transition duration-300 hover:from-gold/40 hover:to-gold/15" style={{ height: `${height}%` }} />
              </div>
            );
          })}
        </div>

        <div className="flex justify-between border-t border-white/10 pt-6">
          {months.map((month) => (
            <span key={month} className="text-xs uppercase tracking-[0.24em] text-graymuted">
              {month}
            </span>
          ))}
        </div>
      </div>

      <p className="mt-6 text-xs leading-6 text-graymuted">
        Based on founder projections and traction estimates.
      </p>
    </div>
  );
}

function InvestorCard({ name, title, industries, range, stages, bio, onPitch }) {
  return (
    <div className="group relative overflow-hidden rounded-[28px] border border-white/10 bg-white/5 p-7 shadow-panel backdrop-blur-soft transition duration-300 hover:-translate-y-1 hover:border-gold/30 hover:bg-white/10">
      <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-gold/10 to-transparent opacity-0 transition duration-500 group-hover:opacity-100" />
      <div className="relative space-y-4">
        <div>
          <h4 className="text-lg font-semibold text-white">{name}</h4>
          <p className="mt-1 text-sm text-gold">{title}</p>
          <p className="mt-4 text-xs uppercase tracking-[0.3em] text-graymuted">Industries</p>
          <p className="mt-1 text-sm text-graysoft">{industries}</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-graymuted">Funding Range</p>
            <p className="mt-1 text-sm font-semibold text-white">{range}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-graymuted">Stages</p>
            <p className="mt-1 text-sm font-semibold text-white">{stages}</p>
          </div>
        </div>

        <p className="text-sm leading-6 text-graysoft">{bio}</p>

        <button onClick={onPitch} className="mt-4 w-full rounded-full border border-gold/20 bg-white/5 py-2 text-sm font-semibold uppercase tracking-[0.15em] text-gold transition duration-300 hover:border-gold/40 hover:bg-white/10">
          Pitch Investor
        </button>
      </div>
    </div>
  );
}

function PitchModal({ investor, payload, setPayload, onClose, onSend, sent }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl rounded-[32px] border border-white/10 bg-[#0d0d12]/95 p-8 shadow-panel backdrop-blur-soft">
        <button onClick={onClose} className="absolute right-5 top-5 text-sm uppercase tracking-[0.24em] text-graymuted transition hover:text-gold">
          Cancel
        </button>
        <div className="space-y-4">
          <p className="text-sm uppercase tracking-[0.32em] text-graymuted">Pitch Investor</p>
          <h2 className="text-3xl font-semibold text-white">Send your pitch to {investor.name}</h2>
          <p className="text-sm leading-7 text-graysoft">Craft a refined introduction that presents your startup, funding ask, and value proposition.</p>
        </div>

        <div className="mt-8 space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm text-graysoft">
              <span className="text-xs uppercase tracking-[0.3em] text-graymuted">Startup Name</span>
              <input
                value={payload.startupName}
                onChange={(e) => setPayload({ ...payload, startupName: e.target.value })}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition duration-200 focus:border-gold/40"
              />
            </label>
            <label className="space-y-2 text-sm text-graysoft">
              <span className="text-xs uppercase tracking-[0.3em] text-graymuted">One-Line Pitch</span>
              <input
                value={payload.oneLiner}
                onChange={(e) => setPayload({ ...payload, oneLiner: e.target.value })}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition duration-200 focus:border-gold/40"
              />
            </label>
          </div>

          <label className="space-y-2 text-sm text-graysoft">
            <span className="text-xs uppercase tracking-[0.3em] text-graymuted">Funding Requested</span>
            <input
              value={payload.fundingRequested}
              onChange={(e) => setPayload({ ...payload, fundingRequested: e.target.value })}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition duration-200 focus:border-gold/40"
            />
          </label>

          <label className="space-y-2 text-sm text-graysoft">
            <span className="text-xs uppercase tracking-[0.3em] text-graymuted">Short Message To Investor</span>
            <textarea
              rows={4}
              value={payload.message}
              onChange={(e) => setPayload({ ...payload, message: e.target.value })}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition duration-200 focus:border-gold/40"
            />
          </label>
        </div>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-end">
          <button onClick={onClose} className="rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold uppercase tracking-[0.15em] text-white transition duration-300 hover:border-white/20 hover:bg-white/10">
            Cancel
          </button>
          <button
            onClick={onSend}
            className="rounded-full border border-gold/20 bg-white/5 px-6 py-3 text-sm font-semibold uppercase tracking-[0.15em] text-gold shadow-glow transition duration-300 hover:border-gold/40 hover:bg-white/10"
          >
            Send Pitch
          </button>
        </div>

        {sent && (
          <div className="mt-6 rounded-3xl border border-gold/20 bg-black/40 p-5 text-center text-sm text-graysoft">
            <p className="font-semibold text-white">Pitch Successfully Sent</p>
            <p className="mt-2">Your message has been prepared for investor review.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function MeetingScheduler({ investor, selectedDate, onSelectDate, selectedSlot, onSelectSlot, slots, topic, setTopic, notes, setNotes, onConfirm, confirmed }) {
  const year = selectedDate.getFullYear();
  const month = selectedDate.toLocaleString('en-US', { month: 'long' });
  const daysInMonth = new Date(year, selectedDate.getMonth() + 1, 0).getDate();
  const monthStart = new Date(year, selectedDate.getMonth(), 1).getDay();
  const calendarDays = Array.from({ length: daysInMonth + monthStart }, (_, index) => {
    if (index < monthStart) return null;
    return new Date(year, selectedDate.getMonth(), index - monthStart + 1);
  });

  const formatDate = (date) => date.toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  });

  const selectedDateLabel = formatDate(selectedDate);

  return (
    <div className="rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-panel backdrop-blur-soft">
      <div className="space-y-6">
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-[0.32em] text-graymuted">Schedule a Meeting</p>
          <h3 className="text-3xl font-semibold text-white">Arrange a high-impact investor conversation</h3>
          <p className="max-w-2xl text-sm leading-7 text-graysoft">After your pitch is accepted, select a premium slot and confirm a focused meeting with your investor.</p>
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
                    onClick={() => {
                      onSelectDate(day);
                    }}
                    className={`flex h-12 items-center justify-center rounded-2xl text-sm transition duration-200 ${isSelected ? 'bg-gold text-black shadow-glow' : 'bg-white/5 text-white hover:bg-white/10'}`}
                  >
                    {day.getDate()}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-6 rounded-[28px] border border-white/10 bg-black/40 p-6">
            <div className="space-y-4">
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-graymuted">Investor</p>
                <p className="mt-2 text-xl font-semibold text-white">{investor.name}</p>
                <p className="text-sm text-graysoft">{investor.title}</p>
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
                <p className="text-sm uppercase tracking-[0.3em] text-gold">Meeting Successfully Scheduled</p>
                <h4 className="mt-3 text-2xl font-semibold">Your session is reserved</h4>
                <p className="mt-3 text-sm leading-7 text-graysoft">A high-level investor meeting has been arranged and will appear in your private founder workspace.</p>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.3em] text-graymuted">Date</p>
                    <p className="mt-2 text-base font-semibold text-white">{selectedDateLabel}</p>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.3em] text-graymuted">Time</p>
                    <p className="mt-2 text-base font-semibold text-white">{selectedSlot}</p>
                  </div>
                </div>

                <div className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-graymuted">Meeting Topic</p>
                  <p className="mt-2 text-base text-white">{topic || 'Investor update session'}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FounderDashboard({ surveyData, user }) {
  const founderName = surveyData?.founderName || 'Founder';
  const startupName = surveyData?.startupName || 'Your Startup';
  const stage = surveyData?.stage || 'Growth';
  const tagline = surveyData?.oneSentencePitch || 'Building the future of your industry';

  const [activePitchInvestor, setActivePitchInvestor] = useState(null);
  const [connectedInvestor, setConnectedInvestor] = useState(null);
  const [pitchSent, setPitchSent] = useState(false);
  const [meetingConfirmed, setMeetingConfirmed] = useState(false);
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

  // Save survey data and timezone to Firestore
  useEffect(() => {
    const saveFounderProfile = async () => {
      if (!user?.uid || !surveyData) return;
      
      try {
        const db = getFirestore();
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        const timezone = detectTimezone();
        
        const profileData = {
          ...surveyData,
          role: 'founder',
          timezone,
          updatedAt: serverTimestamp()
        };
        
        if (userDoc.exists()) {
          await updateDoc(userDocRef, profileData);
          console.log('[FounderDashboard] Profile updated with timezone:', timezone);
        } else {
          await setDoc(userDocRef, {
            uid: user.uid,
            ...profileData,
            createdAt: serverTimestamp()
          });
          console.log('[FounderDashboard] New profile created with timezone:', timezone);
        }
      } catch (error) {
        console.error('[FounderDashboard] Failed to save profile:', error);
      }
    };
    
    saveFounderProfile();
  }, [user, surveyData]);

  const fetchMeetings = async () => {
    if (!user?.uid) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/meetings?uid=${user.uid}&role=founder`);
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
      const res = await fetch(`${API_BASE}/api/cancel-meeting`, {
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
        // Refresh meetings to update the UI
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

      const res = await fetch(`${API_BASE}/api/reschedule-meeting`, {
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
      const res = await fetch(`${API_BASE}/api/notifications?uid=${user.uid}`);
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
      const res = await fetch(`${API_BASE}/api/mark-notification-read`, {
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

  const [selectedDate, setSelectedDate] = useState(() => {
    const nextDay = new Date();
    nextDay.setDate(nextDay.getDate() + 1);
    return nextDay;
  });
  const [selectedSlot, setSelectedSlot] = useState('10:00 AM');
  const [meetingTopic, setMeetingTopic] = useState('Investor meeting about product traction');
  const [meetingNotes, setMeetingNotes] = useState('Share progress updates and next-stage plans.');
  const [pitchPayload, setPitchPayload] = useState({
    startupName: surveyData?.startupName || 'Your Startup',
    oneLiner: surveyData?.oneSentencePitch || 'A breakthrough startup defining the future of our market.',
    fundingRequested: surveyData?.fundingAmount || '$500K',
    message: surveyData?.investorPitch || 'I would love to share how we are building a premium business with strong traction and clear investor potential.',
  });

  const availableSlots = ['10:00 AM', '11:30 AM', '2:00 PM', '4:30 PM'];

  const monthDays = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, index) => new Date(year, month, index + 1));
  }, [selectedDate]);

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

  const investors = [];

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
          {/* Founder Welcome Section */}
          <div className="rounded-[32px] border border-white/10 bg-white/5 p-10 shadow-panel backdrop-blur-soft">
            <p className="text-sm uppercase tracking-[0.32em] text-graymuted">Welcome back</p>
            <div className="mt-6 space-y-2">
              <h1 className="text-5xl font-semibold text-white sm:text-6xl">{founderName}</h1>
              <h2 className="text-3xl font-semibold text-gold">{startupName}</h2>
              <p className="mt-4 max-w-2xl text-lg leading-8 text-graysoft">{tagline}</p>
            </div>
            <div className="mt-6 flex flex-wrap gap-4">
              <div className="rounded-full border border-gold/20 bg-white/5 px-4 py-2 text-sm font-semibold uppercase tracking-[0.24em] text-gold">
                {stage}
              </div>
              <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold uppercase tracking-[0.24em] text-graysoft">
                Active on platform
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

          {/* Metric Cards */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              label="Funding Goal"
              value={surveyData?.fundingAmount || '$500K'}
              description="Amount seeking"
              trend="On track"
            />
            <MetricCard
              label="Investor Interest"
              value="12"
              description="Investors viewing profile"
              trend="↑ 4 this week"
            />
            <MetricCard
              label="Startup Health"
              value="82%"
              description="Profile completeness"
              trend="Excellent"
            />
            <MetricCard
              label="Profile Status"
              value="90%"
              description="Information coverage"
              trend="Near complete"
            />
          </div>

          <div className="rounded-[32px] border border-white/10 bg-white/5 p-10 shadow-panel backdrop-blur-soft">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.32em] text-graymuted">Meetings</p>
                <h3 className="mt-3 text-3xl font-semibold text-white">Shared calendar activity</h3>
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
                      <p className="mt-2 text-sm">Use the pitch tool below to connect and arrange dates with investors.</p>
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

          {/* Startup Overview */}
          <div className="rounded-[32px] border border-white/10 bg-white/5 p-10 shadow-panel backdrop-blur-soft">
            <p className="text-sm uppercase tracking-[0.32em] text-graymuted">Startup Overview</p>
            <h3 className="mt-4 text-2xl font-semibold text-white">Your Mission & Market</h3>

            <div className="mt-8 grid gap-8 lg:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-graymuted">Problem Statement</p>
                  <p className="mt-2 text-base leading-7 text-graysoft">
                    {surveyData?.problemStatement ||
                      'We are solving a critical market problem by providing innovative solutions that improve efficiency and create lasting value.'}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-graymuted">Market Opportunity</p>
                  <p className="mt-2 text-base leading-7 text-graysoft">
                    {surveyData?.targetAudience || 'Targeting enterprises and mid-market companies seeking premium solutions in our vertical.'}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-graymuted">Business Model</p>
                  <p className="mt-2 text-base leading-7 text-graysoft">
                    {surveyData?.revenueModel ||
                      'Subscription-based SaaS model with premium tier for enterprise customers and usage-based add-ons.'}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-graymuted">Competitive Advantage</p>
                  <p className="mt-2 text-base leading-7 text-graysoft">
                    {surveyData?.differentiation || 'Our unique technology stack and founder expertise create a defensible moat in the market.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Revenue Graph */}
          <RevenueGraph />

          {/* Investor Discovery */}
          <div className="space-y-6">
            <div>
              <p className="text-sm uppercase tracking-[0.32em] text-graymuted">Discovery</p>
              <h3 className="mt-3 text-3xl font-semibold text-white">Discover Investors</h3>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              {investors.map((investor) => (
                <InvestorCard
                  key={investor.name}
                  name={investor.name}
                  title={investor.title}
                  industries={investor.industries}
                  range={investor.range}
                  stages={investor.stages}
                  bio={investor.bio}
                  onPitch={() => {
                    setActivePitchInvestor(investor);
                    setPitchSent(false);
                  }}
                />
              ))}
            </div>
          </div>

          {activePitchInvestor && (
            <PitchModal
              investor={activePitchInvestor}
              payload={pitchPayload}
              setPayload={setPitchPayload}
              onClose={() => setActivePitchInvestor(null)}
              onSend={() => {
                setPitchSent(true);
                setConnectedInvestor(activePitchInvestor);
                setActivePitchInvestor(null);
                setMeetingConfirmed(false);
              }}
              sent={pitchSent}
            />
          )}

          {pitchSent && connectedInvestor && (
            <MeetingScheduler
              investor={connectedInvestor}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              selectedSlot={selectedSlot}
              onSelectSlot={setSelectedSlot}
              slots={availableSlots}
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
                setMeetingConfirmed(false);
                setError(null);

                try {
                  const res = await fetch(`${API_BASE}/api/create-meeting`, {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      title: meetingTopic || `${startupName} x ${connectedInvestor.name}`,
                      time: utcTimeISO,
                      participants: [founderName, connectedInvestor.name],
                      uid: user?.uid,
                      founderId: user?.uid,
                      investorId: null
                    }),
                  });

                  if (!res.ok) {
                    const errorData = await res.json().catch(() => ({}));
                    throw new Error(errorData?.message || `Failed to schedule meeting (Status ${res.status})`);
                  }

                  const data = await res.json();
                  if (data && data.success && data.meeting) {
                    setMeetings((prev) => [...prev, data.meeting]);
                    setMeetingConfirmed(true);
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
              confirmed={meetingConfirmed}
            />
          )}

          {/* Footer CTA */}
          <div className="rounded-[32px] border border-gold/20 bg-white/5 p-8 text-center shadow-panel backdrop-blur-soft">
            <p className="text-lg text-graysoft">Building your future in the startup ecosystem</p>
            <p className="mt-3 text-xs uppercase tracking-[0.32em] text-graymuted">
              Venture Halo — Premium Founder Workspace
            </p>
          </div>
        </div>
      </div>

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
