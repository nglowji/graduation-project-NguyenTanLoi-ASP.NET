-- =============================================
-- Seed Data for Sports Pitch Booking System
-- =============================================

USE SportsPitchBooking_Dev;
GO

-- Disable constraints for bulk insert
ALTER TABLE [Bookings] NOCHECK CONSTRAINT ALL;
ALTER TABLE [TimeSlots] NOCHECK CONSTRAINT ALL;
ALTER TABLE [Pitches] NOCHECK CONSTRAINT ALL;
ALTER TABLE [Users] NOCHECK CONSTRAINT ALL;
GO

-- =============================================
-- 1. USERS
-- =============================================
-- Password hashes generated with BCrypt WorkFactor 12
-- Admin@123 -> $2a$12$fJNLm2R5h2Ng6MI7VojL8.mp3JWYeXwMNfQ8Xuk1.KeSWNsZJtSyy
-- Owner@123 -> $2a$12$SDrFyjSfiTihWdRab9nIWuqvxg47JClD92oCSHyW5xojDMHV8yaRy
-- Customer@123 -> $2a$12$DgwDlb1Cw9f3OijZ16YLCumDsk6.RztAg/0PJciVNUm6SMFEk4I8i

SET IDENTITY_INSERT [Users] ON;

INSERT INTO [Users] (Id, Email, PasswordHash, FullName, PhoneNumber, Role, IsEmailConfirmed, IsActive, CreatedAt, UpdatedAt, IsDeleted)
VALUES 
    (1, 'admin@smartsport.vn', '$2a$12$fJNLm2R5h2Ng6MI7VojL8.mp3JWYeXwMNfQ8Xuk1.KeSWNsZJtSyy', N'Quản Trị Viên', '0901234567', 2, 1, 1, GETUTCDATE(), GETUTCDATE(), 0),
    (2, 'owner1@smartsport.vn', '$2a$12$SDrFyjSfiTihWdRab9nIWuqvxg47JClD92oCSHyW5xojDMHV8yaRy', N'Chủ Sân Thể Thao A', '0912345678', 1, 1, 1, GETUTCDATE(), GETUTCDATE(), 0),
    (3, 'owner2@smartsport.vn', '$2a$12$SDrFyjSfiTihWdRab9nIWuqvxg47JClD92oCSHyW5xojDMHV8yaRy', N'Chủ Sân Thể Thao B', '0923456789', 1, 1, 1, GETUTCDATE(), GETUTCDATE(), 0),
    (4, 'customer1@gmail.com', '$2a$12$DgwDlb1Cw9f3OijZ16YLCumDsk6.RztAg/0PJciVNUm6SMFEk4I8i', N'Nguyễn Văn A', '0934567890', 0, 1, 1, GETUTCDATE(), GETUTCDATE(), 0);

SET IDENTITY_INSERT [Users] OFF;

-- =============================================
-- 2. PITCHES
-- =============================================
SET IDENTITY_INSERT [Pitches] ON;

INSERT INTO [Pitches] (Id, Name, Description, PitchType, Status, OwnerId, 
                       Address_Street, Address_Ward, Address_District, Address_City, Address_PostalCode,
                       Latitude, Longitude, 
                       PricePerHour_Amount, PricePerHour_Currency,
                       CreatedAt, UpdatedAt, IsDeleted)
VALUES 
    -- Sân của Owner 1
    (1, N'Sân Bóng Đá Mini Thể Thao A', 
        N'Sân bóng đá mini 5 người, có mái che, đèn chiếu sáng hiện đại. Nằm trong khu dân cư an ninh, có bãi đỗ xe rộng rãi.',
        0, -- Football
        1, -- Available
        2, -- Owner1
        N'123 Đường Lê Văn Việt', N'Phường Tăng Nhơn Phú A', N'Quận 9', N'TP. Hồ Chí Minh', '700000',
        10.8505, 106.7717,
        200000, 'VND',
        GETUTCDATE(), GETUTCDATE(), 0),
    
    (2, N'Sân Cầu Lông Thể Thao A',
        N'Sân cầu lông tiêu chuẩn thi đấu, sàn gỗ chuyên dụng, điều hòa mát mẻ. Phù hợp cho cả luyện tập và thi đấu.',
        1, -- Badminton
        1, -- Available
        2, -- Owner1
        N'125 Đường Lê Văn Việt', N'Phường Tăng Nhơn Phú A', N'Quận 9', N'TP. Hồ Chí Minh', '700000',
        10.8506, 106.7718,
        100000, 'VND',
        GETUTCDATE(), GETUTCDATE(), 0),
    
    -- Sân của Owner 2
    (3, N'Sân Bóng Rổ Thể Thao B',
        N'Sân bóng rổ ngoài trời, mặt sân cao su chuyên dụng, có khán đài. Thích hợp cho các trận đấu giao hữu.',
        2, -- Basketball
        1, -- Available
        3, -- Owner2
        N'456 Đường Võ Văn Ngân', N'Phường Linh Chiểu', N'Thành phố Thủ Đức', N'TP. Hồ Chí Minh', '700000',
        10.8700, 106.7800,
        150000, 'VND',
        GETUTCDATE(), GETUTCDATE(), 0);

