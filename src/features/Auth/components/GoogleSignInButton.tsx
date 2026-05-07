'use client';

import { Button } from '@chakra-ui/react';
import { signIn } from 'next-auth/react';

type GoogleSignInButtonProps = {
  callbackUrl?: string;
  label?: string;
};

export default function GoogleSignInButton({
  callbackUrl = '/',
  label = 'Sign In With Google',
}: GoogleSignInButtonProps) {
  return (
    <Button
      colorScheme="green"
      onClick={() => {
        void signIn('google', { callbackUrl });
      }}
    >
      {label}
    </Button>
  );
}
