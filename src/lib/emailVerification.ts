/**
 * Email Verification System
 * 
 * Complete email verification flow for user registration
 * Issue #56: Incomplete Email Verification - COMPLETED
 */

import { supabase } from './supabase';

export interface VerificationResult {
  success: boolean;
  message: string;
  error?: string;
}

/**
 * Send verification email to user
 * Supabase handles this automatically on signup
 */
export async function sendVerificationEmail(email: string): Promise<VerificationResult> {
  try {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
    });

    if (error) {
      return {
        success: false,
        message: 'Failed to send verification email',
        error: error.message
      };
    }

    return {
      success: true,
      message: 'Verification email sent successfully'
    };
  } catch (error) {
    return {
      success: false,
      message: 'An error occurred while sending verification email',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Verify email with token from URL
 * Supabase handles this automatically when user clicks email link
 */
export async function verifyEmail(token: string, type: 'signup' | 'email_change' = 'signup'): Promise<VerificationResult> {
  try {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: type
    });

    if (error) {
      return {
        success: false,
        message: 'Email verification failed',
        error: error.message
      };
    }

    return {
      success: true,
      message: 'Email verified successfully'
    };
  } catch (error) {
    return {
      success: false,
      message: 'An error occurred during verification',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Check if user's email is verified
 */
export async function isEmailVerified(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.email_confirmed_at !== null;
  } catch (error) {
    console.error('Error checking email verification:', error);
    return false;
  }
}

/**
 * Get verification status for current user
 */
export async function getVerificationStatus() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        isVerified: false,
        email: null,
        verifiedAt: null
      };
    }

    return {
      isVerified: user.email_confirmed_at !== null,
      email: user.email,
      verifiedAt: user.email_confirmed_at
    };
  } catch (error) {
    console.error('Error getting verification status:', error);
    return {
      isVerified: false,
      email: null,
      verifiedAt: null
    };
  }
}

/**
 * Resend verification email for current user
 */
export async function resendVerificationEmail(): Promise<VerificationResult> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user?.email) {
      return {
        success: false,
        message: 'No user email found',
        error: 'User not logged in or email not available'
      };
    }

    if (user.email_confirmed_at) {
      return {
        success: false,
        message: 'Email already verified',
        error: 'This email has already been verified'
      };
    }

    return await sendVerificationEmail(user.email);
  } catch (error) {
    return {
      success: false,
      message: 'Failed to resend verification email',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Configuration for email verification
 * Set these in Supabase Dashboard > Authentication > Email Templates
 */
export const emailVerificationConfig = {
  // Redirect URL after email verification
  redirectUrl: `${window.location.origin}/verify-success`,
  
  // Email template variables (configured in Supabase)
  templateVariables: {
    confirmationUrl: '{{ .ConfirmationURL }}',
    token: '{{ .Token }}',
    tokenHash: '{{ .TokenHash }}',
    siteUrl: '{{ .SiteURL }}',
    email: '{{ .Email }}'
  },
  
  // Verification link expiry (configured in Supabase)
  expiryHours: 24,
  
  // Rate limiting
  resendCooldownSeconds: 60
};

/**
 * Setup instructions for Supabase email verification
 */
export const setupInstructions = `
EMAIL VERIFICATION SETUP INSTRUCTIONS:

1. Supabase Dashboard Configuration:
   - Go to Authentication > Email Templates
   - Enable "Confirm signup" template
   - Customize email template with your branding
   - Set redirect URL: ${emailVerificationConfig.redirectUrl}

2. Environment Variables:
   - VITE_SUPABASE_URL: Your Supabase project URL
   - VITE_SUPABASE_ANON_KEY: Your Supabase anon key

3. Email Provider:
   - Supabase uses built-in email service (limited to 3 emails/hour in free tier)
   - For production, configure custom SMTP in Supabase Dashboard
   - Recommended: SendGrid, AWS SES, or Mailgun

4. Testing:
   - In development, check Supabase logs for email content
   - Use a real email address to test the full flow
   - Check spam folder if email doesn't arrive

5. RLS Policies:
   - Ensure users table has proper RLS policies
   - Unverified users should have limited access
   - Consider adding email_verified column to profiles table

6. User Flow:
   - User signs up → Supabase sends verification email
   - User clicks link → Redirected to /verify-success
   - VerifySuccessPage shows success message
   - User can now access full application

7. Error Handling:
   - Expired tokens: Show resend button
   - Invalid tokens: Show error and signup link
   - Already verified: Redirect to dashboard
`;

export default {
  sendVerificationEmail,
  verifyEmail,
  isEmailVerified,
  getVerificationStatus,
  resendVerificationEmail,
  config: emailVerificationConfig,
  setupInstructions
};
