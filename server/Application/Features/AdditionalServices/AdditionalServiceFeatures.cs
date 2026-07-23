using MediatR;
using Application.Common.DTOs;

namespace Application.Features.AdditionalServices.DTOs
{
    public record ServiceDto(Guid Id, string Name, decimal Price, string Icon, int StockQuantity, string? ImageUrl, bool IsActive, string Status, Guid SportCenterId);
}

namespace Application.Features.AdditionalServices.Queries.GetOwnerServices
{
    using Application.Features.AdditionalServices.DTOs;
    public record GetOwnerServicesQuery(Guid OwnerId) : IRequest<Result<List<ServiceDto>>>;
}

namespace Application.Features.AdditionalServices.Commands.CreateService
{
    public record CreateServiceCommand : IRequest<Result<Guid>>
    {
        public Guid OwnerId { get; init; }
        public string Name { get; init; } = string.Empty;
        public decimal Price { get; init; }
        public string Icon { get; init; } = "💧";
        public int StockQuantity { get; init; }
        public string? ImageUrl { get; init; }
        public bool IsActive { get; init; } = true;
    }
}

namespace Application.Features.AdditionalServices.Commands.UpdateService
{
    public record UpdateServiceCommand : IRequest<Result<Unit>>
    {
        public Guid Id { get; init; }
        public Guid OwnerId { get; init; }
        public string Name { get; init; } = string.Empty;
        public decimal Price { get; init; }
        public string Icon { get; init; } = "💧";
        public int StockQuantity { get; init; }
        public string? ImageUrl { get; init; }
        public bool IsActive { get; init; }
    }
}

namespace Application.Features.AdditionalServices.Commands.DeleteService
{
    public record DeleteServiceCommand(Guid Id, Guid OwnerId) : IRequest<Result<Unit>>;
}
