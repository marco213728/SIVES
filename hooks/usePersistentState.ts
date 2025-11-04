import { useState, useEffect, Dispatch, SetStateAction } from 'react';

/**
 * A custom hook that provides a state that persists in localStorage.
 *
 * @param key The key to use for storing the value in localStorage.
 * @param defaultValue The default value to use if no value is found in localStorage.
 * @returns A stateful value, and a function to update it.
 */
export function usePersistentState<T>(key: string, defaultValue: T): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    try {
      const storedValue = window.localStorage.getItem(key);
      if (storedValue) {
        return JSON.parse(storedValue) as T;
      }
    } catch (error) {
      console.error(`Error reading localStorage key “${key}”:`, error);
    }
    return defaultValue;
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error writing to localStorage key “${key}”:`, error);
    }
  }, [key, value]);

  return [value, setValue];
}
