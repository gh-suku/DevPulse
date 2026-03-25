// src/pages/VerifySuccessPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { CheckCircle2, AlertTriangle, Loader2, RefreshCw } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const VerifySuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState('');
  const [countdown, setCountdown] = useState(3);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    verifyEmail();
  }, []);

  useEffect(() => {
    if (status === 'success' && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (status === 'success' && countdown === 0) {
      navigate('/login');
    }
  }, [status, countdown, navigate]);

  const verifyEmail = async () => {
    try {
      const token_hash = searchParams.get('token_hash');
      const type = searchParams.get('type');

      if (!token_hash || type !== 'email') {
        setStatus('error');
        setErrorMessage('Invalid verification link. Please check your email and try again.');
        return;
      }

      const { data, error } = await supabase.auth.verifyOtp({
        token_hash,
        type: 'email',
      });

      if (error) {
        console.error('Verification error:', error);
        
        if (error.message.includes('expired')) {
          setErrorMessage('This verification link has expired. Please request a new one.');
        } else if (error.message.includes('invalid')) {
          setErrorMessage('This verification link is invalid. Please request a new one.');
        } else {
          setErrorMessage('Verification failed. Please try again or request a new link.');
        }
        
        setStatus('error');
        return;
      }

      if (data.user) {
        setStatus('success');
      } else {
        setStatus('error');
        setErrorMessage('Verification failed. Please try again.');
      }
    } catch (error: any) {
      console.error('Unexpected verification error:', error);
      setStatus('error');
      setErrorMessage('An unexpected error occurred. Please try again.');
    }
  };

  const handleResendEmail = async () => {
    setResending(true);
    setErrorMessage('');

    try {
      // Get user email from URL or prompt
      const email = searchParams.get('email');
      if (!email) {
        setErrorMessage('Email address not found. Please sign up again.');
        setResending(false);
        return;
      }

      const response = await fetch(`${API_URL}/api/auth/send-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          userName: 'User',
          verificationUrl: `${window.location.origin}/verify-success`,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to send verification email');
      }

      navigate('/signup');
    } catch (error: any) {
      console.error('Resend error:', error);
      setErrorMessage(error.message || 'Failed to resend email. Please try signing up again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center text-white font-bold text-2xl mb-4">
            D
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            {status === 'verifying' && 'Verifying your email...'}
            {status === 'success' && 'Email verified!'}
            {status === 'error' && 'Verification failed'}
          </h2>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {status === 'verifying' && (
            <div className="flex flex-col items-center text-center space-y-4">
              <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
              <p className="text-gray-600">
                Please wait while we verify your email address...
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Your email has been verified!
                </h3>
                <p className="text-gray-600 mb-4">
                  Your account is now active. You can sign in to access DevPulse AI.
                </p>
                <p className="text-sm text-gray-500">
                  Redirecting to login in {countdown} second{countdown !== 1 ? 's' : ''}...
                </p>
              </div>
              <button
                onClick={() => navigate('/login')}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                Go to Login
              </button>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-6">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mb-4">
                  <AlertTriangle className="w-10 h-10 text-rose-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Verification Failed
                </h3>
                <p className="text-gray-600 mb-4">{errorMessage}</p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleResendEmail}
                  disabled={resending}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {resending ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-5 h-5" />
                      Resend Verification Email
                    </>
                  )}
                </button>

                <button
                  onClick={() => navigate('/signup')}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors"
                >
                  Back to Sign Up
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
