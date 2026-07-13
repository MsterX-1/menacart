-- ==========================================
-- Seed Test Data Script (SQL Server / MSSQL)
-- Seeds roles, users, categories, products,
-- variants, reviews, and coupons for easy testing.
-- ==========================================

PRINT 'Seeding test data...';

-- Disable foreign key constraints during seeding
EXEC sp_MSforeachtable "ALTER TABLE ? NOCHECK CONSTRAINT ALL";

-- 1. Ensure Roles Exist
DECLARE @AdminRoleId NVARCHAR(450) = (SELECT Id FROM AspNetRoles WHERE NormalizedName = 'ADMIN');
IF @AdminRoleId IS NULL BEGIN
    SET @AdminRoleId = 'admin-role-id';
    INSERT INTO AspNetRoles (Id, Name, NormalizedName, ConcurrencyStamp) VALUES (@AdminRoleId, 'Admin', 'ADMIN', NEWID());
END

DECLARE @SellerRoleId NVARCHAR(450) = (SELECT Id FROM AspNetRoles WHERE NormalizedName = 'SELLER');
IF @SellerRoleId IS NULL BEGIN
    SET @SellerRoleId = 'seller-role-id';
    INSERT INTO AspNetRoles (Id, Name, NormalizedName, ConcurrencyStamp) VALUES (@SellerRoleId, 'Seller', 'SELLER', NEWID());
END

DECLARE @CustomerRoleId NVARCHAR(450) = (SELECT Id FROM AspNetRoles WHERE NormalizedName = 'CUSTOMER');
IF @CustomerRoleId IS NULL BEGIN
    SET @CustomerRoleId = 'customer-role-id';
    INSERT INTO AspNetRoles (Id, Name, NormalizedName, ConcurrencyStamp) VALUES (@CustomerRoleId, 'Customer', 'CUSTOMER', NEWID());
END

