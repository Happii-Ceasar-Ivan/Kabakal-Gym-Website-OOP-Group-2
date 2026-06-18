CREATE TABLE IF NOT EXISTS "__EFMigrationsHistory" (
    "MigrationId" character varying(150) NOT NULL,
    "ProductVersion" character varying(32) NOT NULL,
    CONSTRAINT "PK___EFMigrationsHistory" PRIMARY KEY ("MigrationId")
);

START TRANSACTION;
CREATE TABLE "Equipments" (
    "EquipmentId" uuid NOT NULL,
    "EquipmentStatus" character varying(255) NOT NULL,
    "EquipmentName" character varying(100) NOT NULL,
    "IsActive" boolean NOT NULL,
    CONSTRAINT "PK_Equipments" PRIMARY KEY ("EquipmentId"),
    CONSTRAINT "CK_Equipments_Status" CHECK ("EquipmentStatus" IN ('Available', 'Under Maintenance', 'Unavailable'))
);

CREATE TABLE "Users" (
    "UserId" uuid NOT NULL,
    "Email" character varying(255) NOT NULL,
    "PasswordHash" character varying(255) NOT NULL,
    "Role" character varying(50) NOT NULL,
    "IsActive" boolean NOT NULL,
    CONSTRAINT "PK_Users" PRIMARY KEY ("UserId"),
    CONSTRAINT "CK_Users_Role" CHECK ("Role" IN ('Admin', 'Member'))
);

CREATE TABLE "Exercises" (
    "ExerciseId" uuid NOT NULL,
    "EquipmentId" uuid NOT NULL,
    "ExerciseName" character varying(100) NOT NULL,
    "MuscleGroup" character varying(50) NOT NULL,
    "MovementType" character varying(50) NOT NULL,
    "AlternativeExerciseName" character varying(100),
    "IsActive" boolean NOT NULL,
    CONSTRAINT "PK_Exercises" PRIMARY KEY ("ExerciseId"),
    CONSTRAINT "FK_Exercises_Equipments_EquipmentId" FOREIGN KEY ("EquipmentId") REFERENCES "Equipments" ("EquipmentId") ON DELETE RESTRICT
);

CREATE TABLE "Routines" (
    "RoutineId" uuid NOT NULL,
    "UserId" uuid NOT NULL,
    "DayLabel" character varying(20) NOT NULL,
    "FocusArea" character varying(100) NOT NULL,
    "IsRestDay" boolean NOT NULL,
    "IsCompleted" boolean NOT NULL,
    "DateAssigned" date NOT NULL,
    "CompletedAt" timestamp with time zone,
    CONSTRAINT "PK_Routines" PRIMARY KEY ("RoutineId"),
    CONSTRAINT "FK_Routines_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("UserId") ON DELETE CASCADE
);

CREATE TABLE "Subscriptions" (
    "UserId" uuid NOT NULL,
    "PaymentStatus" character varying(50) NOT NULL,
    "ExpirationDate" timestamp with time zone,
    CONSTRAINT "PK_Subscriptions" PRIMARY KEY ("UserId"),
    CONSTRAINT "CK_Subscriptions_PaymentStatus" CHECK ("PaymentStatus" IN ('Paid', 'Unpaid', 'Pending')),
    CONSTRAINT "FK_Subscriptions_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("UserId") ON DELETE CASCADE
);

CREATE TABLE "Transactions" (
    "TransactionId" uuid NOT NULL,
    "UserId" uuid NOT NULL,
    "AmountPaid" numeric(10,2) NOT NULL,
    "PaymentMethod" character varying(50) NOT NULL,
    "Timestamp" timestamp with time zone NOT NULL DEFAULT (NOW()),
    CONSTRAINT "PK_Transactions" PRIMARY KEY ("TransactionId"),
    CONSTRAINT "CK_Transactions_PaymentMethod" CHECK ("PaymentMethod" IN ('Cash', 'GCash', 'Card', 'QR-Code')),
    CONSTRAINT "FK_Transactions_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("UserId") ON DELETE RESTRICT
);

CREATE TABLE "Visits" (
    "VisitId" uuid NOT NULL,
    "UserId" uuid NOT NULL,
    "CheckIn" timestamp with time zone NOT NULL DEFAULT (NOW()),
    "CheckOut" timestamp with time zone,
    CONSTRAINT "PK_Visits" PRIMARY KEY ("VisitId"),
    CONSTRAINT "FK_Visits_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("UserId") ON DELETE CASCADE
);

CREATE TABLE "RoutineLists" (
    "RoutineListId" uuid NOT NULL,
    "OrderIndex" integer NOT NULL,
    "RoutineId" uuid NOT NULL,
    "ExerciseId" uuid NOT NULL,
    "Sets" character varying(10) NOT NULL,
    "Reps" character varying(10) NOT NULL,
    "StartingWeight" character varying(50) NOT NULL,
    CONSTRAINT "PK_RoutineLists" PRIMARY KEY ("RoutineListId"),
    CONSTRAINT "FK_RoutineLists_Exercises_ExerciseId" FOREIGN KEY ("ExerciseId") REFERENCES "Exercises" ("ExerciseId") ON DELETE RESTRICT,
    CONSTRAINT "FK_RoutineLists_Routines_RoutineId" FOREIGN KEY ("RoutineId") REFERENCES "Routines" ("RoutineId") ON DELETE CASCADE
);

CREATE INDEX "IX_Exercises_EquipmentId" ON "Exercises" ("EquipmentId");

CREATE INDEX "IX_Exercises_MuscleGroup_MovementType" ON "Exercises" ("MuscleGroup", "MovementType");

CREATE INDEX "IX_RoutineLists_ExerciseId" ON "RoutineLists" ("ExerciseId");

CREATE INDEX "IX_RoutineLists_RoutineId" ON "RoutineLists" ("RoutineId");

CREATE INDEX "IX_Routines_UserId_DateAssigned" ON "Routines" ("UserId", "DateAssigned");

CREATE INDEX "IX_Subscriptions_ExpirationDate" ON "Subscriptions" ("ExpirationDate");

CREATE INDEX "IX_Transactions_UserId_Timestamp" ON "Transactions" ("UserId", "Timestamp");

CREATE UNIQUE INDEX "IX_Users_Email_Unique" ON "Users" ("Email");

CREATE INDEX "IX_Visits_UserId_CheckIn" ON "Visits" ("UserId", "CheckIn");

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260531123921_InitialCreate', '10.0.8');

COMMIT;

START TRANSACTION;
ALTER TABLE "Users" ADD "FirstName" character varying(100) NOT NULL DEFAULT '';

ALTER TABLE "Users" ADD "LastName" character varying(100) NOT NULL DEFAULT '';

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260531152421_AddUserNames', '10.0.8');

COMMIT;

START TRANSACTION;
CREATE TABLE "PasswordResets" (
    "Id" integer GENERATED BY DEFAULT AS IDENTITY,
    "UserEmail" character varying(255) NOT NULL,
    "Token" character varying(255) NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL DEFAULT (NOW()),
    CONSTRAINT "PK_PasswordResets" PRIMARY KEY ("Id")
);

CREATE UNIQUE INDEX "IX_PasswordResets_Token" ON "PasswordResets" ("Token");

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260603054850_AddPasswordResets', '10.0.8');

COMMIT;

START TRANSACTION;
ALTER TABLE "Users" ADD "IsVerified" boolean NOT NULL DEFAULT FALSE;

ALTER TABLE "Users" ADD "VerificationToken" character varying(255);

ALTER TABLE "Users" ADD "VerificationTokenExpiresAt" timestamp with time zone;

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260604035233_AddEmailVerification', '10.0.8');

COMMIT;

START TRANSACTION;
INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260605145928_AddEquipmentDbSet', '10.0.8');

COMMIT;

START TRANSACTION;
ALTER TABLE "Equipments" ADD "ImageUrl" character varying(500);

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260607053604_AddEquipmentImageUrl', '10.0.8');

COMMIT;

START TRANSACTION;
ALTER TABLE "Visits" ADD "IsApproved" boolean NOT NULL DEFAULT FALSE;

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260607091417_AddVisitApproval', '10.0.8');

COMMIT;

START TRANSACTION;
ALTER TABLE "Users" DROP CONSTRAINT "CK_Users_Role";

ALTER TABLE "Users" ADD CONSTRAINT "CK_Users_Role" CHECK ("Role" IN ('Admin', 'Member', 'Staff', 'GateKiosk'));

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260607100550_UpdateUserRoleConstraint', '10.0.8');

COMMIT;

START TRANSACTION;
CREATE TABLE "AiUsageTrackers" (
    "UserId" uuid NOT NULL,
    "ChatPromptsUsed" integer NOT NULL,
    "ChatWindowStart" timestamp with time zone NOT NULL,
    "RoutinesGeneratedThisWeek" integer NOT NULL,
    "RoutineWeekStart" timestamp with time zone NOT NULL,
    CONSTRAINT "PK_AiUsageTrackers" PRIMARY KEY ("UserId"),
    CONSTRAINT "FK_AiUsageTrackers_Users_UserId" FOREIGN KEY ("UserId") REFERENCES "Users" ("UserId") ON DELETE CASCADE
);

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260614085149_AddAiUsageTracker', '10.0.8');

COMMIT;

START TRANSACTION;
CREATE INDEX "IX_Visits_CheckIn" ON "Visits" ("CheckIn");

CREATE INDEX "IX_Transactions_Timestamp" ON "Transactions" ("Timestamp");

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260618075010_Sprint7_AnalyticsEngine', '10.0.8');

COMMIT;

