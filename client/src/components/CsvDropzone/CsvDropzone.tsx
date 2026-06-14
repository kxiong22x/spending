import { useState, useRef } from 'react';
import styles from './CsvDropzone.module.css';

interface CsvDropzoneProps {
  files: File[];
  onFilesAdded: (files: FileList) => void;
  onFileRemoved: (name: string) => void;
}

export default function CsvDropzone({ files, onFilesAdded, onFileRemoved }: CsvDropzoneProps) {
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleDragOver(e: React.DragEvent): void {
    e.preventDefault();
    setDragging(true);
  }

  function handleDragLeave(): void {
    setDragging(false);
  }

  function handleDrop(e: React.DragEvent): void {
    e.preventDefault();
    setDragging(false);
    onFilesAdded(e.dataTransfer.files);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>): void {
    if (e.target.files) onFilesAdded(e.target.files);
    e.target.value = '';
  }

  return (
    <div>
      <div
        className={`${styles.dropzone} ${dragging ? styles.dropzoneDragging : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          multiple
          onChange={handleFileInput}
          style={{ display: 'none' }}
        />
        {files.length > 0 ? (
          <ul className={styles.fileList} onClick={e => e.stopPropagation()}>
            {files.map(f => (
              <li key={f.name} className={styles.fileItem}>
                <span className={styles.fileName}>{f.name}</span>
                <button onClick={() => onFileRemoved(f.name)} className={styles.removeBtn} aria-label={`Remove ${f.name}`}>✕</button>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.dropzoneText}>
            {dragging ? 'Drop files here' : 'Drag & drop CSV files here, or click to select'}
          </p>
        )}
      </div>
    </div>
  );
}
