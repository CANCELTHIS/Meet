export interface CalendarEvent {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  agenda: string;
  attendees: string[];
  location: string;
}

export interface MeetingDetails {
  title: string;
  agenda: string;
  startTime?: string;
  attendees?: string[];
}

export interface MeetingSummary {
  summary: string;
  keyDecisions: string[];
  actionItems: {
    task: string;
    owner: string;
    deadline: string;
  }[];
}

export enum AppStep {
  Initial,
  Recording,
  Summarizing,
  Result,
}
