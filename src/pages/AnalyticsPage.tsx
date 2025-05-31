import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Clock, ListMusic, Share2, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/layout/LoadingSpinner';
import { getAudioAnalytics } from '../lib/api';
import { Analytics } from '../types';

export default function AnalyticsPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<Analytics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  const fetchAnalytics = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);
      const data = await getAudioAnalytics(user.id);
      setAnalytics(data);
    } catch (err) {
      setError('Failed to load analytics data.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [user]);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Analytics Dashboard</h1>
          <p className="text-slate-400">
            Track plays and engagement for your audio content
          </p>
        </div>

        <button
          onClick={fetchAnalytics}
          className="btn-secondary self-start sm:self-auto"
        >
          <RefreshCw size={18} className="mr-2" />
          Refresh Data
        </button>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-700 text-white p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {analytics.length === 0 ? (
        <div className="card p-8 text-center">
          <BarChart3 size={48} className="text-slate-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Analytics Data Yet</h2>
          <p className="text-slate-400">
            Upload some audio files and share them to start tracking plays.
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-400 mb-1">Total Plays</p>
                  <p className="text-2xl font-bold">
                    {analytics.reduce((sum, item) => sum + item.total_plays, 0)}
                  </p>
                </div>
                <div className="bg-sky-500/20 p-2 rounded-lg">
                  <BarChart3 size={20} className="text-sky-400" />
                </div>
              </div>
            </div>

            <div className="card p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-400 mb-1">Total Duration</p>
                  <p className="text-2xl font-bold">
                    {formatDuration(
                      analytics.reduce((sum, item) => sum + item.total_play_duration, 0)
                    )}
                  </p>
                </div>
                <div className="bg-orange-500/20 p-2 rounded-lg">
                  <Clock size={20} className="text-orange-400" />
                </div>
              </div>
            </div>

            <div className="card p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-400 mb-1">Playlist Plays</p>
                  <p className="text-2xl font-bold">
                    {analytics.reduce((sum, item) => sum + item.playlist_plays, 0)}
                  </p>
                </div>
                <div className="bg-purple-500/20 p-2 rounded-lg">
                  <ListMusic size={20} className="text-purple-400" />
                </div>
              </div>
            </div>

            <div className="card p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-400 mb-1">Embed Plays</p>
                  <p className="text-2xl font-bold">
                    {analytics.reduce((sum, item) => sum + item.embed_plays, 0)}
                  </p>
                </div>
                <div className="bg-emerald-500/20 p-2 rounded-lg">
                  <Share2 size={20} className="text-emerald-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Analytics Table */}
          <div className="card overflow-hidden">
            <div className="p-4 bg-slate-800/50">
              <h2 className="text-lg font-semibold">Audio Performance</h2>
            </div>

            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full divide-y divide-slate-700/50">
                <thead className="bg-slate-800/30">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Audio</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Total Plays</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider hidden sm:table-cell">Play Duration</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider hidden md:table-cell">Playlists</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider hidden lg:table-cell">Last Played</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {analytics.map((item) => (
                    <tr key={item.audio_id} className="hover:bg-slate-700/30">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="font-medium">{item.audio_title}</div>
                        <div className="text-sm text-slate-400 sm:hidden">
                          {formatDuration(item.total_play_duration)}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{item.total_plays}</span>
                          <div className="text-sm text-slate-400">
                            ({item.embed_plays} embedded)
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap hidden sm:table-cell">
                        {formatDuration(item.total_play_duration)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap hidden md:table-cell">
                        <div className="flex items-center space-x-1">
                          <span>{item.unique_playlists}</span>
                          <ListMusic size={16} className="text-slate-400" />
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-slate-400 hidden lg:table-cell">
                        {formatDate(item.last_played_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}