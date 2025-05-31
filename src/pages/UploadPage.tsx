import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Music } from 'lucide-react'; // Added Music icon for empty state
import { useAuth } from '../context/AuthContext';
import AudioUploader from '../components/audio/AudioUploader';
import { getUserAudioFiles } from '../lib/api';
import { AudioFile } from '../types';

export default function UploadPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(true); // Renamed for clarity
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  const fetchAudioFiles = async () => {
    if (!user) return;

    try {
      setIsLoadingFiles(true);
      setError(null); // Clear previous errors
      const files = await getUserAudioFiles(user.id);
      setAudioFiles(files);
    } catch (err) {
      setError('Failed to load your audio files.');
      console.error(err);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  useEffect(() => {
    // Fetch files when the user is available
    if (user) {
      fetchAudioFiles();
    }
  }, [user]); // Dependency on user

  const handleUploadComplete = () => {
    // Simply refetch the audio files
    fetchAudioFiles();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }); // More readable format
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  if (loading) { // This is AuthContext loading
    return (
      <div className="container mx-auto py-16 px-4 flex justify-center items-center min-h-[calc(100vh-8rem)]">
        <div className="animate-spin h-10 w-10 text-sky-500"> {/* Slightly larger spinner */}
          <RefreshCw size={40} />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8"> {/* Responsive padding for container */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Upload Audio</h1>
        <p className="text-slate-400">
          Upload your audio files to your library. You can then add them to playlists.
        </p>
      </div>

      {/* Main grid layout: 1 column on mobile, 2 (effective) on md+ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        <div className="md:col-span-1">
          {/* Assuming AudioUploader is internally responsive or takes full width of its container */}
          <AudioUploader onUploadComplete={handleUploadComplete} />
        </div>

        <div className="md:col-span-2">
          <div className="card p-4 sm:p-6"> {/* Responsive padding for the card */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
              <h2 className="text-xl font-semibold">Your Audio Files</h2>
              <button
                onClick={fetchAudioFiles}
                disabled={isLoadingFiles}
                className="btn btn-secondary mt-3 sm:mt-0 text-sm py-1.5 px-3 flex items-center self-start sm:self-center" // Smaller refresh button
              >
                <RefreshCw size={16} className={`mr-2 ${isLoadingFiles ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            {error && (
              <div className="bg-red-900/50 border border-red-700 text-white p-3 rounded-md mb-4 text-sm">
                {error}
              </div>
            )}

            {isLoadingFiles ? (
              <div className="py-12 flex justify-center items-center"> {/* Increased padding for loading state */}
                <div className="animate-spin h-8 w-8 text-sky-500">
                  <RefreshCw size={32} />
                </div>
              </div>
            ) : audioFiles.length === 0 ? (
              <div className="text-center py-12 text-slate-400"> {/* Increased padding for empty state */}
                <Music size={48} className="mx-auto mb-4 text-slate-500" />
                <p className="text-lg">No audio files found.</p>
                <p className="mt-1 text-sm">Use the form to upload your first audio file.</p>
              </div>
            ) : (
              // Ensure table container allows for horizontal scrolling on smaller screens
              <div className="overflow-x-auto scrollbar-thin">
                <table className="min-w-full w-full divide-y divide-slate-700/50">
                  <thead className="bg-slate-800/30"> {/* Added subtle background to thead for better distinction */}
                    <tr>
                      <th className="px-3 py-3 sm:px-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Title</th>
                      <th className="px-3 py-3 sm:px-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider hidden sm:table-cell">Artist</th> {/* Hide on xs screens */}
                      <th className="px-3 py-3 sm:px-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider hidden md:table-cell">Duration</th> {/* Hide on xs, sm screens */}
                      <th className="px-3 py-3 sm:px-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Uploaded</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {audioFiles.map((file) => (
                      <tr key={file.id} className="hover:bg-slate-700/30 transition-colors duration-150">
                        <td className="px-3 py-3 sm:px-4 whitespace-nowrap">
                          <div className="font-medium text-sm sm:text-base truncate max-w-xs">{file.title}</div>
                          {/* Show artist below title on xs screens where artist column is hidden */}
                          <div className="text-xs text-slate-500 sm:hidden">{file.artist || 'Unknown Artist'}</div>
                        </td>
                        <td className="px-3 py-3 sm:px-4 whitespace-nowrap text-slate-400 text-sm hidden sm:table-cell">
                          {file.artist || 'Unknown Artist'}
                        </td>
                        <td className="px-3 py-3 sm:px-4 whitespace-nowrap text-slate-400 text-sm hidden md:table-cell">
                          {formatDuration(file.duration)}
                        </td>
                        <td className="px-3 py-3 sm:px-4 whitespace-nowrap text-slate-400 text-sm">
                          {formatDate(file.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}