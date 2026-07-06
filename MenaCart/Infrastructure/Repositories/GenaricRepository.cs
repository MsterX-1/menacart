using Application.Interfaces.IRepositories;
using Infrastructure.Database;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq.Expressions;
using System.Text;

namespace Infrastructure.Repositories
{
    public class GenaricRepository<T> : IGenaricRepository<T> where T : class
    {
        protected readonly AppDbContext _context;
        protected readonly DbSet<T> _dbSet;
        public GenaricRepository(AppDbContext context)
        {
            _context = context;
            _dbSet = _context.Set<T>();
        }
        public async Task Add(T entity)
        {
            await _dbSet.AddAsync(entity);
        }

        public async Task Update(T entity)
        {
            _dbSet.Update(entity);
            await Task.CompletedTask; // Update is synchronous, so we return a completed task if the interface requires a Task.
        }

        public async Task Delete(object id)
        {
            var entity = await _dbSet.FindAsync(id);
            if (entity != null)
            {
                _dbSet.Remove(entity);
            }
        }

        public async Task<T?> GetById(object id)
        {
            return await _dbSet.FindAsync(id);
        }

        public async Task<IEnumerable<T?>> GetAll()
        {
            return await _dbSet.AsNoTracking().ToListAsync();
        }

    }
}
