DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='hero_image') THEN
    ALTER TABLE events ADD COLUMN hero_image TEXT DEFAULT '';
  END IF;
END $$;
