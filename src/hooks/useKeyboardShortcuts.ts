import { useEffect } from 'react';

type KeyCombo = {
    key: string;
    ctrl?: boolean;
    meta?: boolean;
    shift?: boolean;
    alt?: boolean;
};

export function useKeyboardShortcuts(shortcuts: { combo: KeyCombo; callback: () => void }[]) {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            for (const { combo, callback } of shortcuts) {
                const isKeyMatch = event.key.toLowerCase() === combo.key.toLowerCase();
                const isCtrlMatch = combo.ctrl ? (event.ctrlKey || event.metaKey) : true;
                const isShiftMatch = combo.shift ? event.shiftKey : true;
                const isAltMatch = combo.alt ? event.altKey : true;

                // Explicitly check false if required to be false
                const ctrlRequired = combo.ctrl ?? false;
                const shiftRequired = combo.shift ?? false;
                const altRequired = combo.alt ?? false;

                if (
                    isKeyMatch &&
                    (event.ctrlKey || event.metaKey) === ctrlRequired &&
                    event.shiftKey === shiftRequired &&
                    event.altKey === altRequired
                ) {
                    event.preventDefault();
                    callback();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [shortcuts]);
}
