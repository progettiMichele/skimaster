import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import './PollView.css';
import type { Poll } from '../../types';
import type { User } from '@supabase/supabase-js';

interface PollViewProps {
  poll: Poll;
}

export default function PollView({ poll }: PollViewProps) {
  const [user, setUser] = useState<User | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [userVote, setUserVote] = useState<number | null>(null);
  const [currentOptions, setCurrentOptions] = useState(poll.options);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    // Check if user has already voted for this poll
    const checkUserVote = async () => {
      if (!user) return;
      const { data, error: fetchError } = await supabase
        .from('poll_votes')
        .select('selected_option')
        .eq('poll_id', poll.id)
        .eq('user_id', user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error checking user vote:', fetchError);
      }
      if (data) {
        setHasVoted(true);
        setUserVote(data.selected_option);
      }
    };
    if (user) {
      checkUserVote();
    }
  }, [user, poll.id]);

  const handleVote = async (optionIndex: number) => {
    if (!user) {
      setError('Devi essere loggato per votare.');
      return;
    }
    if (hasVoted) {
      setError('Hai già votato a questo sondaggio.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Record the vote
      const { error: voteError } = await supabase
        .from('poll_votes')
        .insert([{ poll_id: poll.id, user_id: user.id, selected_option: optionIndex }]);

      if (voteError) throw voteError;

      // Update poll options in DB
      const newOptions = currentOptions.map((opt, idx) =>
        idx === optionIndex ? { ...opt, votes: opt.votes + 1 } : opt
      );

      const { error: updateError } = await supabase
        .from('polls')
        .update({ options: newOptions })
        .eq('id', poll.id);

      if (updateError) throw updateError;

      setCurrentOptions(newOptions);
      setHasVoted(true);
      setUserVote(optionIndex);
    } catch (err: unknown) {
        if (err instanceof Error) {
            console.error('Error submitting vote:', err);
            setError(err.message || 'Errore durante l\'invio del voto.');
        } else {
            setError('Errore durante l\'invio del voto.');
        }
    } finally {
      setLoading(false);
    }
  };

  const totalVotes = currentOptions.reduce((acc: number, option: { text: string, votes: number }) => acc + option.votes, 0);

  if (loading) return <div className="poll-view-card loading">Caricamento sondaggio...</div>;

  return (
    <div className="poll-view-card">
      <p className="poll-question">{poll.question}</p>
      <div className="poll-options">
        {currentOptions.map((option: { text: string, votes: number }, index: number) => {
          const percentage = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0;
          const isSelected = hasVoted && userVote === index;

          return (
            <button
              key={index}
              className={`poll-option ${hasVoted ? 'voted' : ''} ${isSelected ? 'selected' : ''}`}
              onClick={() => handleVote(index)}
              disabled={hasVoted || !user || loading}
            >
              <div className="poll-option-text">{option.text}</div>
              <div className="poll-option-result-bar" style={{ width: `${percentage}%` }}></div>
              <div className="poll-option-votes">
                {hasVoted ? `${Math.round(percentage)}%` : 'Vota'}
              </div>
            </button>
          );
        })}
      </div>
      <div className="poll-footer">
        {error && <span className="poll-error-message">{error}</span>}
        <span>{totalVotes} voti</span>
      </div>
    </div>
  );
}
