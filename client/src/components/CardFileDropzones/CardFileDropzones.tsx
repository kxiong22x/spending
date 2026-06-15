import { ReactNode } from 'react';
import { Card } from '@shared/types';
import CsvDropzone from '../CsvDropzone/CsvDropzone';
import AnimatedEllipsis from '../AnimatedEllipsis/AnimatedEllipsis';
import styles from './CardFileDropzones.module.css';

interface CardFileDropzonesProps {
  cards: Card[];
  loading: boolean;
  cardFiles: Record<number, File[]>;
  onFilesAdded: (cardId: number, files: FileList) => void;
  onFileRemoved: (cardId: number, name: string) => void;
  disabled?: boolean;
  noCardsMessage: ReactNode;
}

// Renders a per-card CSV dropzone list, handling loading and empty-card states.
export default function CardFileDropzones({ cards, loading, cardFiles, onFilesAdded, onFileRemoved, disabled, noCardsMessage }: CardFileDropzonesProps) {
  if (loading) return <p>Loading cards<AnimatedEllipsis /></p>;
  if (cards.length === 0) return <p className={styles.noCards}>No cards registered. {noCardsMessage}</p>;

  return (
    <div className={styles.cardRows}>
      {cards.map(card => (
        <div key={card.id} className={styles.cardRow}>
          <span className={styles.cardName}>{card.name}</span>
          <div className={styles.dropzoneWrapper}>
            <CsvDropzone
              files={cardFiles[card.id] ?? []}
              onFilesAdded={files => !disabled && onFilesAdded(card.id, files)}
              onFileRemoved={name => !disabled && onFileRemoved(card.id, name)}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
