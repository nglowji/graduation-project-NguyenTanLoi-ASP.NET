namespace Api.Contracts;

public record RegisterOwnerCenterRequest(
    string BusinessName,
    string PhoneNumber,
    string Street,
    string Ward,
    string District,
    string City
);
