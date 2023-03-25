import * as Updates from './Updates';
import type { Manifest, UpdateEvent } from './Updates.types';
import { UpdatesProviderEventType, currentlyRunning } from './UpdatesProvider.constants';
import type { UpdatesInfo, UpdatesProviderEvent } from './UpdatesProvider.types';

/////// Internal functions ////////

// Promise wrapper for setTimeout()
export const delay = (timeout: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, timeout);
  });
};

// Constructs the availableUpdate from the update manifest
export const availableUpdateFromManifest = (manifest: Partial<Manifest> | undefined) => {
  return manifest
    ? {
        updateId: manifest?.id ? manifest?.id : null,
        createdAt: manifest?.createdAt ? new Date(manifest?.createdAt) : null,
        manifest,
      }
    : undefined;
};

// Constructs the UpdatesInfo from an event
export const updatesInfoFromEvent = (event: UpdateEvent): UpdatesInfo => {
  const lastCheckForUpdateTime = new Date();
  if (event.type === Updates.UpdateEventType.NO_UPDATE_AVAILABLE) {
    return {
      currentlyRunning,
      lastCheckForUpdateTime,
    };
  } else if (event.type === Updates.UpdateEventType.UPDATE_AVAILABLE) {
    return {
      currentlyRunning,
      availableUpdate: availableUpdateFromManifest(event.manifest),
      lastCheckForUpdateTime,
    };
  } else {
    // event type === ERROR
    return {
      currentlyRunning,
      error: new Error(event.message),
      lastCheckForUpdateTime,
    };
  }
};

// Implementation of checkForUpdate
export const checkForUpdateAndReturnNewUpdatesInfoAsync: (
  updatesInfo: UpdatesInfo,
  providerEventHandler?: (event: UpdatesProviderEvent) => void
) => Promise<UpdatesInfo> = async (updatesInfo, providerEventHandler) => {
  try {
    providerEventHandler && providerEventHandler({ type: UpdatesProviderEventType.CHECK_START });
    const checkResult = await Updates.checkForUpdateAsync();
    providerEventHandler && providerEventHandler({ type: UpdatesProviderEventType.CHECK_COMPLETE });
    const lastCheckForUpdateTime = new Date();
    if (checkResult.isAvailable) {
      return {
        ...updatesInfo,
        availableUpdate: availableUpdateFromManifest(checkResult.manifest),
        lastCheckForUpdateTime,
      };
    } else {
      return {
        ...updatesInfo,
        lastCheckForUpdateTime,
      };
    }
  } catch (error: any) {
    const lastCheckForUpdateTime = new Date();
    providerEventHandler && providerEventHandler({ type: UpdatesProviderEventType.CHECK_ERROR });
    return {
      ...updatesInfo,
      lastCheckForUpdateTime,
      error,
    };
  }
};

// Implementation of downloadUpdate
export const downloadUpdateAsync = async (
  providerEventHandler?: (event: UpdatesProviderEvent) => void
) => {
  try {
    providerEventHandler && providerEventHandler({ type: UpdatesProviderEventType.DOWNLOAD_START });
    await Updates.fetchUpdateAsync();
    providerEventHandler &&
      providerEventHandler({ type: UpdatesProviderEventType.DOWNLOAD_COMPLETE });
    return null;
  } catch (error: any) {
    providerEventHandler &&
      providerEventHandler({ type: UpdatesProviderEventType.DOWNLOAD_ERROR, error });
    return error;
  }
};

// Implementation of runUpdate
export const runUpdateAsync = async (
  providerEventHandler?: (event: UpdatesProviderEvent) => void
) => {
  try {
    providerEventHandler && providerEventHandler({ type: UpdatesProviderEventType.RUN_START });
    await Updates.reloadAsync();
    return null;
  } catch (error: any) {
    providerEventHandler &&
      providerEventHandler({ type: UpdatesProviderEventType.RUN_ERROR, error });
    return error;
  }
};

// Implementation of downloadAndRunUpdate
export const downloadAndRunUpdateAsync = async (
  providerEventHandler?: (event: UpdatesProviderEvent) => void
) => {
  const error = await downloadUpdateAsync(providerEventHandler);
  if (error) {
    return error;
  }
  return await runUpdateAsync(providerEventHandler);
};
