using System;
using System.Collections.Generic;
using System.Text;

namespace Application.DTOs.UserDtos
{
    public class GetUserDto
    {
        public string UserId { get; set; }
        public string UserName { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string Email { get; set; }
        public List<string> Roles { get; set; } = new List<string>();
    }
}
