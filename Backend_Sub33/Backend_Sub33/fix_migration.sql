CREATE TABLE IF NOT EXISTS " __EFMigrationsHistory\ (
 \MigrationId\ character varying(150) NOT NULL,
 \ProductVersion\ character varying(32) NOT NULL,
 CONSTRAINT \PK___EFMigrationsHistory\ PRIMARY KEY (\MigrationId\)
);

INSERT INTO \__EFMigrationsHistory\ (\MigrationId\, \ProductVersion\)
VALUES ('20260917045937_InitialCreate', '8.0.32')
ON CONFLICT (\MigrationId\) DO NOTHING;
