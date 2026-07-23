using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddUserOwnerRegistrationSubmittedFlag : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                ALTER TABLE "Users"
                ADD COLUMN IF NOT EXISTS "HasSubmittedOwnerRegistration" boolean NOT NULL DEFAULT FALSE;
                """);

            migrationBuilder.Sql("""
                UPDATE "Users"
                SET "HasSubmittedOwnerRegistration" = TRUE
                WHERE "Role" = 'PitchOwner'
                   OR "Id" IN (SELECT "OwnerId" FROM "SportCenters");
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                ALTER TABLE "Users"
                DROP COLUMN IF EXISTS "HasSubmittedOwnerRegistration";
                """);
        }
    }
}
