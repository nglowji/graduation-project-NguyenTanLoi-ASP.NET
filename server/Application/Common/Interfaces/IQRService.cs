namespace Application.Common.Interfaces;

public interface IQRService
{
    byte[] GenerateQRCode(string text);
    string GenerateQRCodeBase64(string text);
}
