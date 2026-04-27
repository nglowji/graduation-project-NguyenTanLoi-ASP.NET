using System.Net;
using System.Text.Json;
using Application.Common.Exceptions;
using Domain.Exceptions;
using Microsoft.AspNetCore.Mvc;

namespace Api.Middlewares;

public class GlobalExceptionHandlerMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionHandlerMiddleware> _logger;
    private readonly IHostEnvironment _environment;

    public GlobalExceptionHandlerMiddleware(
        RequestDelegate next,
        ILogger<GlobalExceptionHandlerMiddleware> logger,
        IHostEnvironment environment)
    {
        _next = next;
        _logger = logger;
        _environment = environment;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An unhandled exception occurred");
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/problem+json";

        var (statusCode, problemDetails) = exception switch
        {
            DomainException domainEx => (
                StatusCodes.Status400BadRequest,
                new ProblemDetails
                {
                    Title = "Domain Error",
                    Detail = domainEx.Message,
                    Status = StatusCodes.Status400BadRequest,
                    Instance = context.Request.Path
                }
            ),
            NotFoundException notFoundEx => (
                StatusCodes.Status404NotFound,
                new ProblemDetails
                {
                    Title = "Resource Not Found",
                    Detail = notFoundEx.Message,
                    Status = StatusCodes.Status404NotFound,
                    Instance = context.Request.Path
                }
            ),
            ValidationException validationEx => (
                StatusCodes.Status422UnprocessableEntity,
                new ValidationProblemDetails(validationEx.Errors)
                {
                    Title = "Validation Error",
                    Status = StatusCodes.Status422UnprocessableEntity,
                    Instance = context.Request.Path
                }
            ),
            _ => (
                StatusCodes.Status500InternalServerError,
                new ProblemDetails
                {
                    Title = "Internal Server Error",
                    Detail = _environment.IsDevelopment()
                        ? exception.Message
                        : "An unexpected error occurred",
                    Status = StatusCodes.Status500InternalServerError,
                    Instance = context.Request.Path
                }
            )
        };

        context.Response.StatusCode = statusCode;
        await context.Response.WriteAsJsonAsync(problemDetails);
    }
}
