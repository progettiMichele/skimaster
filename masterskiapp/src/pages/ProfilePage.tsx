import React from 'react';
import './ProfilePage.css';

import ProfileHeader from '../components/skix/ProfileHeader'; // Import ProfileHeader
import Feed from '../components/skix/Feed'; // Import Feed

interface ProfilePageProps {
  userId: string;
  onBack: () => void;
  onNavigateToProfile: (userId: string) => void;
}

export default function ProfilePage({ userId, onBack, onNavigateToProfile }: ProfilePageProps) {
  return (
    <div className="profile-page-container">
      <div className="profile-page-header">
        <button onClick={onBack} className="back-btn-profile">←</button>
        <h1>Profilo</h1>
      </div>

      <div className="profile-content">
        <ProfileHeader userId={userId} />
        <Feed user_id={userId} onNavigateToProfile={onNavigateToProfile} />
      </div>
    </div>
  );
}
