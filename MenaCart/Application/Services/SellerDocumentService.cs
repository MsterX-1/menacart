using Application.DTOs.SellerDtos;
using Application.Interfaces.IServices;
using Application.Interfaces.IUnitOfWork;
using Domain.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Application.Services
{
    public class SellerDocumentService : ISellerDocumentService
    {
        private readonly IUnitOfWork _unitOfWork;

        public SellerDocumentService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<SellerDocumentDto> UploadDocumentAsync(string userId, string documentType, string documentUrl)
        {
            var seller = await _unitOfWork.SellerRepository.GetByUserIdAsync(userId);
            if (seller == null)
                throw new UnauthorizedAccessException("Seller profile not found. Please apply first.");

            if (seller.Status != SellerStatus.Pending && seller.Status != SellerStatus.Active)
                throw new InvalidOperationException($"Cannot upload documents while profile status is: {seller.Status}");

            var doc = new SellerDocument
            {
                SellerId = seller.SellerId,
                DocumentType = documentType,
                DocumentUrl = documentUrl,
                Status = SellerDocumentStatus.Pending,
                CreatedAt = DateTime.UtcNow
            };

            await _unitOfWork.SellerDocumentRepository.Add(doc);
            await _unitOfWork.CompleteAsync();

            return MapToDto(doc);
        }

        public async Task<IEnumerable<SellerDocumentDto>> GetMyDocumentsAsync(string userId)
        {
            var seller = await _unitOfWork.SellerRepository.GetByUserIdAsync(userId);
            if (seller == null)
                throw new UnauthorizedAccessException("Seller profile not found.");

            var docs = await _unitOfWork.SellerDocumentRepository.GetBySellerIdAsync(seller.SellerId);
            return docs.Select(MapToDto);
        }

        public async Task<IEnumerable<SellerDocumentDto>> GetSellerDocumentsAsync(int sellerId)
        {
            var docs = await _unitOfWork.SellerDocumentRepository.GetBySellerIdAsync(sellerId);
            return docs.Select(MapToDto);
        }

        public async Task<SellerDocumentDto> ReviewDocumentAsync(int documentId, ReviewSellerDocumentDto request)
        {
            var doc = await _unitOfWork.SellerDocumentRepository.GetById(documentId);
            if (doc == null)
                throw new KeyNotFoundException($"Document with ID {documentId} not found.");

            if (!Enum.TryParse<SellerDocumentStatus>(request.Status, out var status))
                throw new Exception($"Invalid status '{request.Status}'.");

            doc.Status = status;
            if (status == SellerDocumentStatus.Rejected)
            {
                doc.RejectionReason = request.RejectionReason ?? "Document rejected by admin.";
            }
            else
            {
                doc.RejectionReason = null;
            }

            await _unitOfWork.SellerDocumentRepository.Update(doc);
            await _unitOfWork.CompleteAsync();

            return MapToDto(doc);
        }

        // ── Helper Mapper ──────────────────────────────────────────────────────
        private static SellerDocumentDto MapToDto(SellerDocument sd) => new()
        {
            SellerDocumentId = sd.SellerDocumentId,
            SellerId = sd.SellerId,
            DocumentType = sd.DocumentType,
            DocumentUrl = sd.DocumentUrl,
            Status = sd.Status.ToString(),
            RejectionReason = sd.RejectionReason,
            CreatedAt = sd.CreatedAt
        };
    }
}
