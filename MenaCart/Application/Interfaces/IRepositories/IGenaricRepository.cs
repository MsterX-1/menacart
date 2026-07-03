using System;
using System.Collections.Generic;
using System.Linq.Expressions;
using System.Text;

namespace Application.Interfaces.IRepositories
{
    public interface IGenaricRepository<T> where T : class
    {
        Task<IEnumerable<T?>> GetAll();
        Task<T?> GetById(object id);
        Task Add(T entity);
        Task Update(T entity);
        Task Delete(object id);
    }
}
