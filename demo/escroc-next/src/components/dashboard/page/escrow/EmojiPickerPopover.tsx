"use client";

import EmojiPicker, { EmojiStyle, Theme } from "emoji-picker-react";

/**
 * Thin wrapper around emoji-picker-react. Loaded lazily (client-only) from the
 * conversation composer so the picker chunk stays out of the initial bundle.
 * Native emoji style → no external CDN image requests.
 */
export default function EmojiPickerPopover({ onPick }: { onPick: (emoji: string) => void }) {
  return (
    <EmojiPicker
      onEmojiClick={(data) => onPick(data.emoji)}
      theme={Theme.AUTO}
      emojiStyle={EmojiStyle.NATIVE}
      width={300}
      height={380}
      previewConfig={{ showPreview: false }}
      skinTonesDisabled
    />
  );
}
