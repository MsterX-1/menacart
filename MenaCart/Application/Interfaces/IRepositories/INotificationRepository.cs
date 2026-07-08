using Domain.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Application.Interfaces.IRepositories
{
    public interface INotificationRepository : IGenaricRepository<Notification>
    {
        Task<IEnumerable<Notification>> GetByUserIdAsync(string userId);
        Task<IEnumerable<Notification>> GetUnreadByUserIdAsync(string userId);
        Task MarkAllAsReadForUserAsync(string userId);
    }
}
