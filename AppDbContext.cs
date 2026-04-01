// Data/AppDbContext.cs
using Npgsql;
using System.Data;

namespace SmartWMS.Data
{
    public class AppDbContext  // ← DbContext se AppDbContext
    {
        private readonly IConfiguration _config;

        public AppDbContext(IConfiguration config)
        {
            _config = config;
        }

        public IDbConnection CreateConnection()
        {
            var connectionString = _config.GetConnectionString("DefaultConnection");
            return new NpgsqlConnection(connectionString);
        }
    }
}