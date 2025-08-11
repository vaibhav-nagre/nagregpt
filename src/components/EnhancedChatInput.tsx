import { useState, useRef, useEffect } from 'react';
import { 
  StopIcon,
  PaperClipIcon,
  MicrophoneIcon,
  DocumentIcon,
  PhotoIcon,
  XMarkIcon,
  PaperAirplaneIcon
} from '@heroicons/react/24/outline';

interface ChatInputProps {
  onSendMessage: (message: string, files?: File[]) => void;
  isLoading: boolean;
  onStop?: () => void;
  disabled?: boolean;
}

interface AttachedFile {
  file: File;
  preview?: string;
  type: 'image' | 'document';
}

export default function EnhancedChatInput({ onSendMessage, isLoading, onStop, disabled }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';
      
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setMessage(prev => prev + transcript);
        setIsListening(false);
      };
      
      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((message.trim() || attachedFiles.length > 0) && !isLoading && !disabled) {
      const files = attachedFiles.map(af => af.file);
      onSendMessage(message.trim(), files);
      setMessage('');
      setAttachedFiles([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleVoiceInput = () => {
    if (recognitionRef.current && !isListening) {
      setIsListening(true);
      recognitionRef.current.start();
    } else if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }
  };

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;
    
    const newFiles: AttachedFile[] = [];
    Array.from(files).forEach(file => {
      // Better file type detection
      const isImage = file.type.startsWith('image/');
      
      let fileType: 'image' | 'document';
      if (isImage) {
        fileType = 'image';
      } else {
        fileType = 'document';
      }
      
      const attachedFile: AttachedFile = {
        file,
        type: fileType
      };
      
      if (fileType === 'image') {
        const reader = new FileReader();
        reader.onload = (e) => {
          attachedFile.preview = e.target?.result as string;
          setAttachedFiles(prev => [...prev, attachedFile]);
        };
        reader.readAsDataURL(file);
      } else {
        newFiles.push(attachedFile);
      }
    });
    
    if (newFiles.length > 0) {
      setAttachedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileUpload(e.target.files);
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileUpload(e.dataTransfer.files);
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  return (
    <div className="sticky bottom-0 bg-white/95 dark:bg-gpt-gray-800/95 backdrop-blur-md border-t border-gray-200/50 dark:border-gpt-gray-600/50">
      <div className="max-w-4xl mx-auto px-2 sm:px-4 py-2 sm:py-3">
        
        {/* File Previews */}
        {attachedFiles.length > 0 && (
          <div className="mb-2 sm:mb-3 flex flex-wrap gap-1 sm:gap-2 animate-fade-in">
            {attachedFiles.map((attachedFile, index) => {
              const file = attachedFile.file;
              const isLogFile = file.name.toLowerCase().includes('.log');
              const isPDF = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
              const isTextFile = file.type.startsWith('text/') || 
                               file.name.toLowerCase().match(/\.(txt|csv|json|xml|yaml|yml|md|js|ts|py|java|cpp|c|h|html|css|sql|sh|bat|conf|ini)$/);
              
              const formatFileSize = (bytes: number): string => {
                if (bytes === 0) return '0 Bytes';
                const k = 1024;
                const sizes = ['Bytes', 'KB', 'MB', 'GB'];
                const i = Math.floor(Math.log(bytes) / Math.log(k));
                return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
              };

              return (
                <div key={index} className="relative bg-gray-100 dark:bg-gray-700 rounded-lg p-2 sm:p-3 flex items-start space-x-2 sm:space-x-3 animate-slide-in-up min-w-32 sm:min-w-48 max-w-48 sm:max-w-64">
                  <div className="flex-shrink-0">
                    {attachedFile.type === 'image' && attachedFile.preview ? (
                      <img src={attachedFile.preview} alt="Preview" className="w-8 h-8 sm:w-10 sm:h-10 rounded object-cover" />
                    ) : isPDF ? (
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-100 dark:bg-red-900 rounded flex items-center justify-center">
                        <DocumentIcon className="w-4 h-4 sm:w-6 sm:h-6 text-red-600 dark:text-red-400" />
                      </div>
                    ) : isLogFile ? (
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 dark:bg-blue-900 rounded flex items-center justify-center">
                        <DocumentIcon className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                    ) : isTextFile ? (
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 dark:bg-green-900 rounded flex items-center justify-center">
                        <DocumentIcon className="w-4 h-4 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 dark:bg-gray-600 rounded flex items-center justify-center">
                        <DocumentIcon className="w-4 h-4 sm:w-6 sm:h-6 text-gray-500" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatFileSize(file.size)}
                      {isPDF && ' • PDF'}
                      {isLogFile && ' • Log File'}
                      {isTextFile && !isLogFile && ' • Text File'}
                      {attachedFile.type === 'image' && ' • Image'}
                    </p>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="flex-shrink-0 text-gray-400 hover:text-red-500 transition-colors p-1"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Drag & Drop Overlay */}
        {isDragOver && (
          <div className="absolute inset-0 bg-blue-500/20 border-2 border-dashed border-blue-500 rounded-lg flex items-center justify-center z-10">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg">
              <PhotoIcon className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <p className="text-sm text-gray-600 dark:text-gray-400">Drop files here to upload</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex items-end space-x-2 sm:space-x-3">
          {/* Enhanced textarea with drag & drop */}
          <div 
            className={`flex-1 relative file-upload-zone transition-all duration-300 ${isDragOver ? 'scale-102' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="relative flex items-center bg-white dark:bg-gpt-gray-700 rounded-2xl sm:rounded-3xl border border-gray-300 dark:border-gpt-gray-600 shadow-lg hover:shadow-xl transition-all duration-200">
              
              {/* File upload button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
                className="flex-shrink-0 p-1.5 sm:p-2 ml-2 sm:ml-3 text-gray-400 dark:text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gpt-gray-600 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                title="Upload files"
              >
                <PaperClipIcon className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
              
              {/* Text input */}
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={disabled ? "Please wait..." : isListening ? "Listening..." : "Message NagreGPT..."}
                disabled={disabled}
                className="flex-1 resize-none border-0 bg-transparent px-2 sm:px-3 py-2 sm:py-3 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed text-sm max-h-32"
                rows={1}
              />
              
              {/* Voice input button */}
              <button
                type="button"
                onClick={handleVoiceInput}
                disabled={disabled}
                className={`flex-shrink-0 p-1.5 sm:p-2 mr-1 sm:mr-2 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  isListening 
                    ? 'text-red-500 bg-red-100 dark:bg-red-900 recording-pulse' 
                    : 'text-gray-400 dark:text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gpt-gray-600'
                }`}
                title={isListening ? "Stop listening" : "Voice input"}
              >
                <MicrophoneIcon className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>

          {/* Send/Stop button */}
          {isLoading ? (
            <button
              type="button"
              onClick={onStop}
              className="flex-shrink-0 p-2 sm:p-3 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover-lift"
              title="Stop generation"
            >
              <StopIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={(!message.trim() && attachedFiles.length === 0) || disabled}
              className="flex-shrink-0 p-2 sm:p-3 bg-gradient-to-r from-gpt-green-500 to-gpt-blue-500 hover:from-gpt-green-600 hover:to-gpt-blue-600 disabled:from-gray-300 disabled:to-gray-400 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover-lift"
              title="Send message"
            >
              <PaperAirplaneIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}
        </form>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.pdf,.doc,.docx,.txt,.md,.log,.csv,.json,.xml,.yaml,.yml,.js,.ts,.py,.java,.cpp,.c,.h,.html,.css,.sql,.sh,.bat,.conf,.ini"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  );
}
