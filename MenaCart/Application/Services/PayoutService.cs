using Application.DTOs.PayoutDtos;
using Application.Interfaces.IServices;
using Application.Interfaces.IUnitOfWork;
using Domain.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Application.Services
{
    public class PayoutService : IPayoutService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IPaymentGatewayService _paymentGatewayService;

        public PayoutService(IUnitOfWork unitOfWork, IPaymentGatewayService paymentGatewayService)
        {
            _unitOfWork = unitOfWork;
            _paymentGatewayService = paymentGatewayService;
        }

        public async Task<PayoutResponseDto> RequestPayoutAsync(string userId, RequestPayoutDto request)
        {
            var seller = await _unitOfWork.SellerRepository.GetByUserIdAsync(userId);
            if (seller == null)
                throw new UnauthorizedAccessException("Seller profile not found.");

            // Get settled commissions not yet requested/linked to a payout
            var commissions = await _unitOfWork.SellerCommissionRepository.GetSettledCommissionsBySellerIdAsync(seller.SellerId);
            var commissionList = commissions.ToList();
            
            if (!commissionList.Any())
                throw new InvalidOperationException("No settled commissions available for payout.");

            // Calculate total payout amount (Net Seller Funds = SaleAmount - CommissionAmount)
            var amount = commissionList.Sum(c => c.SaleAmount - c.CommissionAmount);

            await _unitOfWork.BeginTransactionAsync();
            try
            {
                var payout = new SellerPayout
                {
                    SellerId = seller.SellerId,
                    Amount = amount,
                    Status = SellerPayoutStatus.Pending,
                    PaymentMethod = request.PaymentMethod,
                    TransactionRef = string.Empty,
                    CreatedAt = DateTime.UtcNow
                };

                await _unitOfWork.SellerPayoutRepository.Add(payout);
                await _unitOfWork.CompleteAsync(); // Generates PayoutId

                // Link commissions to this payout
                foreach (var commission in commissionList)
                {
                    commission.PayoutId = payout.PayoutId;
                    await _unitOfWork.SellerCommissionRepository.Update(commission);
                }

                await _unitOfWork.CompleteAsync();
                await _unitOfWork.CommitTransactionAsync();

                return MapToDto(payout);
            }
            catch (DbUpdateConcurrencyException)
            {
                await _unitOfWork.RollbackTransactionAsync();
                throw new Exception("Payout conflict — one or more commissions have already been updated or processed by another request.");
            }
            catch
            {
                await _unitOfWork.RollbackTransactionAsync();
                throw;
            }
        }

        public async Task<decimal> GetAvailableBalanceAsync(string userId)
        {
            var seller = await _unitOfWork.SellerRepository.GetByUserIdAsync(userId);
            if (seller == null)
                throw new UnauthorizedAccessException("Seller profile not found.");

            var commissions = await _unitOfWork.SellerCommissionRepository.GetSettledCommissionsBySellerIdAsync(seller.SellerId);
            var commissionList = commissions.ToList();
            if (!commissionList.Any())
                return 0;

            return commissionList.Sum(c => c.SaleAmount - c.CommissionAmount);
        }

        public async Task<IEnumerable<PayoutResponseDto>> GetMyPayoutsAsync(string userId)
        {
            var seller = await _unitOfWork.SellerRepository.GetByUserIdAsync(userId);
            if (seller == null)
                throw new UnauthorizedAccessException("Seller profile not found.");

            var payouts = await _unitOfWork.SellerPayoutRepository.GetBySellerIdAsync(seller.SellerId);
            return payouts.Select(MapToDto);
        }

        public async Task<IEnumerable<PayoutResponseDto>> GetAllPayoutsForAdminAsync(string? statusFilter)
        {
            var payouts = await _unitOfWork.SellerPayoutRepository.GetAllPayoutsAsync(statusFilter);
            return payouts.Select(MapToDto);
        }

        public async Task<PayoutResponseDto> ReviewPayoutAsync(int payoutId, ReviewPayoutDto request)
        {
            var payout = await _unitOfWork.SellerPayoutRepository.GetById(payoutId);
            if (payout == null)
                throw new KeyNotFoundException($"Payout request with ID {payoutId} not found.");

            if (payout.Status != SellerPayoutStatus.Pending && payout.Status != SellerPayoutStatus.Processing)
                throw new InvalidOperationException($"Payout cannot be reviewed as its current status is: {payout.Status}");

            if (!Enum.TryParse<SellerPayoutStatus>(request.Status, ignoreCase: true, out var newStatus))
                throw new Exception($"Invalid payout status '{request.Status}'.");

            await _unitOfWork.BeginTransactionAsync();
            try
            {
                payout.Status = newStatus;
                payout.TransactionRef = request.TransactionRef;
                payout.PayoutDate = newStatus == SellerPayoutStatus.Paid ? DateTime.UtcNow : null;

                if (newStatus == SellerPayoutStatus.Paid && payout.PaymentMethod.Equals("Stripe", StringComparison.OrdinalIgnoreCase))
                {
                    var seller = await _unitOfWork.SellerRepository.GetById(payout.SellerId);
                    if (seller == null)
                        throw new KeyNotFoundException("Seller profile not found.");

                    if (string.IsNullOrEmpty(seller.StripeAccountId))
                        throw new InvalidOperationException("Seller does not have a Stripe Account ID configured. Configure it in their profile before paying via Stripe.");

                    try
                    {
                        var transferId = await _paymentGatewayService.CreateTransferAsync(
                            seller.StripeAccountId,
                            payout.Amount,
                            $"Payout #{payout.PayoutId} for Seller #{seller.SellerId}"
                        );
                        payout.TransactionRef = transferId;
                    }
                    catch (Exception ex)
                    {
                        throw new InvalidOperationException($"Stripe transfer failed: {ex.Message}", ex);
                    }
                }

                if (newStatus == SellerPayoutStatus.Failed)
                {
                    // If payout fails, unlink commissions so they can be requested again
                    var commissions = await _unitOfWork.SellerCommissionRepository.GetCommissionsByPayoutIdAsync(payoutId);
                    foreach (var commission in commissions)
                    {
                        commission.PayoutId = null;
                        await _unitOfWork.SellerCommissionRepository.Update(commission);
                    }
                }

                await _unitOfWork.SellerPayoutRepository.Update(payout);
                await _unitOfWork.CompleteAsync();
                await _unitOfWork.CommitTransactionAsync();

                return MapToDto(payout);
            }
            catch
            {
                await _unitOfWork.RollbackTransactionAsync();
                throw;
            }
        }

        // ── Helper Mapper ──────────────────────────────────────────────────────
        private static PayoutResponseDto MapToDto(SellerPayout p) => new()
        {
            PayoutId = p.PayoutId,
            SellerId = p.SellerId,
            Amount = p.Amount,
            Status = p.Status.ToString(),
            PaymentMethod = p.PaymentMethod,
            TransactionRef = p.TransactionRef,
            PayoutDate = p.PayoutDate,
            CreatedAt = p.CreatedAt
        };
    }
}
