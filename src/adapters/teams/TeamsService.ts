// Teams Service - High-level interview scheduling operations

import { getGraphClient, GraphClient } from './GraphClient.js';
import { logger } from '../../utils/logger.js';
import {
  OnlineMeetingRequest,
  OnlineMeeting,
  CalendarEvent,
  CreateMeetingOptions,
  MeetingResult,
  Subscription,
  SubscriptionRequest,
} from './types.js';

export class TeamsService {
  private graphClient: GraphClient;
  private organizerUserId: string;

  constructor(organizerUserId: string) {
    this.graphClient = getGraphClient();
    this.organizerUserId = organizerUserId;
  }

  /**
   * Schedule an interview meeting with Teams integration
   */
  async scheduleInterview(options: CreateMeetingOptions): Promise<MeetingResult> {
    logger.info(
      { subject: options.subject, candidateEmail: options.candidateEmail },
      'Scheduling interview meeting'
    );

    // Build the meeting request
    const meetingRequest: OnlineMeetingRequest = {
      subject: options.subject,
      startDateTime: options.startTime.toISOString(),
      endDateTime: options.endTime.toISOString(),
      participants: {
        attendees: [
          {
            emailAddress: {
              address: options.candidateEmail,
              name: options.candidateName,
            },
            role: 'attendee',
          },
        ],
      },
      lobbyBypassSettings: {
        scope: options.autoAdmit ? 'everyone' : 'organizer',
        isDialInBypassEnabled: options.autoAdmit,
      },
      allowedPresenters: 'organizer',
      autoAdmittedUsers: options.autoAdmit ? 'everyone' : 'organizer',
      recordAutomatically: options.recordAutomatically ?? false,
    };

    // Add manager as presenter if specified
    if (options.managerEmail) {
      meetingRequest.participants!.attendees!.push({
        emailAddress: {
          address: options.managerEmail,
          name: options.managerName,
        },
        role: 'presenter',
      });
    }

    try {
      // Create the online meeting
      const meeting = await this.graphClient.createOnlineMeeting(
        this.organizerUserId,
        meetingRequest
      );

      // Also create a calendar event for visibility
      await this.createCalendarInvite(meeting, options);

      logger.info(
        { meetingId: meeting.id, joinUrl: meeting.joinWebUrl },
        'Interview meeting scheduled successfully'
      );

      return {
        meetingId: meeting.id,
        joinUrl: meeting.joinUrl,
        joinWebUrl: meeting.joinWebUrl,
        conferenceId: meeting.audioConferencing?.conferenceId,
        dialInNumber: meeting.audioConferencing?.tollNumber,
      };
    } catch (error) {
      logger.error({ error, options }, 'Failed to schedule interview meeting');
      throw error;
    }
  }

  /**
   * Create calendar invite for the meeting
   */
  private async createCalendarInvite(
    meeting: OnlineMeeting,
    options: CreateMeetingOptions
  ): Promise<CalendarEvent> {
    const attendees: CalendarEvent['attendees'] = [
      {
        emailAddress: {
          address: options.candidateEmail,
          name: options.candidateName,
        },
        type: 'required',
      },
    ];

    if (options.managerEmail) {
      attendees.push({
        emailAddress: {
          address: options.managerEmail,
          name: options.managerName,
        },
        type: 'optional',
      });
    }

    const calendarEvent: CalendarEvent = {
      subject: options.subject,
      body: {
        contentType: 'html',
        content: this.generateInviteBody(meeting, options),
      },
      start: {
        dateTime: options.startTime.toISOString(),
        timeZone: 'UTC',
      },
      end: {
        dateTime: options.endTime.toISOString(),
        timeZone: 'UTC',
      },
      location: {
        displayName: 'Microsoft Teams Meeting',
      },
      attendees,
      isOnlineMeeting: true,
      onlineMeetingProvider: 'teamsForBusiness',
      onlineMeeting: {
        joinUrl: meeting.joinWebUrl,
      },
    };

    return this.graphClient.createCalendarEvent(this.organizerUserId, calendarEvent);
  }

