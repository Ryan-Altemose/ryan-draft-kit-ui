import { Box, Flex } from '@chakra-ui/react';
import DraftLeftPanel from './components/DraftLeftPanel';

export default function DraftPage() {
  return (
    <Flex h="100vh" overflow="hidden">
      <Box
        flexBasis="16.67%"
        flexShrink={0}
        borderRightWidth="1px"
        borderColor="gray.200"
      >
        <DraftLeftPanel />
      </Box>
      <Box
        flexBasis="50%"
        flexShrink={0}
        borderRightWidth="1px"
        borderColor="gray.200"
      />
      <Box flex={1} />
    </Flex>
  );
}
