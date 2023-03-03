/*global storage*/
import { legacy } from '@/storage/legacy';
import logger from '@/utils/logger';

const defaultVersion = '0.1.0';

export const getKey = (prefix: any, accountAddress: any, network: any) =>
  `${prefix}-${accountAddress.toLowerCase()}-${network.toLowerCase()}`;

/**
 * @desc save to storage
 * @param  {String}  [key='']
 * @param  {Object}  [data={}]
 * @param  {String} [version=defaultVersion]
 */
export const saveLocal = (key = '', data = {}) => {
  try {
    legacy.set([key], data);
  } catch (error) {
    logger.log('Storage: error saving to legacy storage for key', key);
  }
};

/**
 * @desc get from storage
 * @param  {String}  [key='']
 * @param  {Object}  [data={}]
 * @param  {String} [version=defaultVersion]
 */

export const getLocal = async (key = '') => {
  return await legacy.get([key]);
};

/**
 * @desc save to legacy async storage
 * @param  {String}  [key='']
 * @param  {Object}  [data={}]
 * @param  {String} [version=defaultVersion]
 *
 * @deprecated use @/storage/legacy
 */
export const deprecatedSaveLocal = async (
  key = '',
  data = {},
  version = defaultVersion
) => {
  try {
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'storageVersion' does not exist on type '... Remove this comment to see the full error message
    data.storageVersion = version;
    // @ts-expect-error ts-migrate(2552) FIXME: Cannot find name 'storage'. Did you mean 'Storage'... Remove this comment to see the full error message
    await storage.save({
      data,
      expires: null,
      key,
    });
  } catch (error) {
    logger.log('Storage: error saving to local for key', key);
  }
};

/**
 * @desc get from legacy async storage
 * @param  {String}  [key='']
 * @return {Object}
 *
 * @deprecated use @/storage/legacy
 */
export const deprecatedGetLocal = async (
  key = '',
  version = defaultVersion
) => {
  try {
    // @ts-expect-error ts-migrate(2552) FIXME: Cannot find name 'storage'. Did you mean 'Storage'... Remove this comment to see the full error message
    const result = await storage.load({
      autoSync: false,
      key,
      syncInBackground: false,
    });
    if (result && result.storageVersion === version) {
      return result;
    }
    if (result) {
      deprecatedRemoveLocal(key);
      return null;
    }
    return null;
  } catch (error) {
    logger.log('Storage: error getting from local for key', key);
    return null;
  }
};

/**
 * @desc  remove from deprecated async storage
 * @param  {String}  [key='']
 * @return {Object}
 *
 * @deprecated use @/storage/legacy
 */
export const deprecatedRemoveLocal = (key = '') => {
  try {
    // @ts-expect-error ts-migrate(2552) FIXME: Cannot find name 'storage'. Did you mean 'Storage'... Remove this comment to see the full error message
    storage.remove({ key });
  } catch (error) {
    logger.log('Storage: error removing local with key', key);
  }
};

export const getGlobal = async (key: any, emptyState: any) => {
  const result = await getLocal(key);
  return result ? result.data : emptyState;
};

export const saveGlobal = (key: any, data: any) => saveLocal(key, { data });

export const getAccountLocal = async (
  prefix: any,
  accountAddress: any,
  network: any,
  emptyState = [],
  version = defaultVersion
) => {
  const key = getKey(prefix, accountAddress, network);
  const result = await getLocal(key);
  return result ? result.data : emptyState;
};

export function saveAccountLocal(
  prefix: any,
  data: any,
  accountAddress: any,
  network: any,
  version = defaultVersion
) {
  return saveLocal(getKey(prefix, accountAddress, network), { data });
}

export const removeAccountLocal = (
  prefix: any,
  accountAddress: any,
  network: any
) => {
  const key = getKey(prefix, accountAddress, network);
  deprecatedRemoveLocal(key);
};
