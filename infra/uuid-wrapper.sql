-- Create uuid_generate_v4() as alias to gen_random_uuid() from pgcrypto
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION uuid_generate_v4()
RETURNS uuid
LANGUAGE sql
AS $$
    SELECT gen_random_uuid();
$$;