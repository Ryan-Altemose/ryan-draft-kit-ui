'use client';

import {
  Badge,
  Box,
  Button,
  Heading,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  VStack,
} from '@chakra-ui/react';

type AlertWidgetProps = {
  isOpen: boolean;
  onClose: () => void;
  category: string;
  description: string;
};

export default function AlertWidget({
  isOpen,
  onClose,
  category,
  description,
}: AlertWidgetProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <ModalOverlay bg="blackAlpha.500" />
      <ModalContent
        borderRadius="2xl"
        overflow="hidden"
        position="fixed"
        top={6}
        right={6}
        m={0}
        maxW="360px"
        transform="none"
      >
        <Box h="8px" bg="orange.400" />
        <ModalHeader pb={2}>
          <VStack align="start" spacing={2}>
            <Badge colorScheme="orange" px={2} py={1} borderRadius="full">
              Alert
            </Badge>
            <Heading size="md">Alert: {category}</Heading>
          </VStack>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pt={0} pb={6}>
          <Text color="gray.600" lineHeight="tall">
            {description}
          </Text>
        </ModalBody>
        <ModalFooter pt={0}>
          <Button colorScheme="orange" onClick={onClose}>
            Dismiss
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
