-- Create user if not exists
DO
$do$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_user
      WHERE  usename = 'urlshortener') THEN
      CREATE USER urlshortener WITH PASSWORD 'password';
   END IF;
END
$do$;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE wedding_photos TO urlshortener;

-- Connect to wedding_photos database
\c wedding_photos;

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO urlshortener;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO urlshortener;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO urlshortener;
ALTER SCHEMA public OWNER TO urlshortener;
