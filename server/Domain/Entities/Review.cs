using Domain.Common;
using Domain.Exceptions;

namespace Domain.Entities;

public class Review : BaseEntity
{
    private const int MinRating = 1;
    private const int MaxRating = 5;
    private const int MaxCommentLength = 1000;

    private Review() { } // EF Core constructor

    private Review(Guid userId, Guid pitchId, int rating, string? comment)
    {
        UserId = userId;
        PitchId = pitchId;
        Rating = rating;
        Comment = comment;
    }

    public Guid UserId { get; private set; }
    public Guid PitchId { get; private set; }
    public int Rating { get; private set; }
    public string? Comment { get; private set; }

    public Pitch Pitch { get; private set; } = null!;

    public static Review Create(Guid userId, Guid pitchId, int rating, string? comment = null)
    {
        ValidateCreationParameters(userId, pitchId, rating, comment);
        return new Review(userId, pitchId, rating, comment);
    }

    public void Update(int rating, string? comment)
    {
        ValidateRating(rating);
        ValidateComment(comment);

        Rating = rating;
        Comment = comment;
        MarkAsUpdated();
    }

    private static void ValidateCreationParameters(Guid userId, Guid pitchId, int rating, string? comment)
    {
        if (userId == Guid.Empty)
            throw new DomainException("User ID is required");

        if (pitchId == Guid.Empty)
            throw new DomainException("Pitch ID is required");

        ValidateRating(rating);
        ValidateComment(comment);
    }

    private static void ValidateRating(int rating)
    {
        if (rating < MinRating || rating > MaxRating)
            throw new DomainException($"Rating must be between {MinRating} and {MaxRating}");
    }

    private static void ValidateComment(string? comment)
    {
        if (comment?.Length > MaxCommentLength)
            throw new DomainException($"Comment cannot exceed {MaxCommentLength} characters");
    }
}
