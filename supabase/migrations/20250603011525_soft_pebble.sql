/*
  # Add playlist clicks tracking
  
  1. New Tables
    - `playlist_clicks`: Tracks number of times a playlist is played
      - `id` (uuid, primary key)
      - `playlist_id` (uuid): References the playlist
      - `clicked_at` (timestamptz): When the click occurred
  
  2. Security
    - Enable RLS
    - Allow anyone to insert clicks
    - Allow users to view clicks for their playlists
*/

-- Create playlist_clicks table
CREATE TABLE IF NOT EXISTS playlist_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id uuid REFERENCES playlists(id) ON DELETE CASCADE NOT NULL,
  clicked_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE playlist_clicks ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert clicks
CREATE POLICY "Anyone can insert clicks"
  ON playlist_clicks
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow users to view clicks for their playlists
CREATE POLICY "Users can view clicks for their playlists"
  ON playlist_clicks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM playlists
      WHERE id = playlist_clicks.playlist_id
      AND user_id = auth.uid()
    )
  );