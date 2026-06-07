using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace KabakalGym.API.Migrations
{
    /// <inheritdoc />
    public partial class UpdateUserRoleConstraint : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "CK_Users_Role",
                table: "Users");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Users_Role",
                table: "Users",
                sql: "\"Role\" IN ('Admin', 'Member', 'Staff', 'GateKiosk')");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "CK_Users_Role",
                table: "Users");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Users_Role",
                table: "Users",
                sql: "\"Role\" IN ('Admin', 'Member')");
        }
    }
}
