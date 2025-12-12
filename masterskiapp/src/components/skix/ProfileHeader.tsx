import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import './ProfileHeader.css';

interface ProfileHeaderProps {
  userId: string;
}

export default function ProfileHeader({ userId }: ProfileHeaderProps) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: fetchError } = await supabase
          .from('profiles')
          .select('username, full_name, avatar_url')
          .eq('id', userId)
          .single();

        if (fetchError) throw fetchError;

        setProfile(data);
      } catch (err: any) {
        console.error('Error fetching profile:', err);
        setError(err.message || 'Error loading profile.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  if (loading) {
    return (
      <div className="profile-header-container loading">
        Caricamento profilo...
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-header-container error">
        Errore: {error}
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-header-container no-profile">
        Profilo non trovato.
      </div>
    );
  }

  const avatarSrc = profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name || profile.username || 'N A')}&background=0D8ABC&color=fff`;

  return (
    <div className="profile-header-container">
      <div className="profile-banner"></div> {/* Placeholder for a banner image */}
      <div className="profile-info-section">
        <img src={avatarSrc} alt={`${profile.full_name || profile.username}'s avatar`} className="profile-avatar-large" />
        <h2 className="profile-full-name">{profile.full_name}</h2>
        <p className="profile-username">@{profile.username}</p>
        {/* Add more profile details here like bio, follow buttons etc. */}
      </div>
    </div>
  );
}