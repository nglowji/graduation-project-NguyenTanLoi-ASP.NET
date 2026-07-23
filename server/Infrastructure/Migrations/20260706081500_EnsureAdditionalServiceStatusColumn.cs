using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class EnsureAdditionalServiceStatusColumn : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                ALTER TABLE "AdditionalServices"
                ADD COLUMN IF NOT EXISTS "Status" text NOT NULL DEFAULT 'Active';
                """);

            migrationBuilder.Sql("""
                UPDATE "AdditionalServices"
                SET "Status" = CASE
                    WHEN "IsActive" = TRUE THEN 'Active'
                    ELSE 'PendingApproval'
                END
                WHERE "Status" IS NULL OR "Status" = '';
                """);

            migrationBuilder.Sql("""
                CREATE INDEX IF NOT EXISTS "IX_AdditionalServices_Status"
                ON "AdditionalServices" ("Status");
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                DROP INDEX IF EXISTS "IX_AdditionalServices_Status";
                """);

            migrationBuilder.Sql("""
                ALTER TABLE "AdditionalServices"
                DROP COLUMN IF EXISTS "Status";
                """);
        }
    }
}
