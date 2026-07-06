using System.ComponentModel.DataAnnotations;

namespace Application.DTOs.AuthDtos
{
    public class RegisterDto
    {
        public required string UserName { get; set; }
        public required string Password { get; set; }
        public required string FirstName { get; set; }
        public required string LastName { get; set; }
        public required string Email { get; set; }

        [Required]
        [RegularExpression("^(Customer|Seller)$", ErrorMessage = "Role must be 'Customer' or 'Seller'.")]
        public required string Role { get; set; }
    }
}