// Business hours configuration
export const BUSINESS_HOURS = {
  // Day of week (0 = Sunday, 6 = Saturday)
  0: null, // Sunday - closed
  1: { start: "09:00", end: "18:00" }, // Monday
  2: { start: "09:00", end: "18:00" }, // Tuesday
  3: { start: "09:00", end: "18:00" }, // Wednesday
  4: { start: "09:00", end: "18:00" }, // Thursday
  5: { start: "09:00", end: "18:00" }, // Friday
  6: { start: "10:00", end: "16:00" }, // Saturday
} as const;

// Slot interval in minutes
export const SLOT_INTERVAL = 30;

// Minimum hours in advance to book
export const MIN_ADVANCE_HOURS = 2;

// Maximum days in advance to book
export const MAX_ADVANCE_DAYS = 30;

// Timezone
export const TIMEZONE = "America/Chicago";
