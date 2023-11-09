import { AsbplayerSettings, Command, SettingsProvider, SettingsUpdatedMessage } from '@project/common';
import { ExtensionSettingsStorage } from '../../services/extension-settings-storage';
import { useCallback, useEffect, useMemo, useState } from 'react';

export const useSettings = () => {
    const settingsProvider = useMemo(() => new SettingsProvider(new ExtensionSettingsStorage()), []);
    const [settings, setSettings] = useState<AsbplayerSettings>();

    useEffect(() => {
        settingsProvider.getAll().then(setSettings);
    }, []);

    useEffect(() => {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.command === 'settings-updated') {
                settingsProvider.getAll().then(setSettings);
            }
        });
    }, [settingsProvider]);

    const onSettingsChanged = useCallback(
        async <K extends keyof AsbplayerSettings>(key: K, value: AsbplayerSettings[K]) => {
            setSettings((s) => ({ ...s!, [key]: value }));

            await settingsProvider.set({ [key]: value });

            const command: Command<SettingsUpdatedMessage> = {
                sender: 'asbplayer-settings',
                message: {
                    command: 'settings-updated',
                },
            };
            chrome.runtime.sendMessage(command);
        },
        [settingsProvider]
    );

    return { settings, onSettingsChanged };
};