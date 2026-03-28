import { useEffect, useCallback } from 'react';

export const useKeyboardShortcuts = (shortcuts) => {
    const handleKeyPress = useCallback((event) => {
        const { key, ctrlKey, metaKey, shiftKey } = event;
        const modifier = ctrlKey || metaKey;

        shortcuts.forEach(({ keys, action, preventDefault = true }) => {
            const [modifierKey, mainKey] = keys.split('+');

            let matches = false;

            if (modifierKey === 'ctrl' && modifier && key.toLowerCase() === mainKey.toLowerCase()) {
                matches = true;
            } else if (modifierKey === 'shift' && shiftKey && key === mainKey) {
                matches = true;
            } else if (!modifierKey && key === mainKey && !modifier && !shiftKey) {
                matches = true;
            }

            if (matches) {
                if (preventDefault) event.preventDefault();
                action(event);
            }
        });
    }, [shortcuts]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [handleKeyPress]);
};
