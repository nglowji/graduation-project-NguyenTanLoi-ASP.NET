namespace Application.Common.DTOs;

/// <summary>
/// Immutable paged result wrapper providing pagination metadata.
/// </summary>
public class PagedResult<T>
{
    public IReadOnlyList<T> Items { get; }
    public int PageNumber { get; }
    public int PageSize { get; }
    public int TotalPages { get; }
    public int TotalCount { get; }
    public bool HasPreviousPage => PageNumber > 1;
    public bool HasNextPage => PageNumber < TotalPages;

    public PagedResult(IReadOnlyList<T> items, int totalCount, int pageNumber, int pageSize)
    {
        Items = items ?? Array.Empty<T>();
        TotalCount = totalCount;
        PageNumber = pageNumber;
        PageSize = pageSize;
        TotalPages = pageSize > 0 ? (int)Math.Ceiling(totalCount / (double)pageSize) : 0;
    }

    /// <summary>
    /// Creates an empty paged result.
    /// </summary>
    public static PagedResult<T> Empty(int pageNumber = 1, int pageSize = 20) =>
        new(Array.Empty<T>(), 0, pageNumber, pageSize);
}
