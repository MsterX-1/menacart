using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Identity;
using Domain.Security;
namespace Domain.Models
{
    /// <summary>
    /// Extends ASP.NET Core Identity's IdentityUser. Id (inherited) is a
    /// string GUID stored as NVARCHAR(450) — Identity's own default.
    /// </summary>
    public class User : IdentityUser
    {
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        // Navigation properties
        public ICollection<RefreshToken> RefreshTokens { get; set; }
        public ICollection<Address> Addresses { get; set; }
        public SellerProfile SellerProfile { get; set; }
        public ICollection<SellerReview> SellerReviews { get; set; }
        public ICollection<Review> Reviews { get; set; }
        public Cart Cart { get; set; }
        public ICollection<Wishlist> WishlistItems { get; set; }
        public ICollection<Order> Orders { get; set; }
        public ICollection<UserCouponUsage> CouponUsages { get; set; }
        public ICollection<LoyaltyPoint> LoyaltyPoints { get; set; }
        public ICollection<Notification> Notifications { get; set; }
    }
}
