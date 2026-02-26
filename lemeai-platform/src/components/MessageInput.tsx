import React, { useState, useRef, useEffect } from 'react';
import { FaPaperPlane, FaPaperclip, FaMicrophone, FaTrash, FaImage, FaTimes, FaLock, FaSmile } from 'react-icons/fa';
import EmojiPicker, { type EmojiClickData, Theme } from 'emoji-picker-react';
import './MessageInput.css';

interface MessageInputProps {
  onSendMessage: (text: string) => void;
  onSendMedia?: (file: File, type: 'image' | 'audio' | 'file') => Promise<void>;
  disabled?: boolean;
  disabledMessage?: string;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage, onSendMedia, disabled, disabledMessage }) => {
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [text]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    if (disabled) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = window.setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Erro ao iniciar gravação:", err);
      alert("Não foi possível acessar o microfone.");
    }
  };

  const stopRecording = (shouldSend: boolean) => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.onstop = async () => {
        if (shouldSend && onSendMedia) {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' }); // ou audio/mp3 dependendo do suporte
          const audioFile = new File([audioBlob], `audio-${Date.now()}.webm`, { type: 'audio/webm' });
          await onSendMedia(audioFile, 'audio');
        }
        // Stop all tracks to release microphone
        mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorderRef.current.stop();
    }

    setIsRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
    // Reset value so same file can be selected again if needed
    e.target.value = '';
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    if (disabled) return;
    if (e.clipboardData.files && e.clipboardData.files.length > 0) {
      const file = e.clipboardData.files[0];
      if (file.type.startsWith('image/')) {
        setSelectedFile(file);
        e.preventDefault(); // Prevent pasting the image binary string into text input
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled) return;
    setShowEmojiPicker(false);

    if (selectedFile && onSendMedia) {
      const type = selectedFile.type.startsWith('image/') ? 'image' : 'file';
      const fileToSend = selectedFile;
      setSelectedFile(null); // Clear UI immediately to prevent double send
      try {
        await onSendMedia(fileToSend, type);
      } catch (error) {
        console.error("Error sending media", error);
        // We could restore the file here if needed, but for now we rely on the toast in ChatPage
      }
    }

    if (text.trim()) {
      onSendMessage(text);
      setText('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'; // Reset height after send
      }
    }
  };

  if (disabled) {
    return (
      <div className="message-input-wrapper disabled-wrapper">
        <div className="disabled-banner">
          <FaLock className="lock-icon" />
          <span>{disabledMessage || "Chat desativado"}</span>
        </div>
      </div>
    );
  }

  if (isRecording) {
    return (
      <div className="message-input-container recording-mode">
        <div className="recording-indicator">
          <FaMicrophone className="recording-icon blink" />
          <span>Gravando... {formatTime(recordingTime)}</span>
        </div>
        <div className="recording-controls">
          <button type="button" className="icon-button cancel-recording" onClick={() => stopRecording(false)}>
            <FaTrash />
          </button>
          <button type="button" className="icon-button send-recording" onClick={() => stopRecording(true)}>
            <FaPaperPlane />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="message-input-wrapper">
      {selectedFile && (
        <div className="selected-file-preview">
          <div className="preview-content">
            {selectedFile.type.startsWith('image/') ? (
              <img src={URL.createObjectURL(selectedFile)} alt="Prévia" className="preview-thumbnail" />
            ) : (
              <div className="preview-thumbnail" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#e5e7eb', color: '#6b7280' }}>
                <FaPaperclip />
              </div>
            )}
            <div className="file-info">
              <span className="file-name" title={selectedFile.name}>{selectedFile.name}</span>
              <span className="file-type">{selectedFile.type || 'Arquivo'}</span>
            </div>
          </div>
          <button className="remove-file-button" onClick={() => setSelectedFile(null)}>
            <FaTimes />
          </button>
        </div>
      )}
      <form className="message-input-container" onSubmit={handleSubmit} style={{ position: 'relative' }}>
        <input
          type="file"
          ref={imageInputRef}
          style={{ display: 'none' }}
          accept="image/*"
          onChange={(e) => handleFileSelect(e)}
        />
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={(e) => handleFileSelect(e)}
        />

        <button
          type="button"
          className="icon-button"
          onClick={() => imageInputRef.current?.click()}
          title="Enviar Imagem"
        >
          <FaImage />
        </button>
        <button
          type="button"
          className="icon-button"
          onClick={() => fileInputRef.current?.click()}
          title="Enviar Arquivo"
        >
          <FaPaperclip />
        </button>

        <button
          type="button"
          className="icon-button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          title="Inserir Emoji"
        >
          <FaSmile />
        </button>

        {showEmojiPicker && (
          <div ref={emojiPickerRef} className="emoji-picker-container">
            <EmojiPicker
              onEmojiClick={(emojiData: EmojiClickData) => {
                setText((prevText) => prevText + emojiData.emoji);
              }}
              theme={Theme.DARK}
              searchPlaceHolder="Pesquisar emoji"
              width={350}
              height={400}
            />
          </div>
        )}

        <div className="input-wrapper">
          <textarea
            ref={textareaRef}
            placeholder="Digite sua mensagem..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onPaste={handlePaste}
            onKeyDown={handleKeyDown}
            rows={1}
            style={{
              resize: 'none',
              overflowY: 'auto',
              minHeight: '24px',
              maxHeight: '120px'
            }}
          />
        </div>

        {text.trim() || selectedFile ? (
          <button
            type="submit"
            className="icon-button send-button"
          >
            <FaPaperPlane />
          </button>
        ) : (
          <button
            type="button"
            className="icon-button record-button"
            onClick={startRecording}
          >
            <FaMicrophone />
          </button>
        )}
      </form>
    </div>
  );
};

export default MessageInput;