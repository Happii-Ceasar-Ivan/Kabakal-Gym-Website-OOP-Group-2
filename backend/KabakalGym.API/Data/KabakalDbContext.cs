using Microsoft.EntityFrameworkCore;
using KabakalGym.API.Models;

namespace KabakalGym.API.Data;

/// <summary>
/// EF Core DbContext for Neon.tech PostgreSQL.
/// Lazy loading is disabled to prevent N+1 queries.
/// </summary>
public class KabakalDbContext : DbContext
{
    public KabakalDbContext(DbContextOptions<KabakalDbContext> options) : base(options) { }

    // ── DbSets ─────────────────────────────────────────────────────────────
    public DbSet<User>         Users         => Set<User>();
    public DbSet<Subscription> Subscriptions => Set<Subscription>();
    public DbSet<Transaction>  Transactions  => Set<Transaction>();
    public DbSet<Visit>        Visits        => Set<Visit>();
    public DbSet<Exercise>     Exercises     => Set<Exercise>();
    public DbSet<Routine>      Routines      => Set<Routine>();
    public DbSet<RoutineList>  RoutineLists  => Set<RoutineList>();
    public DbSet<Equipment>    Equipments    => Set<Equipment>();
    public DbSet<PasswordReset> PasswordResets => Set<PasswordReset>();
    public DbSet<AiUsageTracker> AiUsageTrackers => Set<AiUsageTracker>();



    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // ── Table 1: Users ─────────────────────────────────────────────────
        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("Users");
            entity.HasKey(u => u.UserId);

            // Enforce unique emails.
            entity.HasIndex(u => u.Email)
                  .IsUnique()
                  .HasDatabaseName("IX_Users_Email_Unique");

            // Enforce valid user roles.
            entity.ToTable(t => t.HasCheckConstraint(
                "CK_Users_Role",
                $"\"Role\" IN ('{UserRoles.Admin}', '{UserRoles.Member}', '{UserRoles.Staff}', '{UserRoles.GateKiosk}')"
            ));
        });

        // ── Table 2: Subscriptions (1-to-1 with Users) ────────────────────
        modelBuilder.Entity<Subscription>(entity =>
        {
            entity.ToTable("Subscriptions");
            entity.HasKey(s => s.UserId);

            // Optimize membership queries.
            entity.HasIndex(s => s.ExpirationDate)
                  .HasDatabaseName("IX_Subscriptions_ExpirationDate");

            // CHECK constraint on PaymentStatus
            entity.ToTable(t => t.HasCheckConstraint(
                "CK_Subscriptions_PaymentStatus",
                $"\"PaymentStatus\" IN ('{PaymentStatuses.Paid}', '{PaymentStatuses.Unpaid}', '{PaymentStatuses.Pending}')"
            ));

            entity.HasOne(s => s.User)
                  .WithOne(u => u.Subscription)
                  .HasForeignKey<Subscription>(s => s.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // ── Table 3: Transactions ──────────────────────────────────────────
        modelBuilder.Entity<Transaction>(entity =>
        {
            entity.ToTable("Transactions");
            entity.HasKey(t => t.TransactionId);

            // Optimize revenue aggregation queries.
            entity.HasIndex(t => new { t.UserId, t.Timestamp })
                  .HasDatabaseName("IX_Transactions_UserId_Timestamp");

            // PostgreSQL default for Timestamp column
            entity.Property(t => t.Timestamp)
                  .HasDefaultValueSql("NOW()");

            // Enforce valid payment methods.
            entity.ToTable(t => t.HasCheckConstraint(
                "CK_Transactions_PaymentMethod",
                "\"PaymentMethod\" IN ('Cash', 'GCash', 'Card', 'QR-Code')"
            ));

            entity.HasOne(t => t.User)
                  .WithMany(u => u.Transactions)
                  .HasForeignKey(t => t.UserId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // ── Table 4: Visits ────────────────────────────────────────────────
        modelBuilder.Entity<Visit>(entity =>
        {
            entity.ToTable("Visits");
            entity.HasKey(v => v.VisitId);

            // Optimize attendance queries.
            entity.HasIndex(v => new { v.UserId, v.CheckIn })
                  .HasDatabaseName("IX_Visits_UserId_CheckIn");

            entity.Property(v => v.CheckIn)
                  .HasDefaultValueSql("NOW()");

            entity.HasOne(v => v.User)
                  .WithMany(u => u.Visits)
                  .HasForeignKey(v => v.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // ── Table 5: Exercises ─────────────────────────────────────────────
        modelBuilder.Entity<Exercise>(entity =>
        {
            entity.ToTable("Exercises");
            entity.HasKey(e => e.ExerciseId);

            // Index on MuscleGroup + MovementType for Workout Engine filtering
            entity.HasIndex(e => new { e.MuscleGroup, e.MovementType })
                  .HasDatabaseName("IX_Exercises_MuscleGroup_MovementType");

            // Prevent cascade delete of exercises when equipment is removed.
            entity.HasOne(e => e.Equipment)
                  .WithMany(eq => eq.Exercises)
                  .HasForeignKey(e => e.EquipmentId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // ── Table 6: Routines ──────────────────────────────────────────────
        modelBuilder.Entity<Routine>(entity =>
        {
            entity.ToTable("Routines");
            entity.HasKey(r => r.RoutineId);

            // Optimize "Today's Workout" queries.
            entity.HasIndex(r => new { r.UserId, r.DateAssigned })
                  .HasDatabaseName("IX_Routines_UserId_DateAssigned");

            entity.HasOne(r => r.User)
                  .WithMany(u => u.Routines)
                  .HasForeignKey(r => r.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // ── Table 7: RoutineLists (junction / line-items) ─────────────────
        modelBuilder.Entity<RoutineList>(entity =>
        {
            entity.ToTable("RoutineLists");

            entity.HasKey(rl => rl.RoutineListId);

            entity.HasOne(rl => rl.Routine)
                  .WithMany(r => r.RoutineLists)
                  .HasForeignKey(rl => rl.RoutineId)
                  .OnDelete(DeleteBehavior.Cascade);

            // Prevent cascade delete of historical routine records.
            entity.HasOne(rl => rl.Exercise)
                  .WithMany(e => e.RoutineLists)
                  .HasForeignKey(rl => rl.ExerciseId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // ── Table 8: Equipments ────────────────────────────────────────────
        modelBuilder.Entity<Equipment>(entity =>
        {
            entity.ToTable("Equipments");
            entity.HasKey(eq => eq.EquipmentId);

            // Enforce valid equipment statuses.
            entity.ToTable(t => t.HasCheckConstraint(
                "CK_Equipments_Status",
                "\"EquipmentStatus\" IN ('Available', 'Under Maintenance', 'Unavailable')"
            ));
        });

        // ── Table 9: PasswordResets ─────────────────────────────────────────
        modelBuilder.Entity<PasswordReset>(entity =>
        {
            entity.ToTable("PasswordResets");
            entity.HasKey(pr => pr.Id);

            // Fast token lookup when user clicks the reset link
            entity.HasIndex(pr => pr.Token)
                  .IsUnique()
                  .HasDatabaseName("IX_PasswordResets_Token");

            entity.Property(pr => pr.CreatedAt)
                  .HasDefaultValueSql("NOW()");
        });

        // ── Table 10: AiUsageTrackers ───────────────────────────────────────
        modelBuilder.Entity<AiUsageTracker>(entity =>
        {
            entity.ToTable("AiUsageTrackers");
            entity.HasKey(t => t.UserId);

            entity.HasOne(t => t.User)
                  .WithOne()
                  .HasForeignKey<AiUsageTracker>(t => t.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
