import { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import './Comment.css';
import type { Comment as CommentType, Profile } from '../../types';

// Helper to format dates like "5h", "2d", etc.
function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + "y";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + "m";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + "d";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + "h";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + "min";
  return Math.floor(seconds) + "s";
}

interface CommentProps {
  comment: CommentType;
  onNavigateToProfile: (userId: string) => void;
}

export default function Comment({ comment, onNavigateToProfile }: CommentProps) {
  const [author, setAuthor] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAuthorProfile = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url')
          .eq('id', comment.user_id)
          .single();
        
        if (fetchError) throw fetchError;
        if (data) {
          setAuthor(data as Profile);
        }
      } catch (err: unknown) {
        console.error('Error fetching comment author profile:', err);
        if (err instanceof Error) {
            setError(err.message);
        } else {
            setError('Error loading author profile.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAuthorProfile();
  }, [comment.user_id]);

  const avatarSrc = author?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(author?.full_name || author?.username || 'N A')}&background=0D8ABC&color=fff`;

  if (loading) return <div className="comment-loading">Caricamento commento...</div>;
  if (error) return <div className="comment-error">Errore: {error}</div>;
  if (!author) return <div className="comment-not-found">Autore non trovato.</div>;

  return (
    <div className="comment-container">
      <div className="comment-header" onClick={() => onNavigateToProfile(comment.user_id)}>
        <img src={avatarSrc} alt={`${author.full_name || author.username}'s avatar`} className="comment-avatar" />
        <div className="comment-info">
          <span className="comment-author-name">{author.full_name || author.username}</span>
          <span className="comment-time">{timeAgo(comment.created_at)}</span>
        </div>
      </div>
      <p className="comment-content">{comment.content}</p>
    </div>
  );
}
