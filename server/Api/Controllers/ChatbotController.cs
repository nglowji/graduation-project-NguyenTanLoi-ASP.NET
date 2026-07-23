using Application.Features.Chatbot.Commands.AskChatbot;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[Route("api/v1/chatbot")]
[ApiController]
public class ChatbotController : ControllerBase
{
    private readonly IMediator _mediator;

    public ChatbotController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost("ask")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(AskChatbotResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Ask(
        [FromBody] AskRequest request,
        CancellationToken cancellationToken)
    {
        if (request == null || string.IsNullOrWhiteSpace(request.Message))
        {
            return BadRequest(new { error = "Message is required." });
        }

        var command = new AskChatbotCommand
        {
            Message = request.Message
        };

        var response = await _mediator.Send(command, cancellationToken);
        return Ok(response);
    }
}

public class AskRequest
{
    public string Message { get; set; } = null!;
}
