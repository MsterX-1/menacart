using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCouponTracking : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "SellerDiscount",
                table: "SellerCommissions",
                type: "decimal(10,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "PlatformDiscount",
                table: "Orders",
                type: "decimal(10,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<int>(
                name: "SellerId",
                table: "Coupons",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Coupons_SellerId",
                table: "Coupons",
                column: "SellerId");

            migrationBuilder.AddForeignKey(
                name: "FK_Coupons_SellerProfiles_SellerId",
                table: "Coupons",
                column: "SellerId",
                principalTable: "SellerProfiles",
                principalColumn: "SellerId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Coupons_SellerProfiles_SellerId",
                table: "Coupons");

            migrationBuilder.DropIndex(
                name: "IX_Coupons_SellerId",
                table: "Coupons");

            migrationBuilder.DropColumn(
                name: "SellerDiscount",
                table: "SellerCommissions");

            migrationBuilder.DropColumn(
                name: "PlatformDiscount",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "SellerId",
                table: "Coupons");
        }
    }
}