SET IDENTITY_INSERT [Pitches] OFF;

-- =============================================
-- 3. TIME SLOTS
-- =============================================
-- Tạo time slots cho 7 ngày tới, mỗi sân có 8 slots/ngày (6h-22h, mỗi slot 2h)
SET IDENTITY_INSERT [TimeSlots] ON;

DECLARE @StartDate DATE = CAST(GETUTCDATE() AS DATE);
DECLARE @PitchId INT;
DECLARE @DayOffset INT;
DECLARE @SlotId INT = 1;
DECLARE @Hour INT;

-- Loop qua 3 sân
DECLARE pitch_cursor CURSOR FOR SELECT Id FROM [Pitches];
OPEN pitch_cursor;
FETCH NEXT FROM pitch_cursor INTO @PitchId;

WHILE @@FETCH_STATUS = 0
BEGIN
    -- Loop qua 7 ngày
    SET @DayOffset = 0;
    WHILE @DayOffset < 7
    BEGIN
        -- Loop qua 8 time slots (6h-22h, mỗi slot 2h)
        SET @Hour = 6;
        WHILE @Hour < 22
        BEGIN
            INSERT INTO [TimeSlots] (Id, PitchId, 
                                    TimeRange_StartTime, TimeRange_EndTime,
                                    IsAvailable, CreatedAt, UpdatedAt, IsDeleted)
            VALUES (
                @SlotId,
                @PitchId,
                DATEADD(HOUR, @Hour, DATEADD(DAY, @DayOffset, @StartDate)),
                DATEADD(HOUR, @Hour + 2, DATEADD(DAY, @DayOffset, @StartDate)),
                1, -- Available
                GETUTCDATE(),
                GETUTCDATE(),
                0
            );
            
            SET @SlotId = @SlotId + 1;
            SET @Hour = @Hour + 2;
        END
        
        SET @DayOffset = @DayOffset + 1;
    END
    
    FETCH NEXT FROM pitch_cursor INTO @PitchId;
END

CLOSE pitch_cursor;
DEALLOCATE pitch_cursor;

SET IDENTITY_INSERT [TimeSlots] OFF;

-- =============================================
-- 4. SAMPLE BOOKING (Optional - for testing)
-- =============================================
-- Tạo 1 booking mẫu đã confirmed
SET IDENTITY_INSERT [Bookings] ON;

INSERT INTO [Bookings] (Id, UserId, PitchId, TimeSlotId, 
                        TotalAmount_Amount, TotalAmount_Currency,
                        DepositAmount_Amount, DepositAmount_Currency,
                        Status, BookingDate, CreatedAt, UpdatedAt, IsDeleted)
VALUES (
    1,
    4, -- Customer1
    1, -- Sân Bóng Đá Mini
    1, -- First time slot
    400000, 'VND', -- 2 hours * 200k
    200000, 'VND', -- 50% deposit
    2, -- Confirmed
    GETUTCDATE(),
    GETUTCDATE(),
    GETUTCDATE(),
    0
);

SET IDENTITY_INSERT [Bookings] OFF;

-- Update time slot to unavailable
UPDATE [TimeSlots] SET IsAvailable = 0 WHERE Id = 1;

-- =============================================
-- Re-enable constraints
-- =============================================
ALTER TABLE [Users] CHECK CONSTRAINT ALL;
ALTER TABLE [Pitches] CHECK CONSTRAINT ALL;
ALTER TABLE [TimeSlots] CHECK CONSTRAINT ALL;
ALTER TABLE [Bookings] CHECK CONSTRAINT ALL;
GO

-- =============================================
-- Verification Queries
-- =============================================
SELECT 'Users' AS TableName, COUNT(*) AS RecordCount FROM [Users];
SELECT 'Pitches' AS TableName, COUNT(*) AS RecordCount FROM [Pitches];
SELECT 'TimeSlots' AS TableName, COUNT(*) AS RecordCount FROM [TimeSlots];
SELECT 'Bookings' AS TableName, COUNT(*) AS RecordCount FROM [Bookings];
GO

PRINT 'Seed data completed successfully!';
PRINT '';
PRINT 'Test Accounts:';
PRINT '  Admin: admin@smartsport.vn / Admin@123';
PRINT '  Owner1: owner1@smartsport.vn / Owner@123';
PRINT '  Owner2: owner2@smartsport.vn / Owner@123';
PRINT '  Customer: customer1@gmail.com / Customer@123';
GO
