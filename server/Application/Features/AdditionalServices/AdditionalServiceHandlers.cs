using Application.Common.Interfaces;
using Application.Common.DTOs;
using Application.Features.AdditionalServices.DTOs;
using Application.Features.AdditionalServices.Queries.GetOwnerServices;
using Application.Features.AdditionalServices.Commands.CreateService;
using Application.Features.AdditionalServices.Commands.UpdateService;
using Application.Features.AdditionalServices.Commands.DeleteService;
using Domain.Entities;
using Domain.ValueObjects;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.AdditionalServices;

public class ServiceHandlers : 
    IRequestHandler<GetOwnerServicesQuery, Result<List<ServiceDto>>>,
    IRequestHandler<CreateServiceCommand, Result<Guid>>,
    IRequestHandler<UpdateServiceCommand, Result<Unit>>,
    IRequestHandler<DeleteServiceCommand, Result<Unit>>
{
    private readonly IApplicationDbContext _context;

    public ServiceHandlers(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<List<ServiceDto>>> Handle(GetOwnerServicesQuery request, CancellationToken cancellationToken)
    {
        var sportCenterId = await GetSportCenterId(request.OwnerId, cancellationToken);
        if (sportCenterId == Guid.Empty) return Result<List<ServiceDto>>.Success(new List<ServiceDto>());

        var services = await _context.AdditionalServices
            .Where(s => s.SportCenterId == sportCenterId)
            .Select(s => new ServiceDto(s.Id, s.Name, s.Price.Amount, s.Icon, s.StockQuantity, s.ImageUrl, s.IsActive))
            .ToListAsync(cancellationToken);

        return Result<List<ServiceDto>>.Success(services);
    }

    public async Task<Result<Guid>> Handle(CreateServiceCommand request, CancellationToken cancellationToken)
    {
        var sportCenterId = await GetSportCenterId(request.OwnerId, cancellationToken);
        if (sportCenterId == Guid.Empty) return Result<Guid>.Failure("Owner must create at least one stadium first.");

        var service = AdditionalService.Create(
            sportCenterId, 
            request.Name, 
            Money.Create(request.Price), 
            request.Icon,
            request.StockQuantity,
            request.ImageUrl);
            
        service.ToggleActive(request.IsActive);
            
        _context.AdditionalServices.Add(service);
        await _context.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Success(service.Id);
    }

    public async Task<Result<Unit>> Handle(UpdateServiceCommand request, CancellationToken cancellationToken)
    {
        var service = await _context.AdditionalServices
            .FirstOrDefaultAsync(s => s.Id == request.Id, cancellationToken);

        if (service == null) return Result<Unit>.Failure("Service not found");

        service.Update(
            request.Name, 
            Money.Create(request.Price), 
            request.Icon,
            request.StockQuantity,
            request.ImageUrl);
            
        service.ToggleActive(request.IsActive);

        await _context.SaveChangesAsync(cancellationToken);
        return Result<Unit>.Success(Unit.Value);
    }

    public async Task<Result<Unit>> Handle(DeleteServiceCommand request, CancellationToken cancellationToken)
    {
        var service = await _context.AdditionalServices
            .FirstOrDefaultAsync(s => s.Id == request.Id, cancellationToken);

        if (service == null) return Result<Unit>.Failure("Service not found");

        _context.AdditionalServices.Remove(service);
        await _context.SaveChangesAsync(cancellationToken);
        return Result<Unit>.Success(Unit.Value);
    }

    private async Task<Guid> GetSportCenterId(Guid ownerId, CancellationToken ct)
    {
        // Try direct link first (newly added OwnerId property)
        var center = await _context.SportCenters
            .FirstOrDefaultAsync(sc => sc.OwnerId == ownerId, ct);
        if (center != null) return center.Id;

        // Fallback to pitch link (legacy way)
        var pitch = await _context.Pitches
            .FirstOrDefaultAsync(p => p.OwnerId == ownerId, ct);
        return pitch?.SportCenterId ?? Guid.Empty;
    }
}
