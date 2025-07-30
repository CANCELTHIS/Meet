export async function fetchCalendarEvents(token) {
  try {
    // First get the user's calendar list
    const calendarListResponse = await fetch(
      "https://www.googleapis.com/calendar/v3/users/me/calendarList",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const calendarList = await calendarListResponse.json();
    if (!calendarList.items || calendarList.items.length === 0) {
      return [];
    }

    // Get events from primary calendar
    const now = new Date();
    const oneWeekLater = new Date();
    oneWeekLater.setDate(now.getDate() + 7);

    const eventsResponse = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
        `timeMin=${now.toISOString()}&timeMax=${oneWeekLater.toISOString()}&singleEvents=true&orderBy=startTime`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const eventsData = await eventsResponse.json();
    return eventsData.items || [];
  } catch (error) {
    console.error("Error fetching calendar events:", error);
    throw error;
  }
}

export function formatCalendarEvents(googleEvents) {
  return googleEvents.map((event) => ({
    id: event.id,
    title: event.summary || "No title",
    startTime: formatEventTime(event.start),
    endTime: formatEventTime(event.end),
    agenda: event.description || "No agenda provided",
    attendees: event.attendees ? event.attendees.map((a) => a.email) : [],
    location: event.location || "Online",
  }));
}

function formatEventTime(timeObj) {
  if (!timeObj) return "Unknown time";
  const date = timeObj.dateTime
    ? new Date(timeObj.dateTime)
    : new Date(timeObj.date);
  return date.toLocaleString();
}
