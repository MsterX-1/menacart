using Application.Interfaces.IRepositories;
using Domain.Models;
using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Interfaces.IUnitOfWork
{
    public interface IUnitOfWork
    {
        IRefreshTokenRepository RefreshTokenRepository { get; }
        //IGenaricRepository<T> GenaricRepository<T>() put T with Class that you want to use it with
        IOrderRepository OrderRepository { get; }
        ISubOrderRepository SubOrderRepository { get; }
        ICartRepository CartRepository { get; }
        ICouponRepository CouponRepository { get; }
        IAddressRepository AddressRepository { get; }
        IGenaricRepository<OrderItem> OrderItemRepository { get; }
        IGenaricRepository<SellerCommission> SellerCommissionRepository { get; }
        IGenaricRepository<Notification> NotificationRepository { get; }
        ISellerRepository SellerRepository { get; }
        IShippingRepository ShippingRepository { get; }
        IProductRepository ProductRepository { get; }
        IProductVariantRepository ProductVariantRepository { get; }
        IReturnRepository ReturnRepository { get; }
        Task<int> CompleteAsync();

    }
}
