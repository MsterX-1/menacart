using Application.Interfaces.IRepositories;
using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Interfaces.IUnitOfWork
{
    public interface IUnitOfWork
    {
        IRefreshTokenRepository RefreshTokenRepository { get; }
        //IGenaricRepository<T> GenaricRepository<T>() put T with Class that you want to use it with
        Task<int> CompleteAsync();
    }
}
