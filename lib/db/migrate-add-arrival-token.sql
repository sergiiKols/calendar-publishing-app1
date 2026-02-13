-- Migration: Add arrival_token column to inbox_articles table
-- Date: 2026-02-13

-- Add arrival_token column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'inbox_articles' 
    AND column_name = 'arrival_token'
  ) THEN
    ALTER TABLE inbox_articles 
    ADD COLUMN arrival_token VARCHAR(255);
    
    RAISE NOTICE 'Column arrival_token added to inbox_articles table';
  ELSE
    RAISE NOTICE 'Column arrival_token already exists in inbox_articles table';
  END IF;
END $$;
