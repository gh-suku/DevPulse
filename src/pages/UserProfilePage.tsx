// src/pages/UserProfilePage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase, Profile } from '../lib/supabase';
import { User, ArrowLeft, Loader2, CheckCircle2, Target, TrendingUp, Phone, Briefcase, Calendar } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Layout } from '../components/Layout';

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  completed_at: string | null;
  created_at: string;
}

export const UserProfilePage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [completedTasks, setCompletedTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!username) {
        setError('Username not provided');
        setLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('profiles')
          .select('*')
          .eq('username', username)
          .single();

        if (fetchError) {
          if (fetchError.code === 'PGRST116') {
            setError('User not found');
          } else {
            throw fetchError;
          }
        } else {
          setProfile(data);
          fetchCompletedTasks(data.id);
        }
      } catch (err: any) {
        console.error('Error fetching profile:', err);
        setError('Failed to load user profile');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [username]);

  const fetchCompletedTasks = async (userId: string) => {
    try {
      setTasksLoading(true);
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false });

      if (error) throw error;
      setCompletedTasks(data || []);
    } catch (error) {
      console.error('Error fetching completed tasks:', error);
      setCompletedTasks([]);
    } finally {
      setTasksLoading(false);
    }
  };

  const handleScreenChange = (screen: string) => {
    navigate('/dashboard', { state: { screen } });
  };

  if (loading) {
    return (
      <Layout breadcrumb="User Profile" onScreenChange={handleScreenChange}>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading profile...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !profile) {
    return (
      <Layout breadcrumb="User Profile" onScreenChange={handleScreenChange}>
        <div className="flex items-center justify-center py-20">
          <div className="text-center max-w-md mx-auto p-8">
            <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-rose-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">User Not Found</h1>
            <p className="text-gray-600 mb-6">{error || 'The user you are looking for does not exist.'}</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTaskDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'text-rose-600 bg-rose-50';
      case 'high':
        return 'text-orange-600 bg-orange-50';
      case 'medium':
        return 'text-blue-600 bg-blue-50';
      case 'low':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <Layout
      breadcrumb={`@${profile.username}`}
      onScreenChange={handleScreenChange}
      headerActions={
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      }
    >
      <div className="mb-6 md:mb-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Cover Section */}
          <div className="h-32 bg-gradient-to-r from-emerald-400 to-emerald-600"></div>

          {/* Profile Info */}
          <div className="px-6 md:px-8 pb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6 -mt-16 mb-6">
              {/* Avatar */}
              <div className="relative">
                <div className="w-32 h-32 rounded-full border-4 border-white bg-gray-200 overflow-hidden shadow-lg">
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-4xl font-bold">
                      {profile.full_name.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
              </div>

              {/* Name and Username */}
              <div className="flex-1">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{profile.full_name}</h1>
                <p className="text-base md:text-lg text-gray-500 mt-1">@{profile.username}</p>
              </div>
            </div>

            {/* Bio */}
            {profile.bio && (
              <div className="mb-8">
                <p className="text-gray-700 leading-relaxed">{profile.bio}</p>
              </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 min-w-0">
              <div className="flex items-start gap-3 p-4 bg-emerald-50 rounded-lg">
                <div className="p-2 bg-white rounded-lg">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-emerald-600 font-medium">Total Points</p>
                  <p className="text-2xl text-emerald-700 font-bold mt-1">{(profile as any).points || 0}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                <div className="p-2 bg-white rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-blue-600 font-medium">Completed Tasks</p>
                  <p className="text-2xl text-blue-700 font-bold mt-1">{completedTasks.length}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                <div className="p-2 bg-white rounded-lg">
                  <Calendar className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Member Since</p>
                  <p className="text-gray-900 font-semibold mt-1">{formatDate(profile.created_at)}</p>
                </div>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 mb-8 min-w-0">
              {profile.department && (
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                  <div className="p-2 bg-white rounded-lg">
                    <Briefcase className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Department</p>
                    <p className="text-gray-900 font-semibold mt-1">{profile.department}</p>
                  </div>
                </div>
              )}

              {profile.phone && (
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                  <div className="p-2 bg-white rounded-lg">
                    <Phone className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Phone</p>
                    <p className="text-gray-900 font-semibold mt-1">{profile.phone}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Completed Tasks Section */}
            <div>
              <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6 text-emerald-500" />
                Completed Tasks
              </h2>

              {tasksLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse bg-gray-50 rounded-lg p-4 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : completedTasks.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <Target className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No completed tasks yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {completedTasks.map((task) => (
                    <div
                      key={task.id}
                      className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-start gap-3 mb-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900">{task.title}</h3>
                          {task.description && (
                            <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-3 ml-8">
                        <span className={cn(
                          "text-xs px-2.5 py-1 rounded-full font-medium",
                          getPriorityColor(task.priority)
                        )}>
                          {task.priority}
                        </span>
                        <span className="text-xs text-gray-500">
                          Completed {formatTaskDate(task.completed_at)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
