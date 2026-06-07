using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace KabakalGym.API.Migrations
{
    /// <inheritdoc />
    public partial class AddVisitApproval : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsApproved",
                table: "Visits",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsApproved",
                table: "Visits");
        }
    }
}