  /**
   * Generate HTML body for meeting invite
   */
  private generateInviteBody(meeting: OnlineMeeting, options: CreateMeetingOptions): string {
    let body = `
      <h2>Interview Scheduled</h2>
      <p>Hello ${options.candidateName},</p>
      <p>Your interview has been scheduled. Please join using the link below at the scheduled time.</p>
      <p><strong>Subject:</strong> ${options.subject}</p>
      <p><strong>Date:</strong> ${options.startTime.toLocaleDateString()}</p>
      <p><strong>Time:</strong> ${options.startTime.toLocaleTimeString()} - ${options.endTime.toLocaleTimeString()}</p>
      <hr>
      <h3>Join Microsoft Teams Meeting</h3>
      <p><a href="${meeting.joinWebUrl}">Click here to join the meeting</a></p>
    `;

    if (meeting.audioConferencing) {
      body += `
        <p><strong>Or call in (audio only):</strong></p>
        <p>Phone: ${meeting.audioConferencing.tollNumber}</p>
        <p>Conference ID: ${meeting.audioConferencing.conferenceId}#</p>
      `;
    }

    body += `
      <hr>
      <p><em>This meeting was scheduled by AI Recruiting Assistant.</em></p>
    `;

    return body;
  }

  /**
   * Reschedule an existing interview
   */
  async rescheduleInterview(
    meetingId: string,
    newStartTime: Date,
    newEndTime: Date
  ): Promise<OnlineMeeting> {
    logger.info({ meetingId, newStartTime }, 'Rescheduling interview');

    return this.graphClient.updateOnlineMeeting(this.organizerUserId, meetingId, {
      startDateTime: newStartTime.toISOString(),
      endDateTime: newEndTime.toISOString(),
    });
  }

  /**
   * Cancel an interview meeting
   */
  async cancelInterview(meetingId: string): Promise<void> {
    logger.info({ meetingId }, 'Cancelling interview meeting');

    await this.graphClient.deleteOnlineMeeting(this.organizerUserId, meetingId);
  }

  /**
   * Get meeting details
   */
  async getMeetingDetails(meetingId: string): Promise<OnlineMeeting> {
    return this.graphClient.getOnlineMeeting(this.organizerUserId, meetingId);
  }

  /**
   * Get upcoming meetings for a time range
   */
  async getUpcomingMeetings(
    startDate: Date,
    endDate: Date
  ): Promise<CalendarEvent[]> {
    const result = await this.graphClient.listCalendarEvents(
      this.organizerUserId,
      startDate.toISOString(),
      endDate.toISOString()
    );

    return result.value;
  }

  /**
   * Subscribe to meeting events (participant joined, left, etc.)
   */
  async subscribeToMeetingEvents(
    meetingId: string,
    webhookUrl: string,
    clientState?: string
  ): Promise<Subscription> {
    const expirationDateTime = new Date();
    expirationDateTime.setHours(expirationDateTime.getHours() + 1); // 1 hour subscription

    const subscriptionRequest: SubscriptionRequest = {
      changeType: 'created,updated',
      notificationUrl: webhookUrl,
      resource: `/communications/onlineMeetings/${meetingId}`,
      expirationDateTime: expirationDateTime.toISOString(),
      clientState,
    };

    return this.graphClient.createSubscription(subscriptionRequest);
  }

  /**
   * Subscribe to calendar changes
   */
  async subscribeToCalendarChanges(
    webhookUrl: string,
    clientState?: string
  ): Promise<Subscription> {
    const expirationDateTime = new Date();
    expirationDateTime.setDate(expirationDateTime.getDate() + 3); // 3 days max for calendar

    const subscriptionRequest: SubscriptionRequest = {
      changeType: 'created,updated,deleted',
      notificationUrl: webhookUrl,
      resource: `/users/${this.organizerUserId}/calendar/events`,
      expirationDateTime: expirationDateTime.toISOString(),
      clientState,
    };

    return this.graphClient.createSubscription(subscriptionRequest);
  }

  /**
   * Renew a subscription before it expires
   */
  async renewSubscription(
    subscriptionId: string,
    hoursToExtend: number = 1
  ): Promise<Subscription> {
    const expirationDateTime = new Date();
    expirationDateTime.setHours(expirationDateTime.getHours() + hoursToExtend);

    return this.graphClient.renewSubscription(subscriptionId, expirationDateTime.toISOString());
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(subscriptionId: string): Promise<void> {
    await this.graphClient.deleteSubscription(subscriptionId);
  }
}

// Factory function to create TeamsService instances
export function createTeamsService(organizerUserId: string): TeamsService {
  return new TeamsService(organizerUserId);
}
