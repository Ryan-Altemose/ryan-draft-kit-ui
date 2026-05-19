'use client';

import { type ChangeEvent, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Alert,
  AlertIcon,
  Button,
  FormControl,
  FormLabel,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  Textarea,
  VStack,
} from '@chakra-ui/react';
import { isApiError } from '@/shared/utils/api-client';
import { useImportLeague } from '../hooks/useImportLeague';

type ImportLeagueModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

function readJsonFile(file: File): Promise<string> {
  if (typeof file.text === 'function') {
    return file.text();
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
        return;
      }
      reject(new Error('Failed to read JSON file'));
    };
    reader.onerror = () => reject(new Error('Failed to read JSON file'));
    reader.readAsText(file);
  });
}

export default function ImportLeagueModal({
  isOpen,
  onClose,
}: ImportLeagueModalProps) {
  const router = useRouter();
  const importLeagueMutation = useImportLeague();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [jsonText, setJsonText] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  function handleClose() {
    importLeagueMutation.reset();
    setLocalError(null);
    setJsonText('');
    setSelectedFileName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      setSelectedFileName(null);
      return;
    }

    setLocalError(null);
    setSelectedFileName(file.name);

    try {
      const text = await readJsonFile(file);
      setJsonText(text);
    } catch {
      setLocalError('Failed to read JSON file');
    }
  }

  async function handleImport() {
    setLocalError(null);

    let importJson: unknown;
    try {
      importJson = JSON.parse(jsonText);
    } catch {
      setLocalError('Invalid JSON');
      return;
    }

    try {
      const response = await importLeagueMutation.mutateAsync(importJson);
      handleClose();
      router.push(`/leagues/${response.data._id}`);
    } catch (error) {
      if (isApiError(error)) {
        setLocalError(error.message);
        return;
      }

      setLocalError('Failed to import league');
    }
  }

  const errorMessage =
    localError ??
    (importLeagueMutation.isError && isApiError(importLeagueMutation.error)
      ? importLeagueMutation.error.message
      : null);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="4xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Import League JSON</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack align="stretch" spacing={4}>
            <FormControl>
              <FormLabel>Upload JSON File</FormLabel>
              <input
                ref={fileInputRef}
                aria-label="Upload JSON file"
                type="file"
                accept=".json,application/json"
                onChange={handleFileChange}
              />
              {selectedFileName ? (
                <Text mt={2} fontSize="sm" color="gray.600">
                  {selectedFileName}
                </Text>
              ) : null}
            </FormControl>
            <FormControl>
              <FormLabel>League JSON</FormLabel>
              <Textarea
                aria-label="League JSON"
                minH="360px"
                fontFamily="mono"
                value={jsonText}
                onChange={(event) => setJsonText(event.target.value)}
                placeholder='{"name":"Imported League","format":"roto"}'
              />
            </FormControl>
          </VStack>
          {errorMessage ? (
            <Alert status="error" mt={4}>
              <AlertIcon />
              {errorMessage}
            </Alert>
          ) : null}
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={handleClose}>
            Cancel
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleImport}
            isLoading={importLeagueMutation.isPending}
            isDisabled={jsonText.trim().length === 0}
          >
            Import League
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
