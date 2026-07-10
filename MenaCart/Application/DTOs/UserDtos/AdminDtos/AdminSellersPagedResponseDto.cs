using System;
using System.Collections.Generic;

namespace Application.DTOs.UserDtos.AdminDtos
{
    public class AdminSellersPagedResponseDto
    {
        public IEnumerable<SellerResponseDto> Items { get; set; } = new List<SellerResponseDto>();
        public int PageNumber { get; set; }
        public int PageSize { get; set; }
        public int TotalCount { get; set; }
        public int TotalPages { get; set; }
    }
}
