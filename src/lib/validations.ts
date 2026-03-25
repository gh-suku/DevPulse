// src/lib/validations.ts
import { z } from 'zod';

export const signupSchema = z.object({
  email: z
    .string()
    .email('Invalid email address')
    .refine((email) => email.endsWith('@tcs.com'), {
      message: 'Email must be from @tcs.com domain',
    }),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export const profileSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  department: z.string().optional().or(z.literal('')),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
