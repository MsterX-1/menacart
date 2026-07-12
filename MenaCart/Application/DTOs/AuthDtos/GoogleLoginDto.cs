namespace Application.DTOs.AuthDtos
{
    public class GoogleLoginDto
    {
        public string IdToken { get; set; } = string.Empty;
        public string Role { get; set; } = "Customer";
    }
}
