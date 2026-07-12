using System.ComponentModel.DataAnnotations;

namespace Application.DTOs.AuthDtos
{
    public class VerifyOtpDto
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; }

        [Required]
        public string Code { get; set; }
    }
}
