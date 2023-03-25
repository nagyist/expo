import type { Manifest, UpdateEvent } from './Updates.types';
import type { UpdatesInfo, UpdatesProviderEvent } from './UpdatesProvider.types';
export declare const delay: (timeout: number) => Promise<unknown>;
export declare const availableUpdateFromManifest: (manifest: Partial<Manifest> | undefined) => {
    updateId: string | null;
    createdAt: Date | null;
    manifest: Partial<import("expo-constants/build/Constants.types").AppManifest> | Partial<import("expo-constants/build/Constants.types").Manifest>;
} | undefined;
export declare const updatesInfoFromEvent: (event: UpdateEvent) => UpdatesInfo;
export declare const checkForUpdateAndReturnNewUpdatesInfoAsync: (updatesInfo: UpdatesInfo, providerEventHandler?: (event: UpdatesProviderEvent) => void) => Promise<UpdatesInfo>;
export declare const downloadUpdateAsync: (providerEventHandler?: ((event: UpdatesProviderEvent) => void) | undefined) => Promise<any>;
export declare const runUpdateAsync: (providerEventHandler?: ((event: UpdatesProviderEvent) => void) | undefined) => Promise<any>;
export declare const downloadAndRunUpdateAsync: (providerEventHandler?: ((event: UpdatesProviderEvent) => void) | undefined) => Promise<any>;
//# sourceMappingURL=UpdatesProvider.utils.d.ts.map