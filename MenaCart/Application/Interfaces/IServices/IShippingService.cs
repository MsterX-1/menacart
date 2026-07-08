using Domain.Models;
using System.Threading.Tasks;

namespace Application.Interfaces.IServices
{
    public interface IShippingService
    {
        Task<decimal> CalculateShippingCostAsync(Address address);
    }
}
