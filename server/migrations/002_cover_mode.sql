DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='cover_mode') THEN
    ALTER TABLE events ADD COLUMN cover_mode VARCHAR(20) DEFAULT 'art';
    UPDATE events SET cover_mode = 'art';
  END IF;
END $$;
