import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../api/supabase';

export function SlackCallback() {
  const navigate = useNavigate();
  const { user, isLoading, setSlackToken } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [exchanged, setExchanged] = useState(false);

  useEffect(() => {
    if (isLoading || exchanged) return;

    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const slackError = params.get('error');

    if (slackError) {
      setError(`Slack authorization failed: ${slackError}`);
      return;
    }

    if (!code) {
      setError('No authorization code received from Slack.');
      return;
    }

    if (!user) {
      setError('You must be logged in to connect Slack.');
      return;
    }

    setExchanged(true);

    async function exchangeCode() {
      try {
        const { data, error: fnError } = await supabase.functions.invoke(
          'smart-api',
          { body: { code, userId: user!.id } }
        );

        console.log('Slack OAuth response:', { data, fnError });

        if (fnError) {
          setError(`Failed to connect Slack: ${fnError.message}`);
          return;
        }

        if (data?.error) {
          setError(`Slack error: ${data.error}`);
          return;
        }

        if (data?.access_token) {
          setSlackToken(data.access_token);
        }

        navigate('/', { replace: true });
      } catch (err) {
        console.error('Slack callback error:', err);
        setError(err instanceof Error ? err.message : 'Failed to connect Slack');
      }
    }

    exchangeCode();
  }, [user, isLoading, navigate, setSlackToken, exchanged]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md mx-4 text-center">
          <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Connection Failed</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => navigate('/', { replace: true })}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-gray-500 dark:text-gray-400">Connecting Slack...</p>
      </div>
    </div>
  );
}
