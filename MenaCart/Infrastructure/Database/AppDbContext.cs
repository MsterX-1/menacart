using Domain.Models;
using Domain.Security;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Database
{
    public class AppDbContext : IdentityDbContext<User>
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options) { }

        public DbSet<RefreshToken> RefreshTokens { get; set; }
        public DbSet<Address> Addresses { get; set; }

        public DbSet<SellerProfile> SellerProfiles { get; set; }
        public DbSet<SellerDocument> SellerDocuments { get; set; }
        public DbSet<SellerBankInfo> SellerBankInfos { get; set; }
        public DbSet<SellerShippingRule> SellerShippingRules { get; set; }
        public DbSet<SellerReview> SellerReviews { get; set; }

        public DbSet<Category> Categories { get; set; }
        public DbSet<Product> Products { get; set; }
        public DbSet<ProductImage> ProductImages { get; set; }
        public DbSet<ProductVariant> ProductVariants { get; set; }
        public DbSet<Review> Reviews { get; set; }

        public DbSet<Cart> Carts { get; set; }
        public DbSet<CartItem> CartItems { get; set; }
        public DbSet<Wishlist> Wishlists { get; set; }

        public DbSet<Coupon> Coupons { get; set; }

        public DbSet<Order> Orders { get; set; }
        public DbSet<UserCouponUsage> UserCouponUsages { get; set; }
        public DbSet<SubOrder> SubOrders { get; set; }
        public DbSet<OrderItem> OrderItems { get; set; }
        public DbSet<Shipping> Shippings { get; set; }
        public DbSet<Return> Returns { get; set; }

        public DbSet<Payment> Payments { get; set; }

        public DbSet<SellerCommission> SellerCommissions { get; set; }
        public DbSet<SellerPayout> SellerPayouts { get; set; }

        public DbSet<LoyaltyPoint> LoyaltyPoints { get; set; }
        public DbSet<Notification> Notifications { get; set; }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            // ---- Unique constraints ----
            builder.Entity<RefreshToken>()
                .HasIndex(rt => rt.Token).IsUnique();

            builder.Entity<SellerProfile>()
                .HasIndex(sp => sp.UserId).IsUnique(); // one seller profile per user

            builder.Entity<ProductVariant>()
                .HasIndex(pv => pv.Sku).IsUnique();

            builder.Entity<Cart>()
                .HasIndex(c => c.UserId).IsUnique(); // one active cart per user

            builder.Entity<CartItem>()
                .HasIndex(ci => new { ci.CartId, ci.VariantId }).IsUnique();

            builder.Entity<Wishlist>()
                .HasIndex(w => new { w.UserId, w.VariantId }).IsUnique();

            builder.Entity<Coupon>()
                .HasIndex(c => c.Code).IsUnique();

            builder.Entity<UserCouponUsage>()
                .HasIndex(u => new { u.UserId, u.CouponId }).IsUnique();

            builder.Entity<SubOrder>()
                .HasIndex(so => new { so.OrderId, so.SellerId }).IsUnique(); // one sub-order per seller per order

            builder.Entity<Shipping>()
                .HasIndex(s => s.SubOrderId).IsUnique(); // one shipment per sub-order

            // ---- Restrict cascade delete on multi-parent / historical tables ----
            builder.Entity<SellerReview>()
                .HasOne(sr => sr.Customer)
                .WithMany()
                .HasForeignKey(sr => sr.CustomerId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<Return>()
                .HasOne(r => r.ExchangeVariant)
                .WithMany(pv => pv.ExchangeReturns)
                .HasForeignKey(r => r.ExchangeVariantId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<Order>()
                .HasOne(o => o.Coupon)
                .WithMany(c => c.Orders)
                .HasForeignKey(o => o.CouponId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<Category>()
                .HasOne(c => c.ParentCategory)
                .WithMany(c => c.ChildCategories)
                .HasForeignKey(c => c.ParentCategoryId)
                .OnDelete(DeleteBehavior.Restrict);

            // One-to-one: a User has one Cart
            builder.Entity<Cart>()
                .HasOne(c => c.User)
                .WithOne(u => u.Cart)
                .HasForeignKey<Cart>(c => c.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<Review>()
                .HasOne(r => r.User)
                .WithMany(u => u.Reviews)
                .HasForeignKey(r => r.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<Address>()
                .HasOne(a => a.User)
                .WithMany(u => u.Addresses)
                .HasForeignKey(a => a.UserId)
                .OnDelete(DeleteBehavior.Restrict);
            // ---- Fix for OrderItems cascade path (Error 1785) ----
            builder.Entity<OrderItem>()
                .HasOne(oi => oi.SubOrder) // Assumes your navigation property is named SubOrder
                .WithMany(so => so.OrderItems) // If SubOrder doesn't have a list of items, just use .WithMany()
                .HasForeignKey(oi => oi.SubOrderId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<OrderItem>()
                .HasOne(oi => oi.ProductVariant) // Assumes your navigation property is named Variant or ProductVariant
                .WithMany()
                .HasForeignKey(oi => oi.VariantId)
                .OnDelete(DeleteBehavior.Restrict);
            // ---- Fix for Wishlists cascade path (Error 1785) ----
            builder.Entity<Wishlist>()
                .HasOne(w => w.User)
                .WithMany(u => u.WishlistItems)
                .HasForeignKey(w => w.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<Wishlist>()
                .HasOne(w => w.ProductVariant) // Assumes navigation property is named Variant or ProductVariant
                .WithMany()
                .HasForeignKey(w => w.VariantId)
                .OnDelete(DeleteBehavior.Restrict);
            // ---- Prevent future error for CartItems ----
            builder.Entity<CartItem>()
                .HasOne(ci => ci.ProductVariant)
                .WithMany()
                .HasForeignKey(ci => ci.VariantId)
                .OnDelete(DeleteBehavior.Restrict);
            // ---> THIS IS THE FIX FOR ERROR 1785 <---
            builder.Entity<Order>()
                .HasOne(o => o.User)
                .WithMany(u => u.Orders)
                .HasForeignKey(o => o.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            // ---- Index for common lookup / join paths (mirrors SQL script section 10) ----
            builder.Entity<Product>().HasIndex(p => p.SellerId);
            builder.Entity<Product>().HasIndex(p => p.CategoryId);
            builder.Entity<ProductVariant>().HasIndex(pv => pv.ProductId);
            builder.Entity<Order>().HasIndex(o => o.UserId);
            builder.Entity<SubOrder>().HasIndex(so => so.OrderId);
            builder.Entity<SubOrder>().HasIndex(so => so.SellerId);
            builder.Entity<OrderItem>().HasIndex(oi => oi.SubOrderId);
            builder.Entity<OrderItem>().HasIndex(oi => oi.VariantId);
            builder.Entity<SellerCommission>().HasIndex(sc => sc.SellerId);
            builder.Entity<Review>().HasIndex(r => r.ProductId);
            builder.Entity<RefreshToken>().HasIndex(rt => rt.UserId);
        }
    }
}