// src/pages/LeaderboardPage.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Trophy, Medal, Award, ChevronRight, CheckCircle2, Clock, Target, TrendingUp, User as UserIcon, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion } from 'motion/react';
import { Layout } from '../components/Layout';

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

interface Task {
  id: string;
  title: string;
  description: string;
  goal_id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  completed_at: string | null;
  created_at: string;
}

interface LeaderboardUser {
  id: string;
  full_name: string;
  username: string;
  avatar_url: string | null;
  department: string;
  points: number;
  rank: number;
  email: string;
}

export const LeaderboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<LeaderboardUser | null>(null);
  const [userTasks, setUserTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [tasksLoading, setTasksLoading] = useState(false);

  const handleScreenChange = (screen: string) => {
    navigate('/dashboard', { state: { screen } });
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          username,
          avatar_url,
          department,
          points
        `)
        .order('points', { ascending: false })
        .limit(100); // Issue #34: Add pagination limit

      if (profilesError) throw profilesError;

      let authUsers: any[] = [];
      try {
        const { data } = await supabase.auth.admin.listUsers();
        authUsers = data?.users || [];
      } catch (authError) {
        console.log('Could not fetch user emails (admin access required)');
      }
      
      const usersWithEmail = profilesData?.map((profile: any, index: number) => {
        const authUser = authUsers?.find((u: any) => u.id === profile.id);
        return {
          ...profile,
          email: authUser?.email || '',
          rank: index + 1
        };
      }) || [];

      setUsers(usersWithEmail);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserTasks = async (userId: string) => {
    try {
      setTasksLoading(true);
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false });

      if (error) throw error;
      setUserTasks(data || []);
    } catch (error) {
      console.error('Error fetching user tasks:', error);
      setUserTasks([]);
    } finally {
      setTasksLoading(false);
    }
  };

  const handleUserClick = (clickedUser: LeaderboardUser) => {
    setSelectedUser(clickedUser);
    fetchUserTasks(clickedUser.id);
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="text-lg font-bold text-gray-400">#{rank}</span>;
    }
  };

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-400 to-yellow-600';
      case 2:
        return 'bg-gradient-to-r from-gray-300 to-gray-500';
      case 3:
        return 'bg-gradient-to-r from-amber-400 to-amber-600';
      default:
        return 'bg-gray-100';
    }
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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <Layout
      breadcrumb="Leaderboard"
      onScreenChange={handleScreenChange}
      headerActions={
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-4 md:px-6 py-3 md:py-4">
          <p className="text-xs md:text-sm text-gray-500">Total Users</p>
          <p className="text-2xl md:text-3xl font-bold text-emerald-600">{users.length}</p>
        </div>
      }
    >
      <div className="mb-6 md:mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Trophy className="w-6 h-6 md:w-8 md:h-8 text-emerald-500" />
              Leaderboard
            </h1>
            <p className="text-gray-600 mt-1 text-sm md:text-base">Track team performance and completed tasks</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 min-w-0">
        {/* Leaderboard List */}
        <div className="lg:col-span-2 min-w-0">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {loading ? (
              <div className="p-8 space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="animate-pulse flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : users.length === 0 ? (
              <div className="p-12 text-center">
                <UserIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No users found</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {users.map((leaderboardUser) => (
                  <motion.div
                    key={leaderboardUser.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "p-6 hover:bg-gray-50 cursor-pointer transition-all group",
                      selectedUser?.id === leaderboardUser.id && "bg-emerald-50 hover:bg-emerald-50"
                    )}
                    onClick={() => handleUserClick(leaderboardUser)}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0",
                        getRankBadgeColor(leaderboardUser.rank)
                      )}>
                        {getRankIcon(leaderboardUser.rank)}
                      </div>

                      <div className="w-14 h-14 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                        {leaderboardUser.avatar_url ? (
                          <img
                            src={leaderboardUser.avatar_url}
                            alt={leaderboardUser.full_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xl font-bold">
                            {leaderboardUser.full_name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {leaderboardUser.full_name}
                          </h3>
                          {leaderboardUser.id === user?.id && (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
                              You
                            </span>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/users/${leaderboardUser.username}`);
                          }}
                          className="text-sm text-emerald-600 hover:text-emerald-700 hover:underline truncate text-left"
                        >
                          @{leaderboardUser.username}
                        </button>
                        <p className="text-xs text-gray-400 truncate">{leaderboardUser.email}</p>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-emerald-500" />
                          <span className="text-2xl font-bold text-emerald-600">
                            {leaderboardUser.points}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">points</p>
                      </div>

                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* User Tasks Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-8">
            {!selectedUser ? (
              <div className="text-center py-12">
                <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-sm">Select a user to view their completed tasks</p>
              </div>
            ) : (
              <div>
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden">
                      {selectedUser.avatar_url ? (
                        <img
                          src={selectedUser.avatar_url}
                          alt={selectedUser.full_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-lg font-bold">
                          {selectedUser.full_name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{selectedUser.full_name}</h3>
                      <p className="text-xs text-gray-500">{selectedUser.department}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="bg-emerald-50 rounded-lg p-3">
                    <p className="text-xs text-emerald-600 font-medium">Total Points</p>
                    <p className="text-2xl font-bold text-emerald-700">{selectedUser.points}</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs text-blue-600 font-medium">Rank</p>
                    <p className="text-2xl font-bold text-blue-700">#{selectedUser.rank}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    Completed Tasks
                  </h4>
                  
                  {tasksLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="animate-pulse bg-gray-50 rounded-lg p-3 space-y-2">
                          <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      ))}
                    </div>
                  ) : userTasks.length === 0 ? (
                    <div className="text-center py-8">
                      <Clock className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No completed tasks yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                      {userTasks.map((task) => (
                        <motion.div
                          key={task.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-start gap-2 mb-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <h5 className="font-medium text-gray-900 text-sm">{task.title}</h5>
                              {task.description && (
                                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{task.description}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <span className={cn(
                              "text-xs px-2 py-0.5 rounded-full font-medium",
                              getPriorityColor(task.priority)
                            )}>
                              {task.priority}
                            </span>
                            <span className="text-xs text-gray-400">
                              {formatDate(task.completed_at)}
                            </span>
                          </div>
                          {task.goal_id && (
                            <div className="mt-2">
                              <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded">
                                Goal: {task.goal_id}
                              </span>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};
