-- Create analytics table for tracking plays
CREATE TABLE IF NOT EXISTS audio_plays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audio_id uuid REFERENCES audio_files(id) ON DELETE CASCADE NOT NULL,
  playlist_id uuid REFERENCES playlists(id) ON DELETE CASCADE,
  played_at timestamptz DEFAULT now() NOT NULL,
  played_from text NOT NULL, -- 'playlist' or 'embed'
  played_duration integer NOT NULL -- Duration played in seconds
);

-- Enable RLS
ALTER TABLE audio_plays ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view plays for their audio
CREATE POLICY "Users can view plays for their audio"
  ON audio_plays
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM audio_files
      WHERE id = audio_plays.audio_id AND user_id = auth.uid()
    )
  );

-- Allow anyone to insert plays
CREATE POLICY "Anyone can insert plays"
  ON audio_plays
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Create analytics views
CREATE OR REPLACE VIEW audio_analytics AS
SELECT 
  af.id as audio_id,
  af.title as audio_title,
  af.user_id,
  COUNT(ap.id) as total_plays,
  COUNT(DISTINCT ap.playlist_id) as unique_playlists,
  SUM(ap.played_duration) as total_play_duration,
  COUNT(CASE WHEN ap.played_from = 'embed' THEN 1 END) as embed_plays,
  COUNT(CASE WHEN ap.played_from = 'playlist' THEN 1 END) as playlist_plays,
  MAX(ap.played_at) as last_played_at
FROM audio_files af
LEFT JOIN audio_plays ap ON ap.audio_id = af.id
GROUP BY af.id, af.title, af.user_id;