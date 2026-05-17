import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5164/api/v1';
const signalRUrl =
  import.meta.env.VITE_SIGNALR_URL ||
  `${apiUrl.replace(/\/api\/v1\/?$/, '').replace(/\/$/, '')}/hubs/booking`;

class SignalRService {
  private connection: HubConnection | null = null;

  async startConnection() {
    if (this.connection) return;

    this.connection = new HubConnectionBuilder()
      .withUrl(signalRUrl)
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Information)
      .build();

    try {
      await this.connection.start();
      console.log('SignalR Connected.');
    } catch (err) {
      console.error('SignalR Connection Error: ', err);
      setTimeout(() => this.startConnection(), 5000);
    }
  }

  async joinPitchGroup(pitchId: string) {
    if (this.connection?.state === 'Connected') {
      await this.connection.invoke('JoinPitchGroup', pitchId);
    }
  }

  async leavePitchGroup(pitchId: string) {
    if (this.connection?.state === 'Connected') {
      await this.connection.invoke('LeavePitchGroup', pitchId);
    }
  }

  onTimeSlotStatusChanged(callback: (timeSlotId: string, status: string, date: string) => void) {
    this.connection?.on('TimeSlotStatusChanged', callback);
  }

  onBookingCreated(callback: (pitchId: string, timeSlotId: string, date: string) => void) {
    this.connection?.on('BookingCreated', callback);
  }

  onPaymentSucceeded(callback: (bookingId: string, amount: number, bookingDate: string) => void) {
    this.connection?.on('PaymentSucceeded', callback);
  }

  off(methodName: string) {
    this.connection?.off(methodName);
  }
}

export const signalRService = new SignalRService();
