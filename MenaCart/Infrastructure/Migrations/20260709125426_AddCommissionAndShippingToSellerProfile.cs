using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCommissionAndShippingToSellerProfile : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "BaseShippingCost",
                table: "SellerProfiles",
                type: "decimal(10,2)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "CommissionRate",
                table: "SellerProfiles",
                type: "decimal(5,2)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "FreeShippingThreshold",
                table: "SellerProfiles",
                type: "decimal(10,2)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BaseShippingCost",
                table: "SellerProfiles");

            migrationBuilder.DropColumn(
                name: "CommissionRate",
                table: "SellerProfiles");

            migrationBuilder.DropColumn(
                name: "FreeShippingThreshold",
                table: "SellerProfiles");
        }
    }
}
