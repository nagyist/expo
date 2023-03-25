import React from 'react';
import { View, Text, Pressable } from 'react-native';

import * as Updates from '..';

const { useUpdates } = Updates.Provider;

export const UpdatesProviderTestApp = (props: {
  providerEventHandler?: (event: Updates.UpdatesProviderEvent) => void;
}) => {
  const { updatesInfo, checkForUpdate, downloadUpdate, downloadAndRunUpdate, readLogEntries } =
    useUpdates(props.providerEventHandler);
  const updateAvailable: boolean = updatesInfo.availableUpdate !== undefined;
  return (
    <View>
      {/* Currently running info */}
      <Text testID="currentlyRunning_updateId">{updatesInfo.currentlyRunning.updateId}</Text>
      <Text testID="currentlyRunning_channel">{updatesInfo.currentlyRunning.channel}</Text>
      <Text testID="currentlyRunning_createdAt">
        {updatesInfo.currentlyRunning?.createdAt
          ? updatesInfo.currentlyRunning?.createdAt.toISOString()
          : ''}
      </Text>
      {/* Available update, if one is present */}
      {updateAvailable ? (
        <Text testID="availableUpdate_updateId">{updatesInfo.availableUpdate?.updateId || ''}</Text>
      ) : null}
      {/* Log entries, if they have been read */}
      {(updatesInfo.logEntries?.length || 0) > 0 ? (
        <Text testID="logEntry">
          {JSON.stringify(updatesInfo?.logEntries ? updatesInfo?.logEntries[0].message : '') || ''}
        </Text>
      ) : null}
      {/* Show}
      {/* Buttons for test code to invoke methods */}
      <Pressable testID="checkForUpdate" onPress={() => checkForUpdate()} />
      <Pressable testID="downloadUpdate" onPress={() => downloadUpdate()} />
      <Pressable testID="downloadAndRunUpdate" onPress={() => downloadAndRunUpdate()} />
      <Pressable testID="readLogEntries" onPress={() => readLogEntries()} />
    </View>
  );
};
