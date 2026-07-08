-- ==========================================
-- Clear Database Script (SQL Server / MSSQL)
-- Clears all tables in the correct dependency order
-- ==========================================

PRINT 'Clearing database tables...';

-- Disable all check constraints
EXEC sp_MSforeachtable "ALTER TABLE ? NOCHECK CONSTRAINT ALL";

-- Delete data from all tables (avoids FK conflicts)
DELETE FROM [UserCouponUsages];
DELETE FROM [OrderItems];
DELETE FROM [SubOrders];
DELETE FROM [Payments];
DELETE FROM [Shippings];
DELETE FROM [Returns];
DELETE FROM [Orders];
DELETE FROM [Wishlists];
DELETE FROM [CartItems];
DELETE FROM [Carts];
DELETE FROM [Reviews];
DELETE FROM [SellerReviews];
DELETE FROM [SellerCommissions];
DELETE FROM [SellerPayouts];
DELETE FROM [SellerShippingRules];
DELETE FROM [SellerBankInfos];
DELETE FROM [SellerDocuments];
DELETE FROM [SellerProfiles];
DELETE FROM [ProductImages];
DELETE FROM [ProductVariants];
DELETE FROM [Products];
DELETE FROM [Categories];
DELETE FROM [Addresses];
DELETE FROM [LoyaltyPoints];
DELETE FROM [Notifications];
DELETE FROM [RefreshTokens];
DELETE FROM [AspNetUserRoles];
DELETE FROM [AspNetUserClaims];
DELETE FROM [AspNetUserLogins];
DELETE FROM [AspNetUserTokens];
DELETE FROM [AspNetRoleClaims];
DELETE FROM [AspNetRoles];
DELETE FROM [AspNetUsers];

-- Reseed all identity columns back to 1
DECLARE @TableName NVARCHAR(256)
DECLARE @Sql NVARCHAR(MAX)
DECLARE table_cursor CURSOR FOR 
SELECT '[' + s.name + '].[' + t.name + ']' AS TableName
FROM sys.tables t
INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
WHERE OBJECTPROPERTY(t.object_id, 'TableHasIdentity') = 1;

OPEN table_cursor
FETCH NEXT FROM table_cursor INTO @TableName
WHILE @@FETCH_STATUS = 0
BEGIN
    SET @Sql = 'DBCC CHECKIDENT (''' + @TableName + ''', RESEED, 0);'
    EXEC sp_executesql @Sql
    FETCH NEXT FROM table_cursor INTO @TableName
END
CLOSE table_cursor
DEALLOCATE table_cursor

-- Re-enable all check constraints
EXEC sp_MSforeachtable "ALTER TABLE ? WITH CHECK CHECK CONSTRAINT ALL";

PRINT 'Database cleared and identities reseeded successfully!';
