import { useState, useCallback, useRef, useEffect } from 'react';

interface ImageSlot {
  file: File | null;
  existingUrl: string | null;
  previewUrl: string;
}

export function useImageSlots() {
  const [slots, setSlots] = useState<Map<string, ImageSlot>>(new Map());
  const blobUrls = useRef<string[]>([]);

  useEffect(() => {
    return () => {
      blobUrls.current.forEach(URL.revokeObjectURL);
    };
  }, []);

  const addFile = useCallback((ref: string, file: File) => {
    const preview = URL.createObjectURL(file);
    blobUrls.current.push(preview);
    setSlots(
      (prev) =>
        new Map(prev).set(ref, {
          file,
          existingUrl: null,
          previewUrl: preview,
        }),
    );
  }, []);

  const setExistingUrl = useCallback((ref: string, url: string) => {
    setSlots(
      (prev) =>
        new Map(prev).set(ref, { file: null, existingUrl: url, previewUrl: url }),
    );
  }, []);

  const remove = useCallback((ref: string) => {
    setSlots((prev) => {
      const m = new Map(prev);
      m.delete(ref);
      return m;
    });
  }, []);

  const getPreview = useCallback(
    (ref: string): string | null => {
      return slots.get(ref)?.previewUrl ?? null;
    },
    [slots],
  );

  const getUrlForJson = useCallback(
    (ref: string): string => {
      const slot = slots.get(ref);
      if (!slot) return '';
      if (slot.file) return `@file:${ref}`;
      return slot.existingUrl ?? '';
    },
    [slots],
  );

  const appendToFormData = useCallback(
    (fd: FormData) => {
      slots.forEach((slot, ref) => {
        if (slot.file) fd.append(ref, slot.file);
      });
    },
    [slots],
  );

  return {
    slots,
    addFile,
    setExistingUrl,
    remove,
    getPreview,
    getUrlForJson,
    appendToFormData,
  };
}

export type ImageSlots = ReturnType<typeof useImageSlots>;
