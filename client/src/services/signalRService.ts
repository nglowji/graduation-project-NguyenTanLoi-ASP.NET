import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';

class SignalRService {
  private connection: HubConnection | null = null;

  async startConnection() {
    if (this.connection) return;

    this.connection = new HubConnectionBuilder()
      .withUrl(`${import.meta.env.VITE_API_URL || 'http://localhost:5167'}/hubs/booking`)
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

  off(methodName: string) {
    this.connection?.off(methodName);
  }
}

export const signalRService = new SignalRService();
