using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace KabakalGym.API.Migrations
{
    /// <inheritdoc />
    public partial class Sprint7_AnalyticsEngine : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_Visits_CheckIn",
                table: "Visits",
                column: "CheckIn");

            migrationBuilder.CreateIndex(
                name: "IX_Transactions_Timestamp",
                table: "Transactions",
                column: "Timestamp");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Visits_CheckIn",
                table: "Visits");

            migrationBuilder.DropIndex(
                name: "IX_Transactions_Timestamp",
                table: "Transactions");
        }
    }
}
