using Domain.Models;
using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Interfaces.IRepositories
{
    public interface IOrderRepository : IGenaricRepository<Order>
    {
        public Task<IEnumerable<Order>> GetByUserIdAsync(string userId, int page, int pageSize);
        public Task<Order?> GetByIdWithDetailsAsync(int orderId);
    }
}
