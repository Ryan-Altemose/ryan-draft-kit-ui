import { Box, Heading, Stack, Text } from '@chakra-ui/react';
import GoogleSignInButton from '@/features/Auth/components/GoogleSignInButton';

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ callbackUrl?: string }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const callbackUrl =
    typeof resolvedSearchParams?.callbackUrl === 'string'
      ? resolvedSearchParams.callbackUrl
      : '/';

  return (
    <Box p={8}>
      <Stack spacing={4} maxW="md">
        <Heading size="lg">Sign In</Heading>
        <Text>
          Use your Google account to access leagues, notebooks, and profile
          data.
        </Text>
        <GoogleSignInButton callbackUrl={callbackUrl} />
      </Stack>
    </Box>
  );
}
