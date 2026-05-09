using Domain.Common;
using Domain.ValueObjects;

namespace Domain.Entities;

public class Voucher : BaseEntity, IAggregateRoot
{
    private Voucher() { }

    public Voucher(string code, string description, decimal discountAmount, decimal minimumOrderAmount, DateTime expiryDate, int usageLimit)
    {
        Code = code;
        Description = description;
        DiscountAmount = discountAmount;
        MinimumOrderAmount = minimumOrderAmount;
        ExpiryDate = expiryDate;
        UsageLimit = usageLimit;
        UsageCount = 0;
        IsActive = true;
    }

    public string Code { get; private set; } = null!;
    public string Description { get; private set; } = null!;
    public decimal DiscountAmount { get; private set; }
    public decimal MinimumOrderAmount { get; private set; }
    public DateTime ExpiryDate { get; private set; }
    public int UsageLimit { get; private set; }
    public int UsageCount { get; private set; }
    public bool IsActive { get; private set; }

    public bool CanBeUsed(decimal orderAmount)
    {
        return IsActive && 
               DateTime.UtcNow <= ExpiryDate && 
               UsageCount < UsageLimit && 
               orderAmount >= MinimumOrderAmount;
    }

    public void Use()
    {
        UsageCount++;
    }
}
