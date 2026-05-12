namespace Application.Common.DTOs;

/// <summary>
/// Standard API response wrapper for all controllers.
/// Implements the unified response format rule: { success, message, data }
/// </summary>
/// <typeparam name="T">The type of data being returned.</typeparam>
public class ApiResponse<T>
{
    public bool Success { get; set; }
    public string? Message { get; set; }
    public T? Data { get; set; }
    public List<string>? Errors { get; set; }

    public ApiResponse() { }

    public ApiResponse(bool success, string? message, T? data = default, List<string>? errors = null)
    {
        Success = success;
        Message = message;
        Data = data;
        Errors = errors;
    }

    public static ApiResponse<T> SuccessResponse(T data, string? message = null)
    {
        return new ApiResponse<T>(true, message, data);
    }

    public static ApiResponse<T> FailureResponse(string message, List<string>? errors = null)
    {
        return new ApiResponse<T>(false, message, default, errors);
    }
}

/// <summary>
/// Non-generic version of ApiResponse for responses without a data payload.
/// </summary>
public class ApiResponse : ApiResponse<object>
{
    public ApiResponse() { }

    public ApiResponse(bool success, string? message, object? data = null, List<string>? errors = null)
        : base(success, message, data, errors)
    {
    }

    public static ApiResponse SuccessResponse(string? message = null)
    {
        return new ApiResponse(true, message);
    }

    public static new ApiResponse FailureResponse(string message, List<string>? errors = null)
    {
        return new ApiResponse(false, message, null, errors);
    }
}
