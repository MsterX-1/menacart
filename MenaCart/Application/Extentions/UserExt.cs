using Application.DTOs.AuthDtos;
using Application.DTOs.UserDtos;
using Domain.Models;
using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Extentions
{
    public static class UserExt
    {
        public static User ConvertToUser(this RegisterDto dto)
        {
            return new User
            {
                UserName = dto.UserName,
                FirstName = dto.FirstName,
                LastName = dto.LastName,
                Email = dto.Email
            };
        }
        public static GetUserDto ConvertToGetUserDto(this User user)
        {
            return new GetUserDto
            {
                UserId = user.Id,
                UserName = user.UserName,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Email = user.Email

            };
        }
        public static IEnumerable<GetUserDto> ConvertToGetUsersDto(this IEnumerable<User> users)
        {
            return users.Select(u => u.ConvertToGetUserDto());
        }
    }
}
