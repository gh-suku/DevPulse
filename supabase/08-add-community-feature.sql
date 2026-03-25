-- ============================================
-- COMMUNITY FEATURE - POSTS, IMAGES, LIKES & COMMENTS
-- ============================================
-- Run this in your Supabase SQL Editor
-- Dashboard → SQL Editor → New Query → Paste & Run
-- ============================================

-- ============================================
-- Create Community Posts Table
-- ============================================
CREATE TABLE public.community_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_url TEXT,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Create Post Likes Table
-- ============================================
CREATE TABLE public.post_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id) -- Prevent duplicate likes
);

-- ============================================
-- Create Post Comments Table
-- ============================================
CREATE TABLE public.post_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Create Storage Bucket for Post Images
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('post-images', 'post-images', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Enable Row Level Security (RLS)
-- ============================================
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS Policies for Community Posts
-- ============================================

-- Anyone authenticated can view all posts
CREATE POLICY "Authenticated users can view all posts"
  ON public.community_posts
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Users can create their own posts
CREATE POLICY "Users can create own posts"
  ON public.community_posts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own posts
CREATE POLICY "Users can update own posts"
  ON public.community_posts
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own posts
CREATE POLICY "Users can delete own posts"
  ON public.community_posts
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- RLS Policies for Post Likes
-- ============================================

-- Anyone authenticated can view all likes
CREATE POLICY "Authenticated users can view all likes"
  ON public.post_likes
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Users can like posts
CREATE POLICY "Users can like posts"
  ON public.post_likes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can unlike posts (delete their own likes)
CREATE POLICY "Users can unlike posts"
  ON public.post_likes
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- RLS Policies for Post Comments
-- ============================================

-- Anyone authenticated can view all comments
CREATE POLICY "Authenticated users can view all comments"
  ON public.post_comments
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Users can create comments
CREATE POLICY "Users can create comments"
  ON public.post_comments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own comments
CREATE POLICY "Users can update own comments"
  ON public.post_comments
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete own comments"
  ON public.post_comments
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- Storage RLS Policies for Post Images
-- ============================================

-- Anyone can view post images (public bucket)
CREATE POLICY "Post images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'post-images');

-- Authenticated users can upload post images
CREATE POLICY "Authenticated users can upload post images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'post-images' AND
    auth.role() = 'authenticated'
  );

-- Users can update their own post images
CREATE POLICY "Users can update own post images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'post-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can delete their own post images
CREATE POLICY "Users can delete own post images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'post-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================
-- Function to Update Likes Count
-- ============================================
CREATE OR REPLACE FUNCTION public.update_post_likes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment likes count
    UPDATE public.community_posts
    SET likes_count = likes_count + 1
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement likes count
    UPDATE public.community_posts
    SET likes_count = GREATEST(likes_count - 1, 0)
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- ============================================
-- Function to Update Comments Count
-- ============================================
CREATE OR REPLACE FUNCTION public.update_post_comments_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment comments count
    UPDATE public.community_posts
    SET comments_count = comments_count + 1
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement comments count
    UPDATE public.community_posts
    SET comments_count = GREATEST(comments_count - 1, 0)
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- ============================================
-- Function to Auto-Update Timestamps
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_community_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ============================================
-- Triggers for Likes Count
-- ============================================
CREATE TRIGGER on_post_like_added
  AFTER INSERT ON public.post_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_post_likes_count();

CREATE TRIGGER on_post_like_removed
  AFTER DELETE ON public.post_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_post_likes_count();

-- ============================================
-- Triggers for Comments Count
-- ============================================
CREATE TRIGGER on_post_comment_added
  AFTER INSERT ON public.post_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_post_comments_count();

CREATE TRIGGER on_post_comment_removed
  AFTER DELETE ON public.post_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_post_comments_count();

-- ============================================
-- Triggers for Updated Timestamps
-- ============================================
CREATE TRIGGER on_community_post_updated
  BEFORE UPDATE ON public.community_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_community_updated_at();

