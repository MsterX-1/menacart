using System.ComponentModel.DataAnnotations;

namespace Application.DTOs.AuthDtos
{
    public class ResendOtpDto
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; }
    }
}
