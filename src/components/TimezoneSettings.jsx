import { useState, useEffect } from 'react';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { detectTimezone, getCommonTimezones, isValidTimezone } from '../utils/timezone';

function TimezoneSettings({ user, onClose }) {
  const [currentTimezone, setCurrentTimezone] = useState('');
  const [selectedTimezone, setSelectedTimezone] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadUserTimezone = async () => {
      if (!user?.uid) return;
      
      try {
        const db = getFirestore();
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const tz = userData.timezone || detectTimezone();
          setCurrentTimezone(tz);
          setSelectedTimezone(tz);
        }
      } catch (error) {
        console.error('Failed to load timezone:', error);
        setError('Failed to load timezone settings');
      } finally {
        setLoading(false);
      }
    };
    
    loadUserTimezone();
  }, [user]);

  const handleSave = async () => {
    if (!user?.uid || !selectedTimezone) return;
    
    setSaving(true);
    setError(null);
    
    try {
      const db = getFirestore();
      const userDocRef = doc(db, 'users', user.uid);
      
      await updateDoc(userDocRef, {
        timezone: selectedTimezone,
        updatedAt: new Date().toISOString()
      });
      
      setCurrentTimezone(selectedTimezone);
      console.log('[TimezoneSettings] Timezone updated to:', selectedTimezone);
      onClose();
    } catch (error) {
      console.error('Failed to update timezone:', error);
      setError('Failed to update timezone');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8 backdrop-blur-sm">
        <div className="w-full max-w-lg rounded-[32px] border border-white/10 bg-[#0d0d12]/95 p-8 shadow-panel backdrop-blur-soft">
          <p className="text-center text-graysoft">Loading timezone settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-[32px] border border-white/10 bg-[#0d0d12]/95 p-8 shadow-panel backdrop-blur-soft">
        <button onClick={onClose} className="absolute right-5 top-5 text-sm uppercase tracking-[0.24em] text-graymuted transition hover:text-gold">
          Close
        </button>
        
        <div className="space-y-4">
          <p className="text-sm uppercase tracking-[0.32em] text-graymuted">Timezone Settings</p>
          <h2 className="text-3xl font-semibold text-white">Manage Your Timezone</h2>
        </div>

        <div className="mt-8 space-y-6">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-graymuted">Current Timezone</p>
            <p className="mt-2 text-base text-white">{currentTimezone}</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-graysoft">
              <span className="text-xs uppercase tracking-[0.3em] text-graymuted">Select Timezone</span>
            </label>
            <select
              value={selectedTimezone}
              onChange={(e) => setSelectedTimezone(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition duration-200 focus:border-gold/40"
            >
              <option value="">-- Select Timezone --</option>
              {getCommonTimezones().map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-graysoft">
              <span className="text-xs uppercase tracking-[0.3em] text-graymuted">Or Enter Custom Timezone</span>
            </label>
            <input
              type="text"
              value={selectedTimezone}
              onChange={(e) => setSelectedTimezone(e.target.value)}
              placeholder="e.g., Asia/Tokyo, Europe/Paris"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition duration-200 focus:border-gold/40"
            />
            <p className="text-xs text-graymuted">
              Use IANA timezone identifiers (e.g., Asia/Kolkata, America/New_York)
            </p>
          </div>

          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}

          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="flex-1 rounded-full border border-white/10 bg-white/5 py-3 text-sm font-semibold uppercase tracking-[0.15em] text-white transition duration-300 hover:border-white/20 hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !isValidTimezone(selectedTimezone)}
              className="flex-1 rounded-full border border-gold/20 bg-white/5 px-6 py-3 text-sm font-semibold uppercase tracking-[0.15em] text-gold shadow-glow transition duration-300 hover:border-gold/40 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TimezoneSettings;
