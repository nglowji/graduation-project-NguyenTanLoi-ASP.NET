using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class SetAdditionalServiceApprovalDefaults : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                ALTER TABLE "AdditionalServices"
                ALTER COLUMN "IsActive" SET DEFAULT FALSE;
                """);

            migrationBuilder.Sql("""
                ALTER TABLE "AdditionalServices"
                ALTER COLUMN "Status" SET DEFAULT 'PendingApproval';
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                ALTER TABLE "AdditionalServices"
                ALTER COLUMN "IsActive" SET DEFAULT TRUE;
                """);

            migrationBuilder.Sql("""
                ALTER TABLE "AdditionalServices"
                ALTER COLUMN "Status" SET DEFAULT 'Active';
                """);
        }
    }
}
