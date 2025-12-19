import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../supabaseClient';
import Comment from './Comment';
import './CommentSection.css';
import type { Comment as CommentType } from '../../types';
import type { User } from '@supabase/supabase-js';

interface CommentSectionProps {
  postId: number;
  onNavigateToProfile: (userId: string) => void;
  onCommentsUpdated: (postId: number, count: number) => void; // Callback to update comment count in PostCard
}

export default function CommentSection({ postId, onNavigateToProfile, onCommentsUpdated }: CommentSectionProps) {
  const [comments, setComments] = useState<CommentType[]>([]);
  const [newCommentContent, setNewCommentContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('comments')
        .select(`
          id,
          post_id,
          user_id,
          content,
          created_at,
          profiles (
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;
      if (data) {
        const formattedComments: CommentType[] = data.map((comment: any) => ({
          id: comment.id,
          post_id: comment.post_id,
          user_id: comment.user_id,
          content: comment.content,
          created_at: comment.created_at,
          profiles: Array.isArray(comment.profiles) ? comment.profiles[0] : comment.profiles,
        }));
        setComments(formattedComments);
      } else {
        setComments([]);
      }
      onCommentsUpdated(postId, data?.length || 0);
    } catch (err: unknown) {
        if (err instanceof Error) {
            console.error('Error fetching comments:', err);
            setError(err.message || 'Errore durante il caricamento dei commenti.');
        } else {
            setError('Errore durante il caricamento dei commenti.');
        }
    } finally {
      setLoading(false);
    }
  }, [postId, onCommentsUpdated]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('Devi essere loggato per commentare.');
      return;
    }
    if (!newCommentContent.trim()) {
      setError('Il commento non può essere vuoto.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const { error: insertError } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content: newCommentContent.trim(),
        });

      if (insertError) throw insertError;

      setNewCommentContent('');
      await fetchComments(); // Re-fetch comments to show the new one
    } catch (err: unknown) {
        if (err instanceof Error) {
            console.error('Error submitting comment:', err);
            setError(err.message || 'Errore durante l\'invio del commento.');
        } else {
            setError('Errore durante l\'invio del commento.');
        }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="comment-section-container">
      {loading && <div className="comment-section-status">Caricamento commenti...</div>}
      {error && <div className="comment-section-status error">{error}</div>}

      {!loading && comments.length === 0 && (
        <div className="comment-section-status">Nessun commento. Sii il primo a commentare!</div>
      )}

      <div className="comments-list">
        {comments.map(comment => (
          <Comment 
            key={comment.id} 
            comment={comment} 
            onNavigateToProfile={onNavigateToProfile} 
          />
        ))}
      </div>

      <form onSubmit={handleSubmitComment} className="new-comment-form">
        <textarea
          className="new-comment-textarea"
          placeholder="Aggiungi un commento..."
          value={newCommentContent}
          onChange={(e) => setNewCommentContent(e.target.value)}
          rows={1}
        />
        <button type="submit" className="submit-comment-btn" disabled={submitting || !user}>
          {submitting ? 'Invio...' : 'Invia'}
        </button>
      </form>
    </div>
  );
}
