using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCodeReviewOptimizations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<byte[]>(
                name: "RowVersion",
                table: "SellerCommissions",
                type: "rowversion",
                rowVersion: true,
                nullable: false,
                defaultValue: new byte[0]);

            migrationBuilder.CreateIndex(
                name: "IX_Products_CategoryId_IsActive_ApprovalStatus",
                table: "Products",
                columns: new[] { "CategoryId", "IsActive", "ApprovalStatus" });

            migrationBuilder.CreateIndex(
                name: "IX_Addresses_UserId_IsActive",
                table: "Addresses",
                columns: new[] { "UserId", "IsActive" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Products_CategoryId_IsActive_ApprovalStatus",
                table: "Products");

            migrationBuilder.DropIndex(
                name: "IX_Addresses_UserId_IsActive",
                table: "Addresses");

            migrationBuilder.DropColumn(
                name: "RowVersion",
                table: "SellerCommissions");
        }
    }
}
