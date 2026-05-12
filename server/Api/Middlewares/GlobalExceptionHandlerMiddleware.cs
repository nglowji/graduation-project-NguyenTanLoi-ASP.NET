using System.Net;
using System.Text.Json;
using Application.Common.DTOs;
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
        context.Response.ContentType = "application/json";

        var (statusCode, message, errors) = exception switch
        {
            DomainException domainEx => (
                StatusCodes.Status400BadRequest,
                domainEx.Message,
                null
            ),
            NotFoundException notFoundEx => (
                StatusCodes.Status404NotFound,
                notFoundEx.Message,
                null
            ),
            ValidationException validationEx => (
                StatusCodes.Status400BadRequest,
                "Validation failed",
                validationEx.Errors.SelectMany(x => x.Value).ToList()
            ),
            _ => (
                StatusCodes.Status500InternalServerError,
                _environment.IsDevelopment() ? exception.Message : "An unexpected error occurred",
                _environment.IsDevelopment() ? new List<string> { exception.StackTrace ?? "" } : null
            )
        };

        context.Response.StatusCode = statusCode;
        var response = ApiResponse.FailureResponse(message, errors);
        await context.Response.WriteAsJsonAsync(response);
    }
}
