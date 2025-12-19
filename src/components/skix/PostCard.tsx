import { useState } from 'react';
import './PostCard.css';
import PollView from './PollView';
import CommentSection from './CommentSection'; // Import CommentSection
import type { Poll } from '../../types';

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

interface FormattedPost {
    id: number;
    content: string;
    image_url: string | null;
    created_at: string;
    user: {
        id: string;
        name: string;
        avatar_url: string;
    };
    comment_count: number;
    poll: Poll | null;
}

interface PostCardProps {
  post: FormattedPost;
  onNavigateToProfile: (userId: string) => void;
}

export default function PostCard({ post, onNavigateToProfile }: PostCardProps) {
  const { user, content, image_url, created_at, poll } = post;
  const [showComments, setShowComments] = useState(false);
  const [currentCommentCount, setCurrentCommentCount] = useState(post.comment_count); // State for dynamic comment count

  const handleProfileClick = () => {
    if (user && user.id) {
      onNavigateToProfile(user.id);
    }
  };

  const handleCommentsUpdated = (_postId: number, count: number) => {
    setCurrentCommentCount(count);
  };

  return (
    <div className="post-card">
      <div className="post-header" onClick={handleProfileClick}>
        <img src={user.avatar_url} alt={`${user.name}'s avatar`} className="post-avatar" />
        <div className="post-user-info">
          <span className="post-user-name">{user.name}</span>
          <span className="post-time">{timeAgo(created_at)}</span>
        </div>
        <button className="post-options-btn">...</button>
      </div>

      <div className="post-content">
        <p>{content}</p>
      </div>

      {image_url && (
        <div className="post-image-container">
          <img src={image_url} alt="Post content" className="post-image" />
        </div>
      )}

      {poll && (
        <div className="post-poll-container">
          <PollView poll={poll} />
        </div>
      )}

      <div className="post-footer">
        <button className="footer-action-btn" onClick={() => setShowComments(!showComments)}>
          💬 <span className="action-count">{currentCommentCount}</span>
        </button>
        <button className="footer-action-btn">
          ❤️ <span className="action-count">12</span> {/* Placeholder */}
        </button>
        <button className="footer-action-btn">
          🔗
        </button>
      </div>

      {showComments && (
        <CommentSection
          postId={post.id}
          onNavigateToProfile={onNavigateToProfile}
          onCommentsUpdated={handleCommentsUpdated}
        />
      )}
    </div>
  );
}
