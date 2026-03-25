// emails/VerificationEmail.tsx
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface VerificationEmailProps {
  userName: string;
  verificationUrl: string;
}

export const VerificationEmail = ({
  userName = 'User',
  verificationUrl = 'https://example.com/verify',
}: VerificationEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Verify your DevPulse AI account</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoContainer}>
            <div style={logo}>
              <Text style={logoText}>DevPulse AI</Text>
            </div>
          </Section>
          
          <Heading style={h1}>Verify Your Email Address</Heading>
          
          <Text style={text}>
            Hi {userName},
          </Text>
          
          <Text style={text}>
            Welcome to DevPulse AI! To complete your registration and access your account, 
            please verify your email address by clicking the button below.
          </Text>
          
          <Section style={buttonContainer}>
            <Button style={button} href={verificationUrl}>
              Verify Your Email
            </Button>
          </Section>
          
          <Text style={text}>
            This verification link will expire in 24 hours for security reasons.
          </Text>
          
          <Text style={text}>
            If you didn't create an account with DevPulse AI, you can safely ignore this email.
          </Text>
          
          <Section style={divider} />
          
          <Text style={footer}>
            If the button above doesn't work, copy and paste this link into your browser:
          </Text>
          
          <Link href={verificationUrl} style={link}>
            {verificationUrl}
          </Link>
          
          <Text style={footer}>
            © 2026 DevPulse AI. All rights reserved.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default VerificationEmail;

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const logoContainer = {
  margin: '0 auto',
  padding: '20px 0 40px',
  textAlign: 'center' as const,
};

const logo = {
  display: 'inline-block',
  backgroundColor: '#10b981',
  borderRadius: '12px',
  padding: '12px 24px',
};

const logoText = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0',
  letterSpacing: '-0.5px',
};

const h1 = {
  color: '#1f2937',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0 40px',
  textAlign: 'center' as const,
};

const text = {
  color: '#4b5563',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
  padding: '0 40px',
};

const buttonContainer = {
  padding: '27px 0 27px',
  textAlign: 'center' as const,
};

const button = {
  backgroundColor: '#10b981',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 40px',
};

const divider = {
  borderTop: '1px solid #e5e7eb',
  margin: '32px 40px',
};

const footer = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '16px 0',
  padding: '0 40px',
};

const link = {
  color: '#10b981',
  fontSize: '14px',
  textDecoration: 'underline',
  wordBreak: 'break-all' as const,
  padding: '0 40px',
  display: 'block',
};
