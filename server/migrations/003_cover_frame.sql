DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='cover_frame') THEN
    ALTER TABLE events ADD COLUMN cover_frame VARCHAR(20) DEFAULT 'arch';
    UPDATE events SET cover_frame = 'arch';
  END IF;
END $$;
