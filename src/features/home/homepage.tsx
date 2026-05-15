'use client';

import { Box, SimpleGrid } from '@chakra-ui/react';
import FeatureCard from './components/FeatureCard';

const features = [
  {
    title: 'Draft Board',
    description: 'View and manage the live draft board in real time',
    buttonText: 'Go to Draft',
    href: '/draft',
  },
  {
    title: 'Player Scouting',
    description:
      'Explore player stats and projections to inform your draft strategy',
    buttonText: 'Scout Players',
    href: '/rankings',
  },
  {
    title: 'Mock Draft',
    description:
      'Simulate through mock drafts to prepare for your real draft day',
    buttonText: 'View Mock Draft',
    href: '/mock-draft',
  },
  {
    title: 'Depth Charts',
    description: 'View full depth charts across MLB',
    buttonText: 'View Depth Charts',
    href: '/depth-charts',
  },
  {
    title: 'League Setup',
    description: 'Configure league settings and scoring format',
    buttonText: 'Setup League',
    href: '/leagues',
  },
  {
    title: 'Player Stats',
    description: 'View all player stats from previous seasons',
    buttonText: 'View Stats',
    href: '/stats',
  },
  {
    title: 'Notebook',
    description: 'Track notes, sleepers, and targets for your draft plans',
    buttonText: 'Open Notebook',
    href: '/notebook',
  },
];

export default function HomePage() {
  return (
    <Box>
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
        {features.map((feature) => (
          <FeatureCard key={feature.title} {...feature} />
        ))}
      </SimpleGrid>
    </Box>
  );
}
