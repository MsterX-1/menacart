using API.Extensions;
using Application.DTOs.SellerDtos;
using Application.Interfaces.IUnitOfWork;
using Domain.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Linq;
using System.Threading.Tasks;

namespace API.Controllers
{
    [ApiController]
    [Route("api/seller/shipping-rules")]
    [Authorize(Roles = "Seller")]
    public class ShippingRulesController : ControllerBase
    {
        private readonly IUnitOfWork _unitOfWork;

        public ShippingRulesController(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        [HttpGet]
        public async Task<IActionResult> GetMyRules()
        {
            var userId = User.GetUserId();
            var seller = await _unitOfWork.SellerRepository.GetByUserIdAsync(userId);
            if (seller == null) return Unauthorized(new { message = "Seller profile not found." });

            var rules = await _unitOfWork.SellerShippingRuleRepository.GetBySellerIdAsync(seller.SellerId);
            var result = rules.Select(r => new SellerShippingRuleDto
            {
                RuleId = r.RuleId,
                City = r.City ?? "",
                Country = r.Country,
                ShippingCost = r.ShippingCost,
                FreeShippingAbove = r.FreeShippingAbove,
                EstimatedDays = r.EstimatedDays
            });

            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> CreateRule([FromBody] CreateShippingRuleDto request)
        {
            var userId = User.GetUserId();
            var seller = await _unitOfWork.SellerRepository.GetByUserIdAsync(userId);
            if (seller == null) return Unauthorized(new { message = "Seller profile not found." });

            var rule = new SellerShippingRule
            {
                SellerId = seller.SellerId,
                City = request.City,
                Country = request.Country,
                ShippingCost = request.ShippingCost,
                FreeShippingAbove = request.FreeShippingAbove,
                EstimatedDays = request.EstimatedDays
            };

            await _unitOfWork.SellerShippingRuleRepository.Add(rule);
            await _unitOfWork.CompleteAsync();

            return Ok(new { message = "Shipping rule created successfully.", ruleId = rule.RuleId });
        }

        [HttpDelete("{ruleId}")]
        public async Task<IActionResult> DeleteRule(int ruleId)
        {
            var userId = User.GetUserId();
            var seller = await _unitOfWork.SellerRepository.GetByUserIdAsync(userId);
            if (seller == null) return Unauthorized(new { message = "Seller profile not found." });

            var rule = await _unitOfWork.SellerShippingRuleRepository.GetById(ruleId);
            if (rule == null || rule.SellerId != seller.SellerId)
                return NotFound(new { message = "Rule not found." });

            await _unitOfWork.SellerShippingRuleRepository.Delete(ruleId);
            await _unitOfWork.CompleteAsync();

            return Ok(new { message = "Rule deleted successfully." });
        }
    }
}
