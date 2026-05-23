import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip } from 'lucide-react';

interface MessageInputProps {
  onSendMessage: (text: string) => Promise<void>;
  onTyping: () => void;
  disabled?: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage, onTyping, disabled }) => {
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [text]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || isSending || disabled) return;

    try {
      setIsSending(true);
      await onSendMessage(text);
      setText('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'; // Reset height
      }
    } catch (error) {
      console.error('Failed to send message', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    onTyping();
  };

  return (
    <form 
      onSubmit={handleSubmit}
      className="flex items-end gap-2 p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800"
    >
      <button
        type="button"
        disabled={disabled}
        className="p-2 text-gray-400 hover:text-blue-600 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50"
      >
        <Paperclip className="w-5 h-5" />
      </button>

      <textarea
        ref={textareaRef}
        value={text}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        disabled={disabled || isSending}
        placeholder="Type a message..."
        className="flex-1 max-h-[120px] min-h-[44px] py-[10px] px-5 bg-slate-100 dark:bg-slate-800 border-0 focus:ring-0 focus:outline-none resize-none rounded-3xl text-[15px] text-slate-900 dark:text-white placeholder-slate-400"
        rows={1}
      />

      <button
        type="submit"
        disabled={!text.trim() || isSending || disabled}
        className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:hover:bg-blue-600 flex-shrink-0"
      >
        <Send className="w-4 h-4" />
      </button>
    </form>
  );
};
