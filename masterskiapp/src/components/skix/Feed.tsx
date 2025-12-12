import { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import PostCard from './PostCard';
import './Feed.css';

interface FeedProps {
  user_id?: string;
  onNavigateToProfile: (userId: string) => void;
  postsRefreshKey?: number;
}

export default function Feed({ user_id, onNavigateToProfile, postsRefreshKey }: FeedProps) {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('posts')
        .select(`
          id,
          content,
          image_url,
          created_at,
          user_id,
          profiles (
            username,
            full_name,
            avatar_url
          ),
          polls (
            id,
            question,
            options
          )
        `)
        .order('created_at', { ascending: false });

      if (user_id) {
        query = query.eq('user_id', user_id);
      }

      const { data: postData, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      const { data: commentsCount, error: commentsError } = await supabase.rpc('get_comment_counts');

      if(commentsError) console.error("Error fetching comment counts: ", commentsError);

      const formattedPosts = postData?.map(post => {
        const profile = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles;
        const postCommentCount = commentsCount?.find((c: any) => c.post_id === post.id)?.comment_count || 0;

        return {
          id: post.id,
          content: post.content,
          image_url: post.image_url,
          created_at: post.created_at,
          user: {
            id: post.user_id,
            name: profile?.full_name || profile?.username || 'Utente Sconosciuto',
            avatar_url: profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.full_name || 'U S')}&background=0D8ABC&color=fff`,
          },
          comment_count: postCommentCount,
          poll: post.polls && post.polls.length > 0 ? post.polls[0] : null,
        }
      }) || [];

      setPosts(formattedPosts);
    } catch (err: any) {
      console.error('Errore durante il recupero dei post:', err);
      setError(err.message || 'Impossibile caricare i post.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [user_id, postsRefreshKey]);

  if (loading) {
    return <div className="feed-status">Caricamento dei post...</div>;
  }

  if (error) {
    return <div className="feed-status error">{error}</div>;
  }

  if (posts.length === 0) {
    return <div className="feed-status">Nessun post trovato.</div>;
  }

  return (
    <div className="feed-container">
      {posts.map(post => (
        <PostCard key={post.id} post={post} onNavigateToProfile={onNavigateToProfile} />
      ))}
    </div>
  );
}
