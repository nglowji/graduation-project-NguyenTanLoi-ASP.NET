-- =============================================
-- Update Password Hashes for Seed Data Users
-- =============================================
-- Generated with BCrypt WorkFactor 12
-- Admin@123, Owner@123, Customer@123

USE SportsPitchBooking_Dev;
GO

-- Update Admin password
UPDATE [Users]
SET PasswordHash = '$2a$12$fJNLm2R5h2Ng6MI7VojL8.mp3JWYeXwMNfQ8Xuk1.KeSWNsZJtSyy',
    UpdatedAt = GETUTCDATE()
WHERE Email = 'admin@smartsport.vn';

-- Update Owner1 password
UPDATE [Users]
SET PasswordHash = '$2a$12$SDrFyjSfiTihWdRab9nIWuqvxg47JClD92oCSHyW5xojDMHV8yaRy',
    UpdatedAt = GETUTCDATE()
WHERE Email = 'owner1@smartsport.vn';

-- Update Owner2 password
UPDATE [Users]
SET PasswordHash = '$2a$12$SDrFyjSfiTihWdRab9nIWuqvxg47JClD92oCSHyW5xojDMHV8yaRy',
    UpdatedAt = GETUTCDATE()
WHERE Email = 'owner2@smartsport.vn';

-- Update Customer password
UPDATE [Users]
SET PasswordHash = '$2a$12$DgwDlb1Cw9f3OijZ16YLCumDsk6.RztAg/0PJciVNUm6SMFEk4I8i',
    UpdatedAt = GETUTCDATE()
WHERE Email = 'customer1@gmail.com';

GO

-- Verify updates
SELECT Email, FullName, Role, 
       CASE 
           WHEN PasswordHash = '$2a$12$fJNLm2R5h2Ng6MI7VojL8.mp3JWYeXwMNfQ8Xuk1.KeSWNsZJtSyy' THEN 'Admin@123'
           WHEN PasswordHash = '$2a$12$SDrFyjSfiTihWdRab9nIWuqvxg47JClD92oCSHyW5xojDMHV8yaRy' THEN 'Owner@123'
           WHEN PasswordHash = '$2a$12$DgwDlb1Cw9f3OijZ16YLCumDsk6.RztAg/0PJciVNUm6SMFEk4I8i' THEN 'Customer@123'
           ELSE 'Unknown'
       END AS Password,
       UpdatedAt
FROM [Users]
WHERE Email IN ('admin@smartsport.vn', 'owner1@smartsport.vn', 'owner2@smartsport.vn', 'customer1@gmail.com')
ORDER BY Role DESC;

PRINT 'Password hashes updated successfully!';
PRINT '';
PRINT 'Test Accounts:';
PRINT '  Admin: admin@smartsport.vn / Admin@123';
PRINT '  Owner1: owner1@smartsport.vn / Owner@123';
PRINT '  Owner2: owner2@smartsport.vn / Owner@123';
PRINT '  Customer: customer1@gmail.com / Customer@123';
GO
