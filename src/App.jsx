import { useState, useRef, useCallback } from 'react'

function formatSize(bytes) {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`
}

export default function App() {
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [dragover, setDragover] = useState(false)
  const inputRef = useRef(null)

  const addFiles = useCallback((fileList) => {
    const incoming = Array.from(fileList).map((file) => ({
      id: crypto.randomUUID(),
      name: file.name,
      size: file.size,
      type: file.type || 'Unknown',
      progress: 0,
      file,
    }))
    setFiles((prev) => [...prev, ...incoming])
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragover(false)
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files)
  }, [addFiles])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    setDragover(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    setDragover(false)
  }, [])

  const handleBrowse = () => inputRef.current?.click()

  const handleChange = (e) => {
    if (e.target.files.length) addFiles(e.target.files)
    e.target.value = ''
  }

  const removeFile = (id) => {
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }

  const uploadFiles = async () => {
    if (!files.length) return
    setUploading(true)

    for (const f of files) {
      for (let p = 0; p <= 100; p += 10) {
        await new Promise((r) => setTimeout(r, 80))
        setFiles((prev) =>
          prev.map((item) => (item.id === f.id ? { ...item, progress: p } : item))
        )
      }
    }

    setUploading(false)
  }

  return (
    <div className="wrapper">
      <div className="card">
        <h1 className="title">upload files</h1>

        <div
          className={`dropzone${dragover ? ' dropzone--active' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
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
                  <div className="file-item__progress">
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

                {!uploading && f.progress === 0 && (
                  <button
                    className="file-item__remove"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeFile(f.id)
                    }}
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
          <button
            className="upload-btn"
            onClick={uploadFiles}
            disabled={uploading}
          >
            {uploading ? 'uploading...' : `upload ${files.length} file${files.length > 1 ? 's' : ''}`}
          </button>
        )}
      </div>
    </div>
  )
}
