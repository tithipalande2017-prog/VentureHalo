/**
 * Timezone Detection and Management Utility
 * 
 * This utility provides automatic timezone detection using the browser's
 * Intl.DateTimeFormat API, which returns IANA timezone identifiers.
 * 
 * Supports all global timezones automatically without hardcoding.
 */

/**
 * Detect the user's timezone using browser API
 * @returns {string} IANA timezone identifier (e.g., "Asia/Kolkata", "America/New_York")
 */
export function detectTimezone() {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    console.log('[Timezone] Detected timezone:', timezone);
    return timezone;
  } catch (error) {
    console.error('[Timezone] Failed to detect timezone:', error);
    // Fallback to UTC if detection fails
    return 'UTC';
  }
}

/**
 * Validate if a string is a valid IANA timezone identifier
 * @param {string} timezone - Timezone string to validate
 * @returns {boolean} True if valid, false otherwise
 */
export function isValidTimezone(timezone) {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Convert a UTC date string to local time in the specified timezone
 * @param {string} utcDateString - ISO date string in UTC
 * @param {string} timezone - IANA timezone identifier
 * @returns {Date} Date object in the specified timezone
 */
export function convertUTCToTimezone(utcDateString, timezone) {
  try {
    const date = new Date(utcDateString);
    const options = {
      timeZone: timezone,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: false
    };
    
    const formatter = new Intl.DateTimeFormat('en-US', options);
    const parts = formatter.formatToParts(date);
    
    const year = parseInt(parts.find(p => p.type === 'year').value);
    const month = parseInt(parts.find(p => p.type === 'month').value) - 1;
    const day = parseInt(parts.find(p => p.type === 'day').value);
    const hour = parseInt(parts.find(p => p.type === 'hour').value);
    const minute = parseInt(parts.find(p => p.type === 'minute').value);
    const second = parseInt(parts.find(p => p.type === 'second').value);
    
    return new Date(year, month, day, hour, minute, second);
  } catch (error) {
    console.error('[Timezone] Failed to convert UTC to timezone:', error);
    return new Date(utcDateString);
  }
}

/**
 * Format a date for display in the user's local timezone
 * @param {string} utcDateString - ISO date string in UTC
 * @param {string} timezone - IANA timezone identifier
 * @returns {string} Formatted date string
 */
export function formatLocalTime(utcDateString, timezone) {
  try {
    const date = new Date(utcDateString);
    const options = {
      timeZone: timezone,
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    };
    
    return new Intl.DateTimeFormat('en-US', options).format(date);
  } catch (error) {
    console.error('[Timezone] Failed to format local time:', error);
    return date.toLocaleString();
  }
}

/**
 * Get a list of common timezones (for manual selection)
 * This is not an exhaustive list, but covers major regions
 * @returns {Array<string>} Array of IANA timezone identifiers
 */
export function getCommonTimezones() {
  return [
    // Africa
    'Africa/Cairo',
    'Africa/Johannesburg',
    'Africa/Lagos',
    'Africa/Nairobi',
    
    // Asia
    'Asia/Bangkok',
    'Asia/Dubai',
    'Asia/Hong_Kong',
    'Asia/Jakarta',
    'Asia/Kolkata',
    'Asia/Seoul',
    'Asia/Shanghai',
    'Asia/Singapore',
    'Asia/Tokyo',
    
    // Australia
    'Australia/Sydney',
    'Australia/Melbourne',
    
    // Europe
    'Europe/Berlin',
    'Europe/London',
    'Europe/Paris',
    'Europe/Moscow',
    'Europe/Rome',
    'Europe/Zurich',
    
    // North America
    'America/Chicago',
    'America/Los_Angeles',
    'America/New_York',
    'America/Toronto',
    'America/Vancouver',
    
    // South America
    'America/Sao_Paulo',
    'America/Buenos_Aires',
    'America/Lima',
    
    // UTC
    'UTC'
  ];
}
