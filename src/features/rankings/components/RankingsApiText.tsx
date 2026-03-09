'use client';

import { useEffect, useState } from 'react';
import { Box, Text } from '@chakra-ui/react';
import { api } from '@/lib/axios';

type Player = {
  _id: string;
  externalId: string;
  name: string;
  team: string;
  league: string;
  playerType: string;
};

type PlayersResponse = {
  data?: Player[];
};

export default function RankingsApiText() {
  const [content, setContent] = useState('Loading...');

  useEffect(() => {
    let active = true;

    async function loadPlayers() {
      try {
        const response = (await api.get('/players?limit=1')) as PlayersResponse;
        const players = response.data;

        if (!active || !players || players.length === 0) {
          setContent('failed to retrieve data');
          return;
        }

        const player = players[0];
        const text = JSON.stringify(player, null, 2);

        setContent(text);
      } catch {
        if (active) {
          setContent('failed to retrieve data');
        }
      }
    }

    loadPlayers();

    return () => {
      active = false;
    };
  }, []);

  return (
    <Box mt={8}>
      <Text fontSize="sm" whiteSpace="pre-wrap">
        {content}
      </Text>
    </Box>
  );
}
