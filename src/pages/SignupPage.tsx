// src/pages/SignupPage.tsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { signupSchema, SignupInput } from '../lib/validations';
import { AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';

export const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<SignupInput>({
    email: '',
    password: '',
    fullName: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof SignupInput, string>>>({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof SignupInput]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setErrorMessage('');
    setSuccessMessage('');

    const validation = signupSchema.safeParse(formData);
    if (!validation.success) {
      const fieldErrors: Partial<Record<keyof SignupInput, string>> = {};
      validation.error.issues.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as keyof SignupInput] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
          },
          emailRedirectTo: undefined, // Disable email confirmation redirect
        },
      });

      if (error) {
        console.error('Signup error:', error);
        if (error.message.includes('already registered')) {
          setErrorMessage('This email is already registered. Please sign in instead.');
        } else if (error.message.includes('User already registered')) {
          setErrorMessage('This email is already registered. Please sign in instead.');
        } else {
          setErrorMessage(error.message || 'Failed to create account. Please try again.');
        }
        return;
      }

      if (data.user) {
        console.log('Signup successful:', data.user.email);
        
        // Check if email confirmation is required
        if (data.user.identities && data.user.identities.length === 0) {
          // Email confirmation is enabled - user needs to verify
          setSuccessMessage('Account created! Please check your email to verify your account before signing in.');
        } else {
          // Email confirmation is disabled - redirect to dashboard
          setSuccessMessage('Account created successfully! Redirecting...');
          setTimeout(() => {
            navigate('/dashboard');
          }, 1500);
        }
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      setErrorMessage('Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center text-white font-bold text-2xl mb-4">
            D
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Create your account</h2>
          <p className="mt-2 text-sm text-gray-600">
            Join DevPulse AI with your TCS email
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {successMessage && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-emerald-800">{successMessage}</p>
            </div>
          )}

          {errorMessage && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-rose-800">{errorMessage}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                value={formData.fullName}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                placeholder="John Doe"
              />
              {errors.fullName && (
                <p className="mt-2 text-sm text-rose-600">{errors.fullName}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                placeholder="[email]@tcs.com"
              />
              {errors.email && (
                <p className="mt-2 text-sm text-rose-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="mt-2 text-sm text-rose-600">{errors.password}</p>
              )}
              <p className="mt-2 text-xs text-gray-500">
                Must be at least 6 characters
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-emerald-600 hover:text-emerald-700 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