CREATE TRIGGER on_post_comment_updated
  BEFORE UPDATE ON public.post_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_community_updated_at();

-- ============================================
-- Create View for Posts with User Info
-- ============================================
CREATE OR REPLACE VIEW public.community_posts_with_user AS
SELECT 
  cp.id,
  cp.user_id,
  cp.content,
  cp.image_url,
  cp.likes_count,
  cp.comments_count,
  cp.created_at,
  cp.updated_at,
  p.username,
  p.full_name,
  p.avatar_url,
  -- Check if current user has liked this post
  EXISTS(
    SELECT 1 FROM public.post_likes pl 
    WHERE pl.post_id = cp.id AND pl.user_id = auth.uid()
  ) as is_liked_by_current_user
FROM public.community_posts cp
INNER JOIN public.profiles p ON cp.user_id = p.id
ORDER BY cp.created_at DESC;

-- ============================================
-- Create View for Comments with User Info
-- ============================================
CREATE OR REPLACE VIEW public.post_comments_with_user AS
SELECT 
  pc.id,
  pc.post_id,
  pc.user_id,
  pc.content,
  pc.created_at,
  pc.updated_at,
  p.username,
  p.full_name,
  p.avatar_url
FROM public.post_comments pc
INNER JOIN public.profiles p ON pc.user_id = p.id
ORDER BY pc.created_at ASC;

-- ============================================
-- Create Indexes for Performance
-- ============================================
CREATE INDEX idx_community_posts_user_id ON public.community_posts(user_id);
CREATE INDEX idx_community_posts_created_at ON public.community_posts(created_at DESC);
CREATE INDEX idx_post_likes_post_id ON public.post_likes(post_id);
CREATE INDEX idx_post_likes_user_id ON public.post_likes(user_id);
CREATE INDEX idx_post_comments_post_id ON public.post_comments(post_id);
CREATE INDEX idx_post_comments_user_id ON public.post_comments(user_id);
CREATE INDEX idx_post_comments_created_at ON public.post_comments(created_at ASC);

-- ============================================
-- Verify Setup
-- ============================================
SELECT 
  'Tables Created' as status,
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('community_posts', 'post_likes', 'post_comments')
UNION ALL
SELECT 
  'Functions Created' as status,
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN (
    'update_post_likes_count',
    'update_post_comments_count',
    'handle_community_updated_at'
  )
UNION ALL
SELECT 
  'Triggers Created' as status,
  trigger_name,
  event_object_table
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND trigger_name IN (
    'on_post_like_added',
    'on_post_like_removed',
    'on_post_comment_added',
    'on_post_comment_removed',
    'on_community_post_updated',
    'on_post_comment_updated'
  );

-- ============================================
-- Test Queries
-- ============================================

-- View all posts with user info
-- SELECT * FROM public.community_posts_with_user LIMIT 10;

-- View comments for a specific post
-- SELECT * FROM public.post_comments_with_user WHERE post_id = 'YOUR_POST_ID';

-- Check if current user liked a post
-- SELECT is_liked_by_current_user FROM public.community_posts_with_user WHERE id = 'YOUR_POST_ID';

-- ============================================
-- SETUP COMPLETE! ✅
-- ============================================
-- You now have:
-- 1. community_posts table - Store posts with text and optional images
-- 2. post_likes table - Track who liked which posts
-- 3. post_comments table - Store comments on posts
-- 4. Storage bucket 'post-images' - Store post images
-- 5. Automatic likes_count and comments_count updates
-- 6. Views with user information for easy querying
-- 7. RLS policies for secure access
-- 8. Indexes for optimal performance
-- 
-- Features:
-- - Create posts with text and optional image
-- - Like/unlike posts
-- - Comment on posts
-- - Edit/delete your own posts and comments
-- - View all posts with user info (username, avatar, etc.)
-- - Automatic counters for likes and comments
-- - Prevent duplicate likes (one like per user per post)
-- ============================================
