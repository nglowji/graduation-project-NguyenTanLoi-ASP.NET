import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { API_URL } from './api';

const signalRUrl =
  import.meta.env.VITE_SIGNALR_URL ||
  `${API_URL.replace(/\/api\/v1\/?$/, '').replace(/\/$/, '')}/hubs/booking`;

class SignalRService {
  private connection: HubConnection | null = null;
  private reconnectTimer: number | null = null;

  async startConnection() {
    if (this.connection) return;
    this.clearReconnectTimer();

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
      this.connection = null;
      this.reconnectTimer = window.setTimeout(() => {
        this.reconnectTimer = null;
        void this.startConnection();
      }, 5000);
    }
  }

  async stopConnection() {
    this.clearReconnectTimer();
    if (!this.connection) return;

    const currentConnection = this.connection;
    this.connection = null;
    await currentConnection.stop().catch(() => undefined);
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

  private clearReconnectTimer() {
    if (this.reconnectTimer === null) return;
    window.clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
  }
}

export const signalRService = new SignalRService();
