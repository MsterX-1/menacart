using Application.DTOs.SellerDtos;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Application.Interfaces.IServices
{
    public interface ISellerDocumentService
    {
        Task<SellerDocumentDto> UploadDocumentAsync(string userId, string documentType, string documentUrl);
        Task<IEnumerable<SellerDocumentDto>> GetMyDocumentsAsync(string userId);
        Task<IEnumerable<SellerDocumentDto>> GetSellerDocumentsAsync(int sellerId);
        Task<SellerDocumentDto> ReviewDocumentAsync(int documentId, ReviewSellerDocumentDto request);
    }
}
