using Application.DTOs.AddressDtos;

namespace Application.DTOs.CartDtos
{
    public class CartItemResponseDto
    {
        public int CartItemId { get; set; }
        public int VariantId { get; set; }
        public int ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public string? Color { get; set; }
        public string? Size { get; set; }
        public string? ImageUrl { get; set; }
        public decimal UnitPrice { get; set; }
        public int Quantity { get; set; }
        public decimal LineTotal => UnitPrice * Quantity;
        public int StockQuantity { get; set; }
    }

    public class CartResponseDto
    {
        public int CartId { get; set; }
        public List<CartItemResponseDto> Items { get; set; } = new();
        public decimal GrandTotal => Items.Sum(i => i.LineTotal);
        public int TotalItems => Items.Sum(i => i.Quantity);

        /// <summary>
        /// Customer's saved addresses — embedded so checkout 
        /// screen has everything in one call.
        /// </summary>
        public List<AddressResponseDto> SavedAddresses { get; set; } = new();

        /// <summary>The default address ID for quick reference.</summary>
        public int? DefaultAddressId { get; set; }
    }
}