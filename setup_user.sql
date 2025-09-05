-- Check if user exists and update password
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_user WHERE usename = 'urlshortener') THEN
        ALTER USER urlshortener WITH PASSWORD 'password';
        RAISE NOTICE 'Password updated for user urlshortener';
    ELSE
        CREATE USER urlshortener WITH PASSWORD 'password';
        RAISE NOTICE 'User urlshortener created';
    END IF;
END
$$;

-- Grant all privileges on database
GRANT ALL PRIVILEGES ON DATABASE wedding_photos TO urlshortener;

-- Connect to the wedding_photos database and grant schema privileges
\c wedding_photos

-- Grant all privileges on schema
GRANT ALL ON SCHEMA public TO urlshortener;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO urlshortener;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO urlshortener;

-- Make urlshortener owner of all tables
ALTER SCHEMA public OWNER TO urlshortener;

SELECT 'User setup complete!' as status;
