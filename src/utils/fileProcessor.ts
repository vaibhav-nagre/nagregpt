export interface FileAnalysis {
  filename: string;
  type: string;
  size: number;
  content: string;
  summary?: string;
}

export class FileProcessor {
  // Extract text content from different file types
  static async processFile(file: File): Promise<FileAnalysis> {
    const analysis: FileAnalysis = {
      filename: file.name,
      type: file.type || this.getFileTypeFromExtension(file.name),
      size: file.size,
      content: ''
    };

    try {
      if (file.type.startsWith('text/') || this.isTextFile(file.name)) {
        // Handle text files (logs, txt, csv, etc.)
        analysis.content = await this.readTextFile(file);
      } else if (file.type === 'application/pdf') {
        // Handle PDF files
        analysis.content = await this.readPDFFile(file);
      } else if (file.type.startsWith('image/')) {
        // Handle images (OCR could be added later)
        analysis.content = `[Image file: ${file.name}]`;
        analysis.summary = `Image file uploaded. Filename: ${file.name}, Size: ${this.formatFileSize(file.size)}`;
      } else {
        // Handle other file types
        analysis.content = `[File: ${file.name}]`;
        analysis.summary = `File uploaded. Filename: ${file.name}, Type: ${file.type}, Size: ${this.formatFileSize(file.size)}`;
      }

      // Generate a summary for large files
      if (analysis.content.length > 1000) {
        analysis.summary = this.generateFileSummary(analysis);
      }

    } catch (error) {
      console.error('Error processing file:', error);
      analysis.content = `[Error reading file: ${file.name}]`;
      analysis.summary = `Unable to read file content. Filename: ${file.name}`;
    }

    return analysis;
  }

  // Read text files
  private static async readTextFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        resolve(content);
      };
      reader.onerror = () => reject(new Error('Failed to read text file'));
      reader.readAsText(file);
    });
  }

  // Read PDF files (basic implementation)
  private static async readPDFFile(file: File): Promise<string> {
    try {
      // For now, we'll use a basic approach. In a production app, you'd want to use pdf-parse or similar
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const textDecoder = new TextDecoder('utf-8');
      const text = textDecoder.decode(uint8Array);
      
      // Try to extract readable text (very basic)
      const readableText = text.match(/[a-zA-Z0-9\s\.,!?;:'"()-]+/g)?.join(' ') || '';
      
      if (readableText.length > 50) {
        return readableText;
      } else {
        return `[PDF file: ${file.name}] - Content extraction requires server-side processing for better results.`;
      }
    } catch (error) {
      return `[PDF file: ${file.name}] - Unable to extract text content. Please describe what you'd like me to analyze about this PDF.`;
    }
  }

  // Check if file is a text file based on extension
  private static isTextFile(filename: string): boolean {
    const textExtensions = [
      '.txt', '.log', '.csv', '.json', '.xml', '.yaml', '.yml', 
      '.md', '.js', '.ts', '.py', '.java', '.cpp', '.c', '.h',
      '.html', '.css', '.sql', '.sh', '.bat', '.conf', '.ini'
    ];
    const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    return textExtensions.includes(extension);
  }

  // Get file type from extension
  private static getFileTypeFromExtension(filename: string): string {
    const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    const typeMap: { [key: string]: string } = {
      '.txt': 'text/plain',
      '.log': 'text/plain',
      '.csv': 'text/csv',
      '.json': 'application/json',
      '.xml': 'application/xml',
      '.pdf': 'application/pdf',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif'
    };
    return typeMap[extension] || 'application/octet-stream';
  }

  // Format file size
  private static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Generate file summary
  private static generateFileSummary(analysis: FileAnalysis): string {
    const { filename, type, size, content } = analysis;
    const preview = content.substring(0, 500) + (content.length > 500 ? '...' : '');
    
    return `File: ${filename} (${this.formatFileSize(size)})
Type: ${type}
Content preview: ${preview}`;
  }

  // Create a formatted message for the AI with file context
  static createFileAnalysisPrompt(userMessage: string, fileAnalyses: FileAnalysis[]): string {
    if (fileAnalyses.length === 0) {
      return userMessage;
    }

    let prompt = `User message: ${userMessage}\n\n`;
    prompt += `I have attached ${fileAnalyses.length} file(s) for analysis:\n\n`;

    fileAnalyses.forEach((analysis, index) => {
      prompt += `File ${index + 1}: ${analysis.filename}\n`;
      prompt += `Type: ${analysis.type}\n`;
      prompt += `Size: ${FileProcessor.formatFileSize(analysis.size)}\n`;
      
      if (analysis.summary) {
        prompt += `Summary: ${analysis.summary}\n`;
      }
      
      if (analysis.content && analysis.content.length > 0 && !analysis.content.startsWith('[')) {
        // Only include content if it's actual readable text
        const contentPreview = analysis.content.length > 2000 
          ? analysis.content.substring(0, 2000) + '\n... (content truncated for brevity)'
          : analysis.content;
        prompt += `Content:\n${contentPreview}\n`;
      }
      
      prompt += '\n---\n\n';
    });

    prompt += `Please analyze the uploaded file(s) and provide insights based on the user's request. If the files contain logs, help identify issues, patterns, or important information. If they contain data, help analyze trends or key findings.`;

    return prompt;
  }
}
