import { request } from '../request';

export interface GetPlayerSummariesOptions {
  key: string;
  steamIds: string[];
}

export interface GetPlayerSummariesResponse {
  response: {
    players: [
      {
        avatar: string;
        avatarfull: string;
        avatarhash: string;
        avatarmedium: string;
        communityvisibilitystate: number;
        loccityid: number;
        loccountrycode: string;
        locstatecode: string;
        personaname: string;
        personastate: number;
        personastateflags: number;
        primaryclanid: string;
        profilestate: number;
        profileurl: string;
        realname: string;
        steamid: string;
        timecreated: number;
      },
    ];
  };
}

export async function getPlayerSummaries(options: GetPlayerSummariesOptions) {
  const method = 'get';
  const params = { key: options.key, steamids: options.steamIds.join(',') };
  const url = `http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002`;

  return request<GetPlayerSummariesResponse>({ method, params, url });
}
