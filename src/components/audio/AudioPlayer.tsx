import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { PlaylistTrack } from '../../types';
import { trackPlay } from '../../lib/api';

type AudioPlayerProps = {
  tracks: PlaylistTrack[];
  currentTrackIndex: number;
  onTrackChange: (index: number) => void;
  playlistId?: string;
  playedFrom?: 'playlist' | 'embed';
};

export default function AudioPlayer({ 
  tracks, 
  currentTrackIndex, 
  onTrackChange,
  playlistId,
  playedFrom = 'playlist'
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const lastTrackingRef = useRef<number>(0);
  const trackingTimeoutRef = useRef<NodeJS.Timeout>();

  const currentTrack = tracks[currentTrackIndex]?.audio_file;

  useEffect(() => {
    // Reset player state when track changes
    setCurrentTime(0);
    setIsPlaying(false);
    lastTrackingRef.current = 0;
    
    // Set maximum volume and start playing after a slight delay
    if (audioRef.current) {
      audioRef.current.volume = 1.0;
    }
    
    const timeoutId = setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.play()
          .then(() => setIsPlaying(true))
          .catch(error => console.error('Playback failed:', error));
      }
    }, 300);
    
    return () => {
      clearTimeout(timeoutId);
      if (trackingTimeoutRef.current) {
        clearTimeout(trackingTimeoutRef.current);
      }
    };
  }, [currentTrackIndex]);

  // Track play progress every 0.5 seconds
  useEffect(() => {
    const trackPlayProgress = async () => {
      if (!isPlaying || !currentTrack || !audioRef.current) return;

      const currentDuration = Math.floor(audioRef.current.currentTime);
      const sinceLast = currentDuration - lastTrackingRef.current;

      if (sinceLast >= 0.5) {
        try {
          await trackPlay(
            currentTrack.id,
            playlistId || null,
            playedFrom,
            sinceLast
          );
          lastTrackingRef.current = currentDuration;
        } catch (error) {
          console.error('Failed to track play:', error);
        }
      }

      // Schedule next tracking
      trackingTimeoutRef.current = setTimeout(trackPlayProgress, 500);
    };

    if (isPlaying && currentTrack) {
      trackPlayProgress();
    }

    return () => {
      if (trackingTimeoutRef.current) {
        clearTimeout(trackingTimeoutRef.current);
      }
    };
  }, [isPlaying, currentTrack, playlistId, playedFrom]);

  const togglePlayPause = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play()
        .catch(error => console.error('Playback failed:', error));
    }
    
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    
    setCurrentTime(audioRef.current.currentTime);
    
    if (audioRef.current.ended) {
      playNextTrack();
    }
  };

  const handleLoadedMetadata = () => {
    if (!audioRef.current) return;
    setDuration(audioRef.current.duration);
    audioRef.current.volume = 1.0; // Ensure maximum volume on load
  };

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !audioRef.current) return;
    
    const progressBar = progressBarRef.current;
    const rect = progressBar.getBoundingClientRect();
    const clickPosition = e.clientX - rect.left;
    const percentage = clickPosition / rect.width;
    
    const newTime = percentage * duration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const playNextTrack = () => {
    if (currentTrackIndex < tracks.length - 1) {
      onTrackChange(currentTrackIndex + 1);
    } else {
      // Loop back to the first track
      onTrackChange(0);
    }
  };

  const playPreviousTrack = () => {
    if (currentTime > 3) {
      // If we're more than 3 seconds into the song, restart it
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        setCurrentTime(0);
      }
    } else if (currentTrackIndex > 0) {
      onTrackChange(currentTrackIndex - 1);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  if (!currentTrack) {
    return <div className="text-center py-8 text-slate-400">No tracks to play</div>;
  }

  return (
    <div className="bg-slate-900 rounded-lg p-4 shadow-lg">
      <audio
        ref={audioRef}
        src={currentTrack.file_url}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        preload="metadata"
      />
      
      <div className="flex items-center justify-between mb-4">
        <div className="truncate">
          <h3 className="font-medium truncate">{currentTrack.title}</h3>
          <p className="text-sm text-slate-400 truncate">{currentTrack.artist || 'Unknown Artist'}</p>
        </div>
        
        <div className="flex items-center">
          <Volume2 size={18} className="text-sky-400" />
        </div>
      </div>
      
      <div 
        ref={progressBarRef}
        className="h-2 bg-slate-700 rounded-full mb-4 cursor-pointer relative overflow-hidden"
        onClick={handleProgressBarClick}
      >
        <div 
          className="h-full bg-sky-500 rounded-full absolute top-0 left-0"
          style={{ width: `${(currentTime / duration) * 100}%` }}
        />
      </div>
      
      <div className="flex justify-between items-center">
        <div className="text-xs text-slate-400">
          {formatTime(currentTime)}
        </div>
        
        <div className="flex items-center space-x-4">
          <button 
            onClick={playPreviousTrack}
            className="text-slate-300 hover:text-white"
          >
            <SkipBack size={22} />
          </button>
          
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={togglePlayPause}
            className="bg-sky-500 hover:bg-sky-400 text-white p-2 rounded-full"
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </motion.button>
          
          <button 
            onClick={playNextTrack}
            className="text-slate-300 hover:text-white"
          >
            <SkipForward size={22} />
          </button>
        </div>
        
        <div className="text-xs text-slate-400">
          {formatTime(duration)}
        </div>
      </div>
    </div>
  );
}