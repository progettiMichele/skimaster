import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import './CreatePost.css';
import type { User } from '@supabase/supabase-js';

interface CreatePostProps {
  onPostCreated: () => void;
}

export default function CreatePost({ onPostCreated }: CreatePostProps) {
  const [content, setContent] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null); // For preview
  const [showPollOptions, setShowPollOptions] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      setImageUrl(URL.createObjectURL(file)); // Create a preview URL
    }
  };

  const handleAddPollOption = () => {
    setPollOptions([...pollOptions, '']);
  };

  const handleRemovePollOption = (index: number) => {
    setPollOptions(pollOptions.filter((_, i) => i !== index));
  };

  const handlePollOptionChange = (index: number, value: string) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!user) {
      setError('Devi essere loggato per pubblicare un post.');
      setLoading(false);
      return;
    }

    if (!content.trim() && !image && !(showPollOptions && pollQuestion.trim() && pollOptions.filter(opt => opt.trim() !== '').length >= 2)) {
      setError('Il post non può essere vuoto. Aggiungi testo, un\'immagine o un sondaggio valido.');
      setLoading(false);
      return;
    }

    let publicImageUrl = null;

    try {
      if (image) {
        const fileExt = image.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('post_images')
          .upload(fileName, image, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('post_images')
          .getPublicUrl(fileName);
        
        publicImageUrl = publicUrlData.publicUrl;
      }

      // 1. Inserisci il post
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .insert([{ user_id: user.id, content: content.trim(), image_url: publicImageUrl }])
        .select();

      if (postError) throw postError;
      if (!postData || postData.length === 0) throw new Error('Errore durante la creazione del post.');

      const newPostId = postData[0].id;

      // 2. Se è presente un sondaggio, inseriscilo
      if (showPollOptions && pollQuestion.trim() && pollOptions.filter(opt => opt.trim() !== '').length >= 2) {
        const validPollOptions = pollOptions
          .filter(opt => opt.trim() !== '')
          .map(opt => ({ text: opt.trim(), votes: 0 }));

        const { error: pollError } = await supabase
          .from('polls')
          .insert([{ post_id: newPostId, question: pollQuestion.trim(), options: validPollOptions }]);

        if (pollError) throw pollError;
      }

      // Reset form
      setContent('');
      setImage(null);
      setImageUrl(null);
      setShowPollOptions(false);
      setPollQuestion('');
      setPollOptions(['', '']);
      onPostCreated();
    } catch (err: any) {
      console.error('Errore durante la creazione del post:', err);
      setError(err.message || 'Errore sconosciuto durante la pubblicazione.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-post-card">
      {error && <div className="error-banner">{error}</div>}
      <form onSubmit={handleSubmit}>
        <textarea
          className="post-textarea"
          placeholder="Cosa stai sciando oggi?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
        />

        {imageUrl && (
          <div className="image-preview-container">
            <img src={imageUrl} alt="Anteprima immagine" className="image-preview" />
            <button className="remove-image-btn" onClick={() => { setImage(null); setImageUrl(null); }}>✕</button>
          </div>
        )}

        {showPollOptions && (
          <div className="poll-section">
            <input
              type="text"
              className="poll-question-input"
              placeholder="Domanda del sondaggio"
              value={pollQuestion}
              onChange={(e) => setPollQuestion(e.target.value)}
            />
            {pollOptions.map((option, index) => (
              <div key={index} className="poll-option-input-group">
                <input
                  type="text"
                  className="poll-option-input"
                  placeholder={`Opzione ${index + 1}`}
                  value={option}
                  onChange={(e) => handlePollOptionChange(index, e.target.value)}
                />
                {pollOptions.length > 2 && (
                  <button type="button" className="remove-poll-option-btn" onClick={() => handleRemovePollOption(index)}>✕</button>
                )}
              </div>
            ))}
            <button type="button" className="add-poll-option-btn" onClick={handleAddPollOption}>+ Aggiungi opzione</button>
          </div>
        )}

        <div className="post-actions">
          <div className="left-actions">
            <label htmlFor="image-upload" className="action-button">
              📸
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{ display: 'none' }}
              />
            </label>
            <button type="button" className="action-button" onClick={() => setShowPollOptions(!showPollOptions)}>
              📊
            </button>
          </div>
          <button type="submit" className="post-button" disabled={loading || (!content.trim() && !image && !pollQuestion.trim())}>
            {loading ? 'Pubblicando...' : 'Pubblica'}
          </button>
        </div>
      </form>
    </div>
  );
}