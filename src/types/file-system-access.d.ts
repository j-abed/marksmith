interface FileSystemWritableFileStream extends WritableStream {
  write(data: string | BufferSource | Blob): Promise<void>
  close(): Promise<void>
}

interface FileSystemFileHandle {
  createWritable(): Promise<FileSystemWritableFileStream>
  getFile(): Promise<File>
}

interface OpenFilePickerOptions {
  multiple?: boolean
  types?: Array<{
    description?: string
    accept: Record<string, string[]>
  }>
}

interface SaveFilePickerOptions {
  suggestedName?: string
  types?: Array<{
    description?: string
    accept: Record<string, string[]>
  }>
}

interface Window {
  showOpenFilePicker?: (
    options?: OpenFilePickerOptions,
  ) => Promise<FileSystemFileHandle[]>
  showSaveFilePicker?: (
    options?: SaveFilePickerOptions,
  ) => Promise<FileSystemFileHandle>
}
