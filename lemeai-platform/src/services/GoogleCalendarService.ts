import type { CalendarEvent } from '../components/AgendaEventModal';

const BASE_URL = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';

interface GoogleEvent {
    id: string;
    summary: string;
    description?: string;
    start: {
        dateTime?: string;
        date?: string;
    };
    end: {
        dateTime?: string;
        date?: string;
    };
    hangoutLink?: string;
    attendees?: Array<{ email: string }>;
}

export const GoogleCalendarService = {
    async getEvents(token: string): Promise<CalendarEvent[]> {
        const timeMin = new Date();
        timeMin.setMonth(timeMin.getMonth() - 6); // Fetch last 6 months to reduce payload

        const response = await fetch(`${BASE_URL}?maxResults=2500&singleEvents=true&orderBy=startTime&timeMin=${timeMin.toISOString()}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch events from Google Calendar');
        }

        const data = await response.json();
        const items: GoogleEvent[] = data.items || [];

        return items.map(item => {
            const isAllDay = !!item.start.date;

            // Standardize to JavaScript Date objects
            // If all-day event, Google returns YYYY-MM-DD
            const startTime = isAllDay ? new Date(item.start.date!) : new Date(item.start.dateTime!);
            let endTime = isAllDay ? new Date(item.end.date!) : new Date(item.end.dateTime!);

            // Google Calendar stores all-day end dates as the next day at 00:00. React Big Calendar often wants the exact day.
            // But we keep it exact to the Date for React Big Calendar. 
            if (isAllDay) {
                // Adjust for timezone offset to ensure it lands on the right day locally if needed, 
                // but Date(YYYY-MM-DD) parses as UTC midnight.
                // React-big-calendar typically handles Date objects well.
                startTime.setMinutes(startTime.getMinutes() + startTime.getTimezoneOffset());
                endTime.setMinutes(endTime.getMinutes() + endTime.getTimezoneOffset());
            }

            return {
                id: item.id,
                title: item.summary || 'Sem Título',
                start: startTime,
                end: endTime,
                description: item.description || '',
                allDay: isAllDay,
                meetLink: item.hangoutLink,
                attendees: item.attendees?.map(a => a.email)
            };
        });
    },

    async createEvent(token: string, event: CalendarEvent): Promise<CalendarEvent> {
        const body: any = {
            summary: event.title,
            description: event.description || '',
            start: {
                dateTime: event.start.toISOString()
            },
            end: {
                dateTime: event.end.toISOString()
            }
        };

        if (event.attendees && event.attendees.length > 0) {
            body.attendees = event.attendees.map(email => ({ email: email.trim() }));
        }

        if (event.createMeet) {
            body.conferenceData = {
                createRequest: {
                    requestId: Math.random().toString(36).substring(7),
                    conferenceSolutionKey: { type: "hangoutsMeet" }
                }
            };
        }

        const url = event.createMeet ? `${BASE_URL}?conferenceDataVersion=1` : BASE_URL;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            throw new Error(`Failed to create event: ${await response.text()}`);
        }

        const data: GoogleEvent = await response.json();

        return {
            ...event,
            id: data.id // Use the Google-generated ID to keep them linked
        };
    },

    async updateEvent(token: string, event: CalendarEvent): Promise<CalendarEvent> {
        if (!event.id) throw new Error("Event ID missing");

        const body: any = {
            summary: event.title,
            description: event.description || '',
            start: {
                dateTime: event.start.toISOString()
            },
            end: {
                dateTime: event.end.toISOString()
            }
        };

        if (event.attendees && event.attendees.length > 0) {
            body.attendees = event.attendees.map(email => ({ email: email.trim() }));
        }

        if (event.createMeet && !event.meetLink) {
            body.conferenceData = {
                createRequest: {
                    requestId: Math.random().toString(36).substring(7),
                    conferenceSolutionKey: { type: "hangoutsMeet" }
                }
            };
        }

        const url = event.createMeet ? `${BASE_URL}/${event.id}?conferenceDataVersion=1` : `${BASE_URL}/${event.id}`;

        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            throw new Error(`Failed to update event: ${await response.text()}`);
        }

        const data: GoogleEvent = await response.json();

        return {
            ...event,
            meetLink: data.hangoutLink || event.meetLink
        };
    },

    async deleteEvent(token: string, eventId: string): Promise<void> {
        const response = await fetch(`${BASE_URL}/${eventId}`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to delete event: ${await response.text()}`);
        }
    }
};
