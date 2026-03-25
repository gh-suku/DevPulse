import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Layout } from '../components/Layout';
import { useNavigate } from 'react-router-dom';
import { 
  Heart, 
  MessageCircle, 
  Send, 
  Image as ImageIcon, 
  X, 
  Loader2,
  User as UserIcon,
  MoreVertical,
  Trash2,
  Edit2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

interface Post {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  is_liked_by_current_user: boolean;
}

interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
}

export const CommunityPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostImage, setNewPostImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [selectedPost, setSelectedPost] = useState<string | null>(null);
  const [comments, setComments] = useState<{ [key: string]: Comment[] }>({});
  const [newComment, setNewComment] = useState<{ [key: string]: string }>({});
  const [loadingComments, setLoadingComments] = useState<{ [key: string]: boolean }>({});

  const handleScreenChange = (screen: string) => {
    navigate('/dashboard', { state: { screen } });
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('community_posts_with_user')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async (postId: string) => {
    try {
      setLoadingComments(prev => ({ ...prev, [postId]: true }));
      const { data, error } = await supabase
        .from('post_comments_with_user')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(prev => ({ ...prev, [postId]: data || [] }));
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoadingComments(prev => ({ ...prev, [postId]: false }));
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewPostImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user!.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('post-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('post-images')
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim() && !newPostImage) return;

    try {
      setIsPosting(true);
      let imageUrl = null;

      if (newPostImage) {
        imageUrl = await uploadImage(newPostImage);
      }

      const { error } = await supabase
        .from('community_posts')
        .insert({
          user_id: user!.id,
          content: newPostContent.trim(),
          image_url: imageUrl
        });

      if (error) throw error;

      setNewPostContent('');
      setNewPostImage(null);
      setImagePreview(null);
      fetchPosts();
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setIsPosting(false);
    }
  };

  const handleLikePost = async (postId: string, isLiked: boolean) => {
    try {
      if (isLiked) {
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user!.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('post_likes')
          .insert({
            post_id: postId,
            user_id: user!.id
          });

        if (error) throw error;
      }

      fetchPosts();
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleAddComment = async (postId: string) => {
    const content = newComment[postId]?.trim();
    if (!content) return;

    try {
      const { error } = await supabase
        .from('post_comments')
        .insert({
          post_id: postId,
          user_id: user!.id,
          content
        });

      if (error) throw error;

      setNewComment(prev => ({ ...prev, [postId]: '' }));
      fetchComments(postId);
      fetchPosts();
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      const { error } = await supabase
        .from('community_posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;
      fetchPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const toggleComments = (postId: string) => {
    if (selectedPost === postId) {
      setSelectedPost(null);
    } else {
      setSelectedPost(postId);
      if (!comments[postId]) {
        fetchComments(postId);
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <Layout
      breadcrumb="Community"
      onScreenChange={handleScreenChange}
    >
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Create Post Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <UserIcon className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="flex-1">
              <textarea
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                rows={3}
              />
              
              {imagePreview && (
                <div className="mt-3 relative">
                  <img src={imagePreview} alt="Preview" className="rounded-lg max-h-64 object-cover" />
                  <button
                    onClick={() => {
                      setNewPostImage(null);
                      setImagePreview(null);
                    }}
                    className="absolute top-2 right-2 p-1 bg-black/50 hover:bg-black/70 rounded-full text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between mt-3">
                <label className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
                  <ImageIcon className="w-5 h-5" />
                  <span>Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </label>
                
                <button
                  onClick={handleCreatePost}
                  disabled={isPosting || (!newPostContent.trim() && !newPostImage)}
                  className="px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {isPosting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Posting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Post
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Posts Feed */}
        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-pulse">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No posts yet. Be the first to share something!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
              >
                {/* Post Header */}
                <div className="p-6 pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-3">
                      <button
                        onClick={() => navigate(`/users/${post.username}`)}
                        className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden flex-shrink-0"
                      >
                        {post.avatar_url ? (
                          <img src={post.avatar_url} alt={post.full_name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-lg font-bold">
                            {post.full_name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </button>
                      <div>
                        <button
                          onClick={() => navigate(`/users/${post.username}`)}
                          className="font-semibold text-gray-900 hover:text-emerald-600 transition-colors"
                        >
                          {post.full_name}
                        </button>
                        <p className="text-sm text-gray-500">@{post.username} · {formatDate(post.created_at)}</p>
                      </div>
                    </div>
                    
                    {post.user_id === user?.id && (
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-gray-400" />
                      </button>
                    )}
                  </div>

                  {/* Post Content */}
                  <p className="mt-4 text-gray-800 whitespace-pre-wrap">{post.content}</p>
                </div>

                {/* Post Image */}
                {post.image_url && (
                  <div className="px-6 pb-4">
                    <img 
                      src={post.image_url} 
                      alt="Post" 
                      className="w-full rounded-lg object-cover max-h-96"
                    />
                  </div>
                )}

                {/* Post Actions */}
                <div className="px-6 py-4 border-t border-gray-100 flex items-center gap-6">
                  <button
                    onClick={() => handleLikePost(post.id, post.is_liked_by_current_user)}
                    className={cn(
                      "flex items-center gap-2 transition-colors",
                      post.is_liked_by_current_user 
                        ? "text-rose-500" 
                        : "text-gray-500 hover:text-rose-500"
                    )}
                  >
                    <Heart 
                      className={cn("w-5 h-5", post.is_liked_by_current_user && "fill-current")} 
                    />
                    <span className="text-sm font-medium">{post.likes_count}</span>
                  </button>

                  <button
                    onClick={() => toggleComments(post.id)}
                    className="flex items-center gap-2 text-gray-500 hover:text-emerald-500 transition-colors"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">{post.comments_count}</span>
                  </button>
                </div>

                {/* Comments Section */}
                <AnimatePresence>
                  {selectedPost === post.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-gray-100 bg-gray-50"
                    >
                      <div className="p-6 space-y-4">
                        {/* Add Comment */}
                        <div className="flex gap-3">
                          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                            <UserIcon className="w-5 h-5 text-emerald-600" />
                          </div>
                          <div className="flex-1 flex gap-2">
                            <input
                              type="text"
                              value={newComment[post.id] || ''}
                              onChange={(e) => setNewComment(prev => ({ ...prev, [post.id]: e.target.value }))}
                              onKeyDown={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                              placeholder="Write a comment..."
                              className="flex-1 border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            />
                            <button
                              onClick={() => handleAddComment(post.id)}
                              disabled={!newComment[post.id]?.trim()}
                              className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Comments List */}
                        {loadingComments[post.id] ? (
                          <div className="space-y-3">
                            {[1, 2].map(i => (
                              <div key={i} className="flex gap-3 animate-pulse">
                                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                                <div className="flex-1 space-y-2">
                                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : comments[post.id]?.length === 0 ? (
                          <p className="text-center text-gray-400 text-sm py-4">No comments yet</p>
                        ) : (
                          <div className="space-y-4">
                            {comments[post.id]?.map((comment) => (
                              <div key={comment.id} className="flex gap-3">
                                <button
                                  onClick={() => navigate(`/users/${comment.username}`)}
                                  className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0"
                                >
                                  {comment.avatar_url ? (
                                    <img src={comment.avatar_url} alt={comment.full_name} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm font-bold">
                                      {comment.full_name.charAt(0).toUpperCase()}
                                    </div>
                                  )}
                                </button>
                                <div className="flex-1 bg-white rounded-lg p-3">
                                  <button
                                    onClick={() => navigate(`/users/${comment.username}`)}
                                    className="font-semibold text-sm text-gray-900 hover:text-emerald-600 transition-colors"
                                  >
                                    {comment.full_name}
                                  </button>
                                  <p className="text-sm text-gray-800 mt-1">{comment.content}</p>
                                  <p className="text-xs text-gray-400 mt-2">{formatDate(comment.created_at)}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};
