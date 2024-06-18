import type { ObjectValues } from '../utils/usefulTS';

export const EXHIBIT_HEALTH_STATE = {
    ALL_CONNECTIONS_OK: 'ALL_CONNECTIONS_OK',
    NO_CONNECTIONS: 'NO_CONNECTIONS',
    SOME_CONNECTIONS_OK: 'SOME_CONNECTIONS_OK',
} as const;

export type ExhibitHealthState = ObjectValues<typeof EXHIBIT_HEALTH_STATE>;

export type ExhibitHealthStateUpdatePayload = {
    exhibitId: number;
    healthState: ExhibitHealthState;
    numberDisconnectedComponents: number;
    totalNumberComponents: number;
};

export type ExhibitSettingListReceivedPayload = {
    id: string; // Yep, that's right, no exhibitId, only the item's manifestId
    value: unknown; // There is data here, but it's not complete enough to provide a way to update anything
};

type StrapiOption = {
    id: number;
} & {
    [key in string as Exclude<key, 'id'>]: unknown;
};

export type ExhibitSettingReceivedPayload = {
    id: number;
    manifestId: string;
    settingId: number;
    settingValue: string | number | 'true' | 'false' | StrapiOption | null;
};

export type ExhibitStatusReceivedPayload = {
    id: number;
    value?: string;
    updatedAt: string; // ISO 8601 timestamp
};

export type ExhibitOpModeReceivedPayload = {
    id: number;
    mode: boolean;
};
