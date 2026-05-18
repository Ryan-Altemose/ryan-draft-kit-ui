'use client';

import { Box, Button } from '@chakra-ui/react';
import Link from 'next/link';

type NavbarButtonProps = {
  label: string;
  href: string;
  showIndicator?: boolean;
};

export default function NavbarButton({
  label,
  href,
  showIndicator = false,
}: NavbarButtonProps) {
  return (
    <Link href={href}>
      <Button
        variant="ghost"
        color="green.600"
        _hover={{ bg: 'green.50' }}
        position="relative"
      >
        {label}
        {showIndicator ? (
          <Box
            position="absolute"
            top="10px"
            right="10px"
            boxSize="8px"
            borderRadius="full"
            bg="red.500"
          />
        ) : null}
      </Button>
    </Link>
  );
}
