import { google } from "googleapis";

/**
 * Google Calendar integration using a Service Account.
 *
 * Setup:
 * 1. Create a Google Cloud project
 * 2. Enable Google Calendar API
 * 3. Create a Service Account and download the JSON key
 * 4. Share Roxanna's Google Calendar with the service account email
 * 5. Set environment variables:
 *    - GOOGLE_CALENDAR_ID (Roxanna's calendar ID, usually her email)
 *    - GOOGLE_SERVICE_ACCOUNT_EMAIL
 *    - GOOGLE_PRIVATE_KEY (from the JSON key file)
 */

function getCalendarClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const calendarId = process.env.GOOGLE_CALENDAR_ID;

  if (!email || !key || !calendarId) {
    return null;
  }

  const auth = new google.auth.JWT({
    email,
    key,
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });

  return { calendar: google.calendar({ version: "v3", auth }), calendarId };
}

/**
 * Create an event on the business Google Calendar
 */
export async function createGoogleCalendarEvent(event: {
  title: string;
  description: string;
  location: string;
  date: string;
  startTime: string;
  endTime: string;
}): Promise<string | null> {
  const client = getCalendarClient();
  if (!client) {
    console.warn("Google Calendar not configured, skipping event creation.");
    return null;
  }

  const startDateTime = `${event.date}T${event.startTime}:00`;
  const endDateTime = `${event.date}T${event.endTime}:00`;

  const res = await client.calendar.events.insert({
    calendarId: client.calendarId,
    requestBody: {
      summary: event.title,
      description: event.description,
      location: event.location,
      start: {
        dateTime: startDateTime,
        timeZone: "America/Chicago",
      },
      end: {
        dateTime: endDateTime,
        timeZone: "America/Chicago",
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: "popup", minutes: 60 },
          { method: "popup", minutes: 15 },
        ],
      },
    },
  });

  return res.data.id ?? null;
}

/**
 * Get busy times from Google Calendar for a specific date
 */
export async function getGoogleCalendarBusyTimes(
  date: string
): Promise<Array<{ start: string; end: string }>> {
  const client = getCalendarClient();
  if (!client) return [];

  const timeMin = `${date}T00:00:00-06:00`;
  const timeMax = `${date}T23:59:59-06:00`;

  const res = await client.calendar.freebusy.query({
    requestBody: {
      timeMin,
      timeMax,
      timeZone: "America/Chicago",
      items: [{ id: client.calendarId }],
    },
  });

  const busy = res.data.calendars?.[client.calendarId]?.busy ?? [];

  return busy.map((b) => ({
    start: b.start ?? "",
    end: b.end ?? "",
  }));
}

/**
 * Delete an event from the business Google Calendar
 */
export async function deleteGoogleCalendarEvent(
  eventId: string
): Promise<void> {
  const client = getCalendarClient();
  if (!client) return;

  await client.calendar.events.delete({
    calendarId: client.calendarId,
    eventId,
  });
}
