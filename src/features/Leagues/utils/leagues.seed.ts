import { leaguesService } from '../server/leagues.service';
import { defaultLeagues } from '../server/default-leagues';

export async function seedDefaultLeagues(): Promise<void> {
  await leaguesService.upsertLeagues(defaultLeagues);
}
