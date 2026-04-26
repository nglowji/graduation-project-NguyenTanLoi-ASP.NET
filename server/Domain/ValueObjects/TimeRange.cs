namespace Domain.ValueObjects;

public record TimeRange
{
    public TimeSpan StartTime { get; init; }
    public TimeSpan EndTime { get; init; }

    private TimeRange(TimeSpan startTime, TimeSpan endTime)
    {
        StartTime = startTime;
        EndTime = endTime;
    }

    public static TimeRange Create(TimeSpan startTime, TimeSpan endTime)
    {
        if (startTime >= endTime)
            throw new ArgumentException("Start time must be before end time");

        if (startTime < TimeSpan.Zero || startTime >= TimeSpan.FromHours(24))
            throw new ArgumentException("Start time must be between 00:00 and 23:59", nameof(startTime));

        if (endTime <= TimeSpan.Zero || endTime > TimeSpan.FromHours(24))
            throw new ArgumentException("End time must be between 00:01 and 24:00", nameof(endTime));

        return new TimeRange(startTime, endTime);
    }

    public TimeSpan Duration => EndTime - StartTime;

    public bool OverlapsWith(TimeRange other)
    {
        return StartTime < other.EndTime && EndTime > other.StartTime;
    }

    public bool Contains(TimeSpan time)
    {
        return time >= StartTime && time < EndTime;
    }

    public override string ToString() => $"{StartTime:hh\\:mm} - {EndTime:hh\\:mm}";
}
