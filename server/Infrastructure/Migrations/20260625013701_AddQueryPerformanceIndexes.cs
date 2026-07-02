using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddQueryPerformanceIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Reviews_PitchId",
                table: "Reviews");

            migrationBuilder.CreateIndex(
                name: "IX_Reviews_PitchId_CreatedAt",
                table: "Reviews",
                columns: new[] { "PitchId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_PaymentTransactions_Status_CreatedAt",
                table: "PaymentTransactions",
                columns: new[] { "Status", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_BookingDate_Status",
                table: "Bookings",
                columns: new[] { "BookingDate", "Status" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Reviews_PitchId_CreatedAt",
                table: "Reviews");

            migrationBuilder.DropIndex(
                name: "IX_PaymentTransactions_Status_CreatedAt",
                table: "PaymentTransactions");

            migrationBuilder.DropIndex(
                name: "IX_Bookings_BookingDate_Status",
                table: "Bookings");

            migrationBuilder.CreateIndex(
                name: "IX_Reviews_PitchId",
                table: "Reviews",
                column: "PitchId");
        }
    }
}