-- 2. Retrieve Admin Password Hash to copy for test accounts (Password will match Admin's password, default: Admin@123)
DECLARE @PasswordHash NVARCHAR(MAX);
SELECT TOP 1 @PasswordHash = PasswordHash FROM AspNetUsers WHERE Email = 'admin@system.com';

-- Fallback hash for 'Admin@123' if admin hash is not found
IF @PasswordHash IS NULL
    SET @PasswordHash = 'AQAAAAIAAYagAAAAEB2hMal/Y20f91aFmr8/JGHbpfiEzKKUL44OXOdzthXzhf89UA/YC9yfqKb2Mvn4AQ==';

-- 3. Create Test Customer
DECLARE @CustomerId NVARCHAR(450) = 'test-customer-id';
IF NOT EXISTS (SELECT 1 FROM AspNetUsers WHERE Id = @CustomerId)
BEGIN
    INSERT INTO AspNetUsers (Id, UserName, NormalizedUserName, Email, NormalizedEmail, EmailConfirmed, PasswordHash, SecurityStamp, ConcurrencyStamp, FirstName, LastName, TwoFactorEnabled, PhoneNumberConfirmed, LockoutEnabled, AccessFailedCount, CreatedAt, UpdatedAt)
    VALUES (@CustomerId, 'customer', 'CUSTOMER', 'customer@test.com', 'CUSTOMER@TEST.COM', 1, @PasswordHash, NEWID(), NEWID(), 'John', 'Doe', 0, 0, 1, 0, GETUTCDATE(), GETUTCDATE());

    INSERT INTO AspNetUserRoles (UserId, RoleId) VALUES (@CustomerId, @CustomerRoleId);
END

-- 4. Create Test Seller
DECLARE @SellerUserId NVARCHAR(450) = 'test-seller-id';
IF NOT EXISTS (SELECT 1 FROM AspNetUsers WHERE Id = @SellerUserId)
BEGIN
    INSERT INTO AspNetUsers (Id, UserName, NormalizedUserName, Email, NormalizedEmail, EmailConfirmed, PasswordHash, SecurityStamp, ConcurrencyStamp, FirstName, LastName, TwoFactorEnabled, PhoneNumberConfirmed, LockoutEnabled, AccessFailedCount, CreatedAt, UpdatedAt)
    VALUES (@SellerUserId, 'seller', 'SELLER', 'seller@test.com', 'SELLER@TEST.COM', 1, @PasswordHash, NEWID(), NEWID(), 'Jane', 'Smith', 0, 0, 1, 0, GETUTCDATE(), GETUTCDATE());

    INSERT INTO AspNetUserRoles (UserId, RoleId) VALUES (@SellerUserId, @SellerRoleId);
END

-- 5. Create Seller Profile
DECLARE @SellerProfileId INT = 1;
IF NOT EXISTS (SELECT 1 FROM SellerProfiles WHERE SellerId = @SellerProfileId)
BEGIN
    SET IDENTITY_INSERT SellerProfiles ON;
    INSERT INTO SellerProfiles (SellerId, UserId, StoreName, StoreDescription, StoreLogoUrl, StoreBannerUrl, StoreAddress, Phone, Rating, Status, IsVerified, CreatedAt, UpdatedAt, CommissionRate, BaseShippingCost, FreeShippingThreshold)
    VALUES (@SellerProfileId, @SellerUserId, 'Epic Threads Store', 'High-quality modern fashion and streetwear.', '', '', 'Cairo, Egypt', '01000000000', 0.0, 'Active', 1, GETUTCDATE(), GETUTCDATE(), 5.0, 30.0, 200.0);
    SET IDENTITY_INSERT SellerProfiles OFF;
END

-- 6. Add Customer Address
IF NOT EXISTS (SELECT 1 FROM Addresses WHERE UserId = @CustomerId)
BEGIN
    INSERT INTO Addresses (UserId, AddressType, Street, City, State, Country, ZipCode, IsDefault, IsActive, CreatedAt, UpdatedAt)
    VALUES (@CustomerId, 'Shipping', '12 Tahrir Square, Apartment 4B', 'Cairo', 'Cairo', 'Egypt', '11511', 1, 1, GETUTCDATE(), GETUTCDATE());
END

-- 7. Create Categories (Parent and Child)
DECLARE @CatMen INT = 1;
DECLARE @CatWomen INT = 2;
DECLARE @CatShirts INT = 3;
DECLARE @CatPants INT = 4;
DECLARE @CatDresses INT = 5;

IF NOT EXISTS (SELECT 1 FROM Categories WHERE CategoryId = @CatMen)
BEGIN
    SET IDENTITY_INSERT Categories ON;
    INSERT INTO Categories (CategoryId, Name, ParentCategoryId, ImageUrl)
    VALUES (@CatMen, 'Men''s Clothing', NULL, 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=500');
    SET IDENTITY_INSERT Categories OFF;
END

IF NOT EXISTS (SELECT 1 FROM Categories WHERE CategoryId = @CatWomen)
BEGIN
    SET IDENTITY_INSERT Categories ON;
    INSERT INTO Categories (CategoryId, Name, ParentCategoryId, ImageUrl)
    VALUES (@CatWomen, 'Women''s Clothing', NULL, 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=500');
    SET IDENTITY_INSERT Categories OFF;
END

IF NOT EXISTS (SELECT 1 FROM Categories WHERE CategoryId = @CatShirts)
BEGIN
    SET IDENTITY_INSERT Categories ON;
    INSERT INTO Categories (CategoryId, Name, ParentCategoryId, ImageUrl)
    VALUES (@CatShirts, 'Shirts', @CatMen, 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500');
    SET IDENTITY_INSERT Categories OFF;
END

IF NOT EXISTS (SELECT 1 FROM Categories WHERE CategoryId = @CatPants)
BEGIN
    SET IDENTITY_INSERT Categories ON;
    INSERT INTO Categories (CategoryId, Name, ParentCategoryId, ImageUrl)
    VALUES (@CatPants, 'Pants', @CatMen, 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=500');
    SET IDENTITY_INSERT Categories OFF;
END

IF NOT EXISTS (SELECT 1 FROM Categories WHERE CategoryId = @CatDresses)
BEGIN
    SET IDENTITY_INSERT Categories ON;
    INSERT INTO Categories (CategoryId, Name, ParentCategoryId, ImageUrl)
    VALUES (@CatDresses, 'Dresses', @CatWomen, 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=500');
    SET IDENTITY_INSERT Categories OFF;
END

-- 8. Create Products
DECLARE @ProdShirt INT = 1;
DECLARE @ProdPant INT = 2;
DECLARE @ProdDress INT = 3;

IF NOT EXISTS (SELECT 1 FROM Products WHERE ProductId = @ProdShirt)
BEGIN
    SET IDENTITY_INSERT Products ON;
    INSERT INTO Products (ProductId, Name, Description, BasePrice, Brand, CategoryId, SellerId, ApprovalStatus, IsActive, AverageRating, ReviewCount, MainImageUrl, CreatedAt, UpdatedAt)
    VALUES (@ProdShirt, 'Classic Oxford Shirt', 'A timeless classic Oxford button-down shirt. Perfect for smart-casual wear.', 350.00, 'EpicWear', @CatShirts, @SellerProfileId, 'Approved', 1, 5.0, 1, 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500', GETUTCDATE(), GETUTCDATE());
    SET IDENTITY_INSERT Products OFF;
END

IF NOT EXISTS (SELECT 1 FROM Products WHERE ProductId = @ProdPant)
BEGIN
    SET IDENTITY_INSERT Products ON;
    INSERT INTO Products (ProductId, Name, Description, BasePrice, Brand, CategoryId, SellerId, ApprovalStatus, IsActive, AverageRating, ReviewCount, MainImageUrl, CreatedAt, UpdatedAt)
    VALUES (@ProdPant, 'Slim Fit Chino Pants', 'Comfortable and stylish slim-fit chinos. Made of premium breathable cotton.', 490.00, 'EpicWear', @CatPants, @SellerProfileId, 'Approved', 1, 4.0, 1, 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=500', GETUTCDATE(), GETUTCDATE());
    SET IDENTITY_INSERT Products OFF;
END

IF NOT EXISTS (SELECT 1 FROM Products WHERE ProductId = @ProdDress)
BEGIN
    SET IDENTITY_INSERT Products ON;
    INSERT INTO Products (ProductId, Name, Description, BasePrice, Brand, CategoryId, SellerId, ApprovalStatus, IsActive, AverageRating, ReviewCount, MainImageUrl, CreatedAt, UpdatedAt)
    VALUES (@ProdDress, 'Summer Floral Sundress', 'Lightweight and flowy floral sundress, ideal for warm summer days.', 650.00, 'LilyBloom', @CatDresses, @SellerProfileId, 'Approved', 1, 0.0, 0, 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=500', GETUTCDATE(), GETUTCDATE());
    SET IDENTITY_INSERT Products OFF;
END

-- 9. Create Product Variants
IF NOT EXISTS (SELECT 1 FROM ProductVariants WHERE ProductId = @ProdShirt)
BEGIN
    INSERT INTO ProductVariants (ProductId, Sku, Color, Size, StockQuantity, Price, MainImageUrl, CreatedAt, UpdatedAt)
    VALUES 
    (@ProdShirt, 'SHIRT-BLU-M', 'Blue', 'M', 50, 350.00, 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500', GETUTCDATE(), GETUTCDATE()),
    (@ProdShirt, 'SHIRT-BLU-L', 'Blue', 'L', 30, 350.00, 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500', GETUTCDATE(), GETUTCDATE()),
    (@ProdShirt, 'SHIRT-WHT-M', 'White', 'M', 40, 350.00, 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500', GETUTCDATE(), GETUTCDATE());
END

IF NOT EXISTS (SELECT 1 FROM ProductVariants WHERE ProductId = @ProdPant)
BEGIN
    INSERT INTO ProductVariants (ProductId, Sku, Color, Size, StockQuantity, Price, MainImageUrl, CreatedAt, UpdatedAt)
    VALUES 
    (@ProdPant, 'CHINO-BEG-32', 'Beige', '32', 20, 490.00, 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=500', GETUTCDATE(), GETUTCDATE()),
    (@ProdPant, 'CHINO-BLK-32', 'Black', '32', 25, 490.00, 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=500', GETUTCDATE(), GETUTCDATE());
END

IF NOT EXISTS (SELECT 1 FROM ProductVariants WHERE ProductId = @ProdDress)
BEGIN
    INSERT INTO ProductVariants (ProductId, Sku, Color, Size, StockQuantity, Price, MainImageUrl, CreatedAt, UpdatedAt)
    VALUES 
    (@ProdDress, 'DRESS-RED-S', 'Red', 'S', 15, 650.00, 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=500', GETUTCDATE(), GETUTCDATE()),
    (@ProdDress, 'DRESS-RED-M', 'Red', 'M', 10, 650.00, 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=500', GETUTCDATE(), GETUTCDATE());
END

-- 10. Create Product Reviews
IF NOT EXISTS (SELECT 1 FROM Reviews WHERE ProductId = @ProdShirt AND UserId = @CustomerId)
BEGIN
    INSERT INTO Reviews (UserId, ProductId, Rating, Comment, CreatedAt)
    VALUES (@CustomerId, @ProdShirt, 5, 'Absolutely love the fit and texture of this Oxford shirt. Highly recommended!', GETUTCDATE());
END

IF NOT EXISTS (SELECT 1 FROM Reviews WHERE ProductId = @ProdPant AND UserId = @CustomerId)
BEGIN
    INSERT INTO Reviews (UserId, ProductId, Rating, Comment, CreatedAt)
    VALUES (@CustomerId, @ProdPant, 4, 'Chinos look premium. Sizing is accurate. Lowered one star due to delayed delivery.', GETUTCDATE());
END

-- 11. Create Product Images (Multi-images for Product & Variants)
DECLARE @VarBlueM INT;
SELECT @VarBlueM = VariantId FROM ProductVariants WHERE Sku = 'SHIRT-BLU-M';

DECLARE @VarWhiteM INT;
SELECT @VarWhiteM = VariantId FROM ProductVariants WHERE Sku = 'SHIRT-WHT-M';

-- General product images (VariantId is NULL)
IF NOT EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @ProdShirt AND ProductVariantId IS NULL)
BEGIN
    INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, CreatedAt, ProductVariantId)
    VALUES 
    (@ProdShirt, 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=500', 0, GETUTCDATE(), NULL),
    (@ProdShirt, 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=500', 0, GETUTCDATE(), NULL);
END

-- Variant-specific images
IF (NOT @VarBlueM IS NULL) AND NOT EXISTS (SELECT 1 FROM ProductImages WHERE ProductVariantId = @VarBlueM)
BEGIN
    INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, CreatedAt, ProductVariantId)
    VALUES 
    (@ProdShirt, 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500', 1, GETUTCDATE(), @VarBlueM),
    (@ProdShirt, 'https://images.unsplash.com/photo-1603252109303-2751441dd157?w=500', 0, GETUTCDATE(), @VarBlueM);
END

IF (NOT @VarWhiteM IS NULL) AND NOT EXISTS (SELECT 1 FROM ProductImages WHERE ProductVariantId = @VarWhiteM)
BEGIN
    INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, CreatedAt, ProductVariantId)
    VALUES 
    (@ProdShirt, 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500', 1, GETUTCDATE(), @VarWhiteM);
END

-- 12. Create Coupons
IF NOT EXISTS (SELECT 1 FROM Coupons WHERE Code = 'WELCOME10')
BEGIN
    INSERT INTO Coupons (Code, DiscountType, DiscountValue, MinOrderAmount, ExpiryDate, UsageLimit, UsedCount, CreatedAt)
    VALUES ('WELCOME10', 'Percentage', 10.00, 100.00, DATEADD(year, 5, GETUTCDATE()), 100, 0, GETUTCDATE());
END

IF NOT EXISTS (SELECT 1 FROM Coupons WHERE Code = 'FLAT100')
BEGIN
    INSERT INTO Coupons (Code, DiscountType, DiscountValue, MinOrderAmount, ExpiryDate, UsageLimit, UsedCount, CreatedAt)
    VALUES ('FLAT100', 'Fixed', 100.00, 500.00, DATEADD(year, 5, GETUTCDATE()), 50, 0, GETUTCDATE());
END

-- Re-enable constraints
EXEC sp_MSforeachtable "ALTER TABLE ? WITH CHECK CHECK CONSTRAINT ALL";

PRINT 'Test data seeded successfully!';
PRINT 'Test Accounts:';
PRINT '  - Customer: customer@test.com (Password: Same as Admin user)';
PRINT '  - Seller: seller@test.com (Password: Same as Admin user)';
