using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace KabakalGym.API.Migrations
{
    /// <inheritdoc />
    public partial class AddAiUsageTracker : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AiUsageTrackers",
                columns: table => new
                {
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    ChatPromptsUsed = table.Column<int>(type: "integer", nullable: false),
                    ChatWindowStart = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    RoutinesGeneratedThisWeek = table.Column<int>(type: "integer", nullable: false),
                    RoutineWeekStart = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AiUsageTrackers", x => x.UserId);
                    table.ForeignKey(
                        name: "FK_AiUsageTrackers_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AiUsageTrackers");
        }
    }
}
