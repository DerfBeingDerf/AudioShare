export interface AudioFile {
  id: string;
  user_id: string;
  title: string;
  artist?: string;
  description?: string;
  file_path: string;
  file_url: string;
  duration: number;
  created_at: string;
}

export interface Playlist {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  cover_url?: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlaylistTrack {
  id: string;
  playlist_id: string;
  audio_id: string;
  position: number;
  audio_file: AudioFile;
}

export interface Analytics {
  audio_id: string;
  audio_title: string;
  total_plays: number;
  unique_playlists: number;
  total_play_duration: number;
  embed_plays: number;
  playlist_plays: number;
  last_played_at: string;
}