DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='hero_style') THEN
    ALTER TABLE events ADD COLUMN hero_style VARCHAR(20) DEFAULT 'palette';
    UPDATE events SET hero_style = 'palette';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='hero_colors') THEN
    ALTER TABLE events ADD COLUMN hero_colors JSONB DEFAULT '[]';
    UPDATE events SET hero_colors = '[]';
  END IF;
END $$;
