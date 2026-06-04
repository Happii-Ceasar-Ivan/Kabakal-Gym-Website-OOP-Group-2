namespace KabakalGym.API.DTOs.Common;

/// <summary>
/// PagedResultDto&lt;T&gt;
/// Standard pagination envelope returned by all list endpoints.
///
/// Frontend consumption pattern:
///   - Items:        the current page's data rows
///   - TotalCount:   total record count across all pages (for "Showing X of Y" UI)
///   - Page:         current page number (1-based)
///   - PageSize:     records per page (server-enforced, max 50)
///   - TotalPages:   computed — total number of pages
///   - HasNextPage:  computed — whether a "Next" button should appear
///   - HasPreviousPage: computed — whether a "Previous" button should appear
/// </summary>
public sealed record PagedResultDto<T>(
    IReadOnlyList<T> Items,
    int              TotalCount,
    int              Page,
    int              PageSize
)
{
    public int  TotalPages      => PageSize > 0 ? (int)Math.Ceiling((double)TotalCount / PageSize) : 0;
    public bool HasNextPage     => Page < TotalPages;
    public bool HasPreviousPage => Page > 1;

    /// <summary>
    /// Factory — creates a paged result from a pre-counted query.
    /// Call CountAsync() first, then Skip/Take + ToListAsync() to avoid
    /// double-enumeration of the IQueryable.
    /// </summary>
    public static PagedResultDto<T> Create(IReadOnlyList<T> items, int totalCount, int page, int pageSize)
        => new(items, totalCount, page, pageSize);

    /// <summary>Factory — creates an empty paged result (no rows, same metadata).</summary>
    public static PagedResultDto<T> Empty(int page, int pageSize)
        => new([], 0, page, pageSize);
}
