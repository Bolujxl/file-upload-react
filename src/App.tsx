import { useState, useRef, useCallback, type DragEvent, type FormEvent, type KeyboardEvent } from 'react'

interface FileItem {
  id: string
  name: string
  size: number
  type: string
  progress: number
  file: File
}

function formatSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '0 B'
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`
}

export default function App() {
  const [files, setFiles] = useState<FileItem[]>([])
  const [uploading, setUploading] = useState(false)
  const [dragover, setDragover] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const addFiles = useCallback((fileList: FileList) => {
    const MAX_SIZE = 50 * 1024 * 1024 // 50MB limit
    const existingNames = new Set(files.map(f => f.name))
    let error = ''

    const incoming: FileItem[] = Array.from(fileList)
      .filter(file => {
        if (existingNames.has(file.name)) {
          error = 'Some files were already added'
          return false
        }
        if (file.size > MAX_SIZE) {
          error = 'Some files are too large (max 50MB)'
          return false
        }
        return true
      })
      .map((file) => ({
        id: crypto.randomUUID(),
        name: file.name,
        size: file.size,
        type: file.type || 'Unknown',
        progress: 0,
        file,
      }))

    if (error) {
      setMessage({ text: error, type: 'error' })
      setTimeout(() => setMessage(null), 3000)
    }

    if (incoming.length > 0) {
      setFiles((prev) => [...prev, ...incoming])
    }
  }, [files])

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragover(false)
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files)
  }, [addFiles])

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragover(true)
  }, [])

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const related = e.relatedTarget
    if (related instanceof Node && !e.currentTarget.contains(related)) {
      setDragover(false)
    }
  }, [])

  const handleBrowse = useCallback(() => {
    inputRef.current?.click()
  }, [])

  const handleChange = useCallback((e: FormEvent<HTMLInputElement>) => {
    const target = e.currentTarget
    if (target.files?.length) addFiles(target.files)
    target.value = ''
  }, [addFiles])

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }, [])

  const handleRemove = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    removeFile(id)
  }, [removeFile])

  const uploadFiles = useCallback(async () => {
    const pending = files.filter(f => f.progress < 100)
    if (!pending.length) return

    setUploading(true)
    try {
      await Promise.all(pending.map(async (f) => {
        for (let p = 10; p <= 100; p += 10) {
          // Randomized speed for staggered progress
          await new Promise((r) => setTimeout(r, Math.random() * 400 + 100))
          setFiles((prev) =>
            prev.map((item) => (item.id === f.id ? { ...item, progress: p } : item))
          )
        }
      }))
    } catch (err) {
      console.error('Upload simulation failed', err)
    } finally {
      setUploading(false)
    }
  }, [files])

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      inputRef.current?.click()
    }
  }, [])

  return (
    <div className="wrapper">
      <div className="card">
        <h1 className="title">upload files</h1>

        <div
          className={`dropzone${dragover ? ' dropzone--active' : ''}`}
          tabIndex={0}
          role="button"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onKeyDown={handleKeyDown}
          onClick={handleBrowse}
        >
          <div className="dropzone__icon">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
          <p className="dropzone__text">
            <span>drag & drop files here</span>
            <span className="dropzone__hint">or click to browse</span>
          </p>
        </div>

        {message && (
          <div className={`message message--${message.type}`}>
            {message.text}
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          multiple
          onChange={handleChange}
          className="hidden-input"
        />

        {files.length > 0 && (
          <ul className="file-list">
            {files.map((f) => (
              <li key={f.id} className="file-item">
                <div className="file-item__info">
                  <span className="file-item__name">{f.name}</span>
                  <span className="file-item__meta">
                    {formatSize(f.size)} &middot; {f.type}
                  </span>
                </div>

                {f.progress > 0 && f.progress < 100 && (
                  <div
                    className="file-item__progress"
                    role="progressbar"
                    aria-valuenow={f.progress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Uploading ${f.name}`}
                  >
                    <div
                      className="file-item__bar"
                      style={{ width: `${f.progress}%` }}
                    />
                  </div>
                )}

                {f.progress === 100 && (
                  <span className="file-item__done">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                )}

                {!uploading && f.progress < 100 && (
                  <button
                    className="file-item__remove"
                    onClick={(e) => handleRemove(e, f.id)}
                    aria-label={`Remove ${f.name}`}
                    title="Remove"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}

        {files.length > 0 && (
          <div className="actions">
            {files.some(f => f.progress < 100) && (
              <button
                className="upload-btn"
                onClick={uploadFiles}
                disabled={uploading}
              >
                {uploading ? 'uploading...' : `upload ${files.filter(f => f.progress === 0).length} file${files.filter(f => f.progress === 0).length !== 1 ? 's' : ''}`}
              </button>
            )}

            {!uploading && files.some(f => f.progress === 100) && (
              <button
                className="clear-btn"
                onClick={() => setFiles([])}
                title="Remove all files"
              >
                clear all
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
