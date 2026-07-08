using Application.DTOs.ProductDtos;
using Application.Interfaces.IServices;
using Application.Interfaces.IUnitOfWork;
using Domain.Models;

namespace Application.Services
{
    public class ProductService : IProductService
    {
        private readonly IUnitOfWork _unitOfWork;

        public ProductService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        // ══════════════════════════════════════════════════════════════════════
        // SELLER
        // ══════════════════════════════════════════════════════════════════════

        public async Task<ProductResponseDto> CreateProductAsync(string userId, CreateProductRequestDto request)
        {
            // Resolve seller
            var seller = await _unitOfWork.SellerRepository.GetByUserIdAsync(userId);
            if (seller == null)
                throw new UnauthorizedAccessException("Seller profile not found.");

            if (seller.Status != SellerStatus.Active)
                throw new Exception("Your seller account is not active.");

            // Validate SKU uniqueness for all variants
            foreach (var v in request.Variants)
            {
                if (await _unitOfWork.ProductVariantRepository.SkuExistsAsync(v.Sku))
                    throw new Exception($"SKU '{v.Sku}' already exists.");
            }

            var product = new Product
            {
                SellerId = seller.SellerId,
                CategoryId = request.CategoryId,
                Name = request.Name,
                Description = request.Description,
                BasePrice = request.BasePrice,
                Brand = request.Brand,
                ApprovalStatus = ApprovalStatus.Pending,
                MainImageUrl = request.MainImageUrl,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            // Map product-level images
            if (request.ProductImages != null)
            {
                product.ProductImages = request.ProductImages.Select(url => new ProductImage
                {
                    ImageUrl = url,
                    IsPrimary = false,
                    Product = product
                }).ToList();
            }

            // Map variants and their specific images
            product.ProductVariants = request.Variants.Select(v =>
            {
                var pv = new ProductVariant
                {
                    Sku = v.Sku,
                    Color = v.Color,
                    Size = v.Size,
                    StockQuantity = v.StockQuantity,
                    Price = v.Price,
                    MainImageUrl = v.MainImageUrl ?? string.Empty,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                if (v.VariantImages != null)
                {
                    pv.Images = v.VariantImages.Select(url => new ProductImage
                    {
                        ImageUrl = url,
                        Product = product
                    }).ToList();
                }

                return pv;
            }).ToList();

            await _unitOfWork.ProductRepository.Add(product);
            await _unitOfWork.CompleteAsync();

            var created = await _unitOfWork.ProductRepository.GetByIdWithDetailsAsync(product.ProductId);
            return MapToDto(created!);
        }

        public async Task<ProductResponseDto> UpdateProductAsync(string userId, int productId, UpdateProductRequestDto request)
        {
            var seller = await _unitOfWork.SellerRepository.GetByUserIdAsync(userId);
            if (seller == null)
                throw new UnauthorizedAccessException("Seller profile not found.");

            var product = await _unitOfWork.ProductRepository.GetByIdWithDetailsAsync(productId);
            if (product == null)
                throw new KeyNotFoundException("Product not found.");

            if (product.SellerId != seller.SellerId)
                throw new UnauthorizedAccessException("You do not own this product.");

            // Apply updates
            if (request.Name != null) product.Name = request.Name;
            if (request.Description != null) product.Description = request.Description;
            if (request.BasePrice.HasValue) product.BasePrice = request.BasePrice.Value;
            if (request.Brand != null) product.Brand = request.Brand;
            if (request.CategoryId.HasValue) product.CategoryId = request.CategoryId.Value;
            if (request.MainImageUrl != null) product.MainImageUrl = request.MainImageUrl;
            product.UpdatedAt = DateTime.UtcNow;

            // Keep the same ApprovalStatus when updating (do not reset to Pending per blueprint)

            // Handle product-level image updates
            if (request.ProductImages != null)
            {
                var existingGeneralImages = product.ProductImages.Where(pi => pi.ProductVariantId == null).ToList();
                foreach (var img in existingGeneralImages)
                {
                    product.ProductImages.Remove(img);
                }

                foreach (var url in request.ProductImages)
                {
                    product.ProductImages.Add(new ProductImage
                    {
                        ImageUrl = url,
                        Product = product
                    });
                }
            }

            // Handle variants
            if (request.Variants != null)
            {
                foreach (var vDto in request.Variants)
                {
                    if (vDto.VariantId.HasValue)
                    {
                        // Update existing variant
                        var existing = product.ProductVariants
                            .FirstOrDefault(v => v.VariantId == vDto.VariantId.Value);

                        if (existing == null)
                            throw new KeyNotFoundException($"Variant {vDto.VariantId} not found on this product.");

                        if (vDto.Sku != null && vDto.Sku != existing.Sku)
                        {
                            if (await _unitOfWork.ProductVariantRepository.SkuExistsAsync(vDto.Sku, existing.VariantId))
                                throw new Exception($"SKU '{vDto.Sku}' already exists.");
                            existing.Sku = vDto.Sku;
                        }

                        if (vDto.Color != null) existing.Color = vDto.Color;
                        if (vDto.Size != null) existing.Size = vDto.Size;
                        if (vDto.StockQuantity.HasValue) existing.StockQuantity = vDto.StockQuantity.Value;
                        if (vDto.Price.HasValue) existing.Price = vDto.Price.Value;
                        if (vDto.MainImageUrl != null) existing.MainImageUrl = vDto.MainImageUrl;
                        existing.UpdatedAt = DateTime.UtcNow;

                        // Sync variant-specific images
                        if (vDto.VariantImages != null)
                        {
                            var existingVariantImages = existing.Images.ToList();
                            foreach (var img in existingVariantImages)
                            {
                                product.ProductImages.Remove(img);
                            }

                            foreach (var url in vDto.VariantImages)
                            {
                                existing.Images.Add(new ProductImage
                                {
                                    ImageUrl = url,
                                    Product = product
                                });
                            }
                        }
                    }
                    else
                    {
                        // Add new variant
                        if (vDto.Sku == null)
                            throw new Exception("SKU is required for new variants.");

                        if (await _unitOfWork.ProductVariantRepository.SkuExistsAsync(vDto.Sku))
                            throw new Exception($"SKU '{vDto.Sku}' already exists.");

                        var newVariant = new ProductVariant
                        {
                            Sku = vDto.Sku,
                            Color = vDto.Color,
                            Size = vDto.Size,
                            StockQuantity = vDto.StockQuantity ?? 0,
                            Price = vDto.Price ?? product.BasePrice,
                            MainImageUrl = vDto.MainImageUrl ?? string.Empty,
                            CreatedAt = DateTime.UtcNow,
                            UpdatedAt = DateTime.UtcNow
                        };

                        if (vDto.VariantImages != null)
                        {
                            newVariant.Images = vDto.VariantImages.Select(url => new ProductImage
                            {
                                ImageUrl = url,
                                Product = product
                            }).ToList();
                        }

                        product.ProductVariants.Add(newVariant);
                    }
                }
            }

            await _unitOfWork.ProductRepository.Update(product);
            await _unitOfWork.CompleteAsync();

            var updated = await _unitOfWork.ProductRepository.GetByIdWithDetailsAsync(productId);
            return MapToDto(updated!);
        }

        public async Task DeleteProductAsync(string userId, int productId)
        {
            var seller = await _unitOfWork.SellerRepository.GetByUserIdAsync(userId);
            if (seller == null)
                throw new UnauthorizedAccessException("Seller profile not found.");

            var product = await _unitOfWork.ProductRepository.GetByIdWithDetailsAsync(productId);
            if (product == null)
                throw new KeyNotFoundException("Product not found.");

            if (product.SellerId != seller.SellerId)
                throw new UnauthorizedAccessException("You do not own this product.");

            product.IsActive = false;
            await _unitOfWork.ProductRepository.Update(product);
            await _unitOfWork.CompleteAsync();
        }

        public async Task<IEnumerable<ProductResponseDto>> GetMyProductsAsync(string userId, int page, int pageSize)
        {
            var seller = await _unitOfWork.SellerRepository.GetByUserIdAsync(userId);
            if (seller == null)
                throw new UnauthorizedAccessException("Seller profile not found.");

            var products = await _unitOfWork.ProductRepository.GetBySellerIdAsync(seller.SellerId, page, pageSize);
            return products.Select(MapToDto);
        }

        // ══════════════════════════════════════════════════════════════════════
        // PUBLIC
        // ══════════════════════════════════════════════════════════════════════

        public async Task<ProductResponseDto> GetByIdAsync(int productId)
        {
            var product = await _unitOfWork.ProductRepository.GetByIdWithDetailsAsync(productId);
            if (product == null)
                throw new KeyNotFoundException("Product not found.");

            return MapToDto(product);
        }

        public async Task<IEnumerable<ProductResponseDto>> BrowseAsync(
            string? search, int? categoryId, int? sellerId, int page, int pageSize)
        {
            var products = await _unitOfWork.ProductRepository.BrowseAsync(search, categoryId, sellerId, page, pageSize);
            return products.Select(MapToDto);
        }

        // ══════════════════════════════════════════════════════════════════════
        // ADMIN
        // ══════════════════════════════════════════════════════════════════════

        public async Task<ProductResponseDto> ApproveProductAsync(int productId, ApproveProductRequestDto request)
        {
            var product = await _unitOfWork.ProductRepository.GetByIdWithDetailsAsync(productId);
            if (product == null)
                throw new KeyNotFoundException("Product not found.");

            if (!Enum.TryParse<ApprovalStatus>(request.Status, out var newStatus))
                throw new Exception($"Invalid status '{request.Status}'.");

            product.ApprovalStatus = newStatus;
            if (newStatus == ApprovalStatus.Rejected)
            {
                product.RejectionReason = request.RejectionReason ?? "Not specified.";
            }
            else
            {
                product.RejectionReason = null;
            }
            product.UpdatedAt = DateTime.UtcNow;

            // Notify seller
            await _unitOfWork.NotificationRepository.Add(new Notification
            {
                UserId = product.SellerProfile.UserId,
                Message = newStatus == ApprovalStatus.Approved
                    ? $"Your product '{product.Name}' has been approved."
                    : $"Your product '{product.Name}' was rejected. Reason: {request.RejectionReason ?? "Not specified."}",
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            });

            await _unitOfWork.ProductRepository.Update(product);
            await _unitOfWork.CompleteAsync();

            return MapToDto(product);
        }

        // ── Mapper ─────────────────────────────────────────────────────────────
        private static ProductResponseDto MapToDto(Product p) => new()
        {
            ProductId = p.ProductId,
            Name = p.Name,
            Description = p.Description,
            BasePrice = p.BasePrice,
            Brand = p.Brand,
            ApprovalStatus = p.ApprovalStatus.ToString(),
            AverageRating = p.AverageRating,
            ReviewCount = p.ReviewCount,
            IsActive = p.IsActive,
            RejectionReason = p.RejectionReason,
            CategoryId = p.CategoryId,
            CategoryName = p.Category?.Name ?? string.Empty,
            SellerId = p.SellerId,
            StoreName = p.SellerProfile?.StoreName ?? string.Empty,
            MainImageUrl = p.MainImageUrl,
            CreatedAt = p.CreatedAt,
            ProductImages = p.ProductImages?.Where(pi => pi.ProductVariantId == null).Select(pi => pi.ImageUrl).ToList() ?? new(),
            Variants = p.ProductVariants?.Select(v => new VariantResponseDto
            {
                VariantId = v.VariantId,
                Sku = v.Sku,
                Color = v.Color,
                Size = v.Size,
                StockQuantity = v.StockQuantity,
                Price = v.Price,
                MainImageUrl = v.MainImageUrl,
                VariantImages = v.Images?.Select(vi => vi.ImageUrl).ToList() ?? new()
            }).ToList() ?? new()
        };
    }
}
