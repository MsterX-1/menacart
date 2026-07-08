using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class ExtendedFeaturesSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Orders_Addresses_AddressId",
                table: "Orders");

            migrationBuilder.DropIndex(
                name: "IX_SellerReviews_CustomerId",
                table: "SellerReviews");

            migrationBuilder.DropIndex(
                name: "IX_SellerBankInfos_SellerId",
                table: "SellerBankInfos");

            migrationBuilder.DropIndex(
                name: "IX_Reviews_UserId",
                table: "Reviews");

            migrationBuilder.AddColumn<decimal>(
                name: "ShippingCost",
                table: "SubOrders",
                type: "decimal(10,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "RejectionReason",
                table: "SellerProfiles",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RejectionReason",
                table: "SellerDocuments",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PayoutId",
                table: "SellerCommissions",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "AverageRating",
                table: "Products",
                type: "decimal(3,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "Products",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "RejectionReason",
                table: "Products",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ReviewCount",
                table: "Products",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "LinkUrl",
                table: "Notifications",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "Addresses",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateIndex(
                name: "IX_SellerReviews_CustomerId_SellerId",
                table: "SellerReviews",
                columns: new[] { "CustomerId", "SellerId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SellerCommissions_PayoutId",
                table: "SellerCommissions",
                column: "PayoutId");

            migrationBuilder.CreateIndex(
                name: "IX_SellerBankInfos_SellerId",
                table: "SellerBankInfos",
                column: "SellerId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Reviews_UserId_ProductId",
                table: "Reviews",
                columns: new[] { "UserId", "ProductId" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Orders_Addresses_AddressId",
                table: "Orders",
                column: "AddressId",
                principalTable: "Addresses",
                principalColumn: "AddressId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_SellerCommissions_SellerPayouts_PayoutId",
                table: "SellerCommissions",
                column: "PayoutId",
                principalTable: "SellerPayouts",
                principalColumn: "PayoutId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Orders_Addresses_AddressId",
                table: "Orders");

            migrationBuilder.DropForeignKey(
                name: "FK_SellerCommissions_SellerPayouts_PayoutId",
                table: "SellerCommissions");

            migrationBuilder.DropIndex(
                name: "IX_SellerReviews_CustomerId_SellerId",
                table: "SellerReviews");

            migrationBuilder.DropIndex(
                name: "IX_SellerCommissions_PayoutId",
                table: "SellerCommissions");

            migrationBuilder.DropIndex(
                name: "IX_SellerBankInfos_SellerId",
                table: "SellerBankInfos");

            migrationBuilder.DropIndex(
                name: "IX_Reviews_UserId_ProductId",
                table: "Reviews");

            migrationBuilder.DropColumn(
                name: "ShippingCost",
                table: "SubOrders");

            migrationBuilder.DropColumn(
                name: "RejectionReason",
                table: "SellerProfiles");

            migrationBuilder.DropColumn(
                name: "RejectionReason",
                table: "SellerDocuments");

            migrationBuilder.DropColumn(
                name: "PayoutId",
                table: "SellerCommissions");

            migrationBuilder.DropColumn(
                name: "AverageRating",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "RejectionReason",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "ReviewCount",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "LinkUrl",
                table: "Notifications");

            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "Addresses");

            migrationBuilder.CreateIndex(
                name: "IX_SellerReviews_CustomerId",
                table: "SellerReviews",
                column: "CustomerId");

            migrationBuilder.CreateIndex(
                name: "IX_SellerBankInfos_SellerId",
                table: "SellerBankInfos",
                column: "SellerId");

            migrationBuilder.CreateIndex(
                name: "IX_Reviews_UserId",
                table: "Reviews",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Orders_Addresses_AddressId",
                table: "Orders",
                column: "AddressId",
                principalTable: "Addresses",
                principalColumn: "AddressId",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
