import { useState, useRef } from 'react';
import styles from './CsvDropzone.module.css';

export default function CsvDropzone({ files, onFilesAdded, onFileRemoved }) {
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef(null);

  function handleDragOver(e) {
    e.preventDefault();
    setDragging(true);
  }

  function handleDragLeave() {
    setDragging(false);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    onFilesAdded(e.dataTransfer.files);
  }

  function handleFileInput(e) {
    onFilesAdded(e.target.files);
    e.target.value = '';
  }

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Upload CSVs</h2>
      <p className={styles.sectionHint}>Only transactions within the selected month will be imported. Transactions from other months will be ignored.</p>
      <div
        className={`${styles.dropzone} ${dragging ? styles.dropzoneDragging : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current.click()}
      >
        <p className={styles.dropzoneText}>
          {dragging ? 'Drop files here' : 'Drag & drop CSV files here, or click to select'}
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          multiple
          onChange={handleFileInput}
          style={{ display: 'none' }}
        />
      </div>

      {files.length > 0 && (
        <ul className={styles.fileList}>
          {files.map(f => (
            <li key={f.name} className={styles.fileItem}>
              <span>{f.name}</span>
              <button onClick={() => onFileRemoved(f.name)} className={styles.removeBtn} aria-label={`Remove ${f.name}`}>✕</button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
