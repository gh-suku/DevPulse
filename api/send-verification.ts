// api/send-verification.ts
import { Resend } from 'resend';
import { render } from '@react-email/render';
import { z } from 'zod';
import VerificationEmail from '../emails/VerificationEmail';

const resend = new Resend(process.env.RESEND_API_KEY);

// Rate limiting store (in-memory, use Redis/Upstash in production)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

const requestSchema = z.object({
  email: z
    .string()
    .email('Invalid email address')
    .refine((email) => email.endsWith('@tcs.com'), {
      message: 'Email must be from @tcs.com domain',
    }),
  verificationUrl: z.string().url('Invalid verification URL'),
  userName: z.string().min(1, 'User name is required'),
});

type RequestBody = z.infer<typeof requestSchema>;

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

function checkRateLimit(email: string): RateLimitResult {
  const now = Date.now();
  const key = email.toLowerCase();
  
  // Clean up expired entries first
  const limit = rateLimitStore.get(key);
  if (limit && now > limit.resetAt) {
    console.log('Rate limit expired, clearing for:', key);
    rateLimitStore.delete(key);
  }

  const current = rateLimitStore.get(key);

  if (!current) {
    // First request - initialize
    const resetAt = now + 60 * 60 * 1000; // 1 hour from now
    rateLimitStore.set(key, { count: 1, resetAt });
    console.log('Rate limit initialized for:', key, '- 2 remaining');
    return { allowed: true, remaining: 2, resetAt };
  }

  if (current.count >= 3) {
    // Rate limit exceeded
    const minutesUntilReset = Math.ceil((current.resetAt - now) / 60000);
    console.log('Rate limit exceeded for:', key, `- reset in ${minutesUntilReset} minutes`);
    return { allowed: false, remaining: 0, resetAt: current.resetAt };
  }

  // Increment count
  current.count += 1;
  const remaining = 3 - current.count;
  rateLimitStore.set(key, current);
  console.log('Rate limit updated for:', key, `- ${remaining} remaining`);
  return { allowed: true, remaining, resetAt: current.resetAt };
}

// Add function to manually clear rate limit (for testing/debugging)
export function clearRateLimit(email: string): void {
  const key = email.toLowerCase();
  rateLimitStore.delete(key);
  console.log('Rate limit cleared for:', key);
}

// Add function to check current rate limit status without incrementing
export function getRateLimitStatus(email: string): RateLimitResult {
  const now = Date.now();
  const key = email.toLowerCase();
  const limit = rateLimitStore.get(key);

  if (!limit || now > limit.resetAt) {
    return { allowed: true, remaining: 3, resetAt: now + 60 * 60 * 1000 };
  }

  const remaining = Math.max(0, 3 - limit.count);
  return { 
    allowed: remaining > 0, 
    remaining, 
    resetAt: limit.resetAt 
  };
}

export async function sendVerificationEmail(body: unknown): Promise<{
  success: boolean;
  error?: string;
  code?: string;
  remaining?: number;
  resetAt?: number;
}> {
  try {
    // Validate input
    const validation = requestSchema.safeParse(body);
    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return {
        success: false,
        error: firstError.message,
        code: 'VALIDATION_ERROR',
      };
    }

    const { email, verificationUrl, userName } = validation.data;

    // Render email template first (before rate limit check)
    let emailHtml: string;
    try {
      emailHtml = await render(
        VerificationEmail({
          userName,
          verificationUrl,
        })
      );
    } catch (error: any) {
      console.error('Email template render error:', error);
      return {
        success: false,
        error: 'Failed to generate email. Please try again.',
        code: 'TEMPLATE_ERROR',
      };
    }

    // Send email via Resend
    const { data, error: resendError } = await resend.emails.send({
      from: 'DevPulse AI <no-reply@tcs.com>',
      to: [email],
      subject: 'Verify your DevPulse AI account',
      html: emailHtml,
      text: `Hi ${userName},\n\nWelcome to DevPulse AI! Please verify your email address by clicking this link:\n\n${verificationUrl}\n\nThis link will expire in 24 hours.\n\nIf you didn't create an account, you can safely ignore this email.\n\n© 2026 DevPulse AI`,
    });

    if (resendError) {
      console.error('Resend API error:', resendError);
      
      // Provide specific error messages based on Resend error
      let errorMessage = 'Failed to send verification email. Please try again.';
      let errorCode = 'EMAIL_SEND_FAILED';

      if (resendError.message?.includes('API key')) {
        errorMessage = 'Email service configuration error. Please contact support.';
        errorCode = 'API_KEY_ERROR';
      } else if (resendError.message?.includes('domain')) {
        errorMessage = 'Email domain not verified. Please contact support.';
        errorCode = 'DOMAIN_ERROR';
      } else if (resendError.message?.includes('rate limit')) {
        errorMessage = 'Email service rate limit reached. Please try again in a few minutes.';
        errorCode = 'RESEND_RATE_LIMIT';
      } else if (resendError.message?.includes('invalid')) {
        errorMessage = 'Invalid email configuration. Please contact support.';
        errorCode = 'INVALID_CONFIG';
      }

      return {
        success: false,
        error: errorMessage,
        code: errorCode,
      };
    }

    // Only increment rate limit AFTER successful send
    const rateLimit = checkRateLimit(email);
    if (!rateLimit.allowed) {
      // This shouldn't happen on first send, but just in case
      console.warn('Rate limit exceeded after successful send:', email);
    }

    console.log('Verification email sent successfully:', { 
      email, 
      messageId: data?.id,
      remaining: rateLimit.remaining 
    });

    return {
      success: true,
      remaining: rateLimit.remaining,
    };
  } catch (error: any) {
    console.error('Unexpected error in sendVerificationEmail:', error);
    
    // Provide more specific error messages
    let errorMessage = 'An unexpected error occurred. Please try again.';
    let errorCode = 'INTERNAL_ERROR';

    if (error.message?.includes('network') || error.message?.includes('fetch')) {
      errorMessage = 'Network error. Please check your connection and try again.';
      errorCode = 'NETWORK_ERROR';
    } else if (error.message?.includes('timeout')) {
      errorMessage = 'Request timed out. Please try again.';
      errorCode = 'TIMEOUT_ERROR';
    }

    return {
      success: false,
      error: errorMessage,
      code: errorCode,
    };
  }
}
