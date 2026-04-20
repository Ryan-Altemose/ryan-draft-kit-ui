import { FilterQuery } from 'mongoose';
import {
  type League,
  type LeagueFilters,
  type LeagueInput,
} from '../types/leagues.types';
import { LeagueModel } from './leagues.model';

type LeagueDocument = Awaited<ReturnType<typeof LeagueModel.findById>>;

function toLeague(document: LeagueDocument): League | null {
  if (!document) {
    return null;
  }

  const object = (
    document as {
      toObject(options?: { flattenMaps?: boolean }): unknown;
    }
  ).toObject({
    flattenMaps: true,
  }) as Omit<League, '_id'> & { _id: { toString(): string } };

  return {
    ...object,
    _id: object._id.toString(),
  };
}

export class LeaguesService {
  async getLeagues(filters: LeagueFilters = {}) {
    const {
      format,
      draftType,
      isDefault,
      search,
      page = 1,
      limit = 20,
    } = filters;

    const query: FilterQuery<typeof LeagueModel> = {};

    if (format) {
      query.format = format;
    }

    if (draftType) {
      query.draftType = draftType;
    }

    if (typeof isDefault === 'boolean') {
      query.isDefault = isDefault;
    }

    if (search?.trim()) {
      query.$text = { $search: search.trim() };
    }

    const [documents, total] = await Promise.all([
      LeagueModel.find(query)
        .sort({ isDefault: -1, updatedAt: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      LeagueModel.countDocuments(query),
    ]);

    return {
      leagues: documents.map((document) => toLeague(document)).filter(Boolean),
      pagination: {
        total,
        page,
        limit,
      },
    };
  }

  async getLeagueById(id: string): Promise<League | null> {
    return toLeague(await LeagueModel.findById(id));
  }

  async getLeagueByExternalId(externalId: string): Promise<League | null> {
    return toLeague(await LeagueModel.findOne({ externalId }));
  }

  async upsertLeague(input: LeagueInput): Promise<League> {
    const document = await LeagueModel.findOneAndUpdate(
      { externalId: input.externalId },
      { $set: input },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    );

    const league = toLeague(document);

    if (!league) {
      throw new Error('Failed to save league');
    }

    return league;
  }

  async upsertLeagues(inputs: LeagueInput[]): Promise<League[]> {
    return Promise.all(inputs.map((input) => this.upsertLeague(input)));
  }

  async deleteLeagueById(id: string): Promise<League | null> {
    return toLeague(await LeagueModel.findByIdAndDelete(id));
  }
}

export const leaguesService = new LeaguesService();
