import { useState } from 'react';
import './SkiXPage.css';

import CreatePost from '../components/skix/CreatePost';
import Feed from '../components/skix/Feed';
import ProfilePage from './ProfilePage'; // Import the ProfilePage

interface SkiXPageProps {
  // onBack is not needed here as this is a main view
}

export default function SkiXPage({}: SkiXPageProps) {
  const [viewingProfileId, setViewingProfileId] = useState<string | null>(null);
  const [postsRefreshKey, setPostsRefreshKey] = useState(0); // New state to trigger feed refresh

  const handlePostCreated = () => {
    setPostsRefreshKey(prevKey => prevKey + 1); // Increment key to force Feed re-fetch
  };

  const handleNavigateToProfile = (userId: string) => {
    setViewingProfileId(userId);
  };

  const handleBackToFeed = () => {
    setViewingProfileId(null);
  };

  if (viewingProfileId) {
    return (
      <ProfilePage
        userId={viewingProfileId}
        onBack={handleBackToFeed}
        onNavigateToProfile={handleNavigateToProfile}
      />
    );
  }

  return (
    <div className="skix-page-container">
      <div className="skix-content">
        <div>
          <CreatePost onPostCreated={handlePostCreated} />
        </div>

        <div>
          <Feed onNavigateToProfile={handleNavigateToProfile} postsRefreshKey={postsRefreshKey} />
        </div>
      </div>
    </div>
  );
}
