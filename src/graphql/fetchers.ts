import { getRequester } from './utils/getRequester';
import { getSdk as getEnsSdk } from './__generated__/ens';

export const ens = getEnsSdk(
  getRequester('https://api.thegraph.com/subgraphs/name/ensdomains/ens')
);
