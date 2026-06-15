import { useMemo } from 'react';
import AnimatedEllipsis from '../AnimatedEllipsis/AnimatedEllipsis';
import { useNavigate } from 'react-router-dom';
import { formatMonth, formatDollar } from '../../utils/format';
import useMonthData from '../../hooks/useMonthData';
import { useCards } from '../../hooks/useCards';
import { useCardSpending } from '../../hooks/useCardSpending';
import { useCategoryHighlight } from '../../hooks/useCategoryHighlight';
import { useMonthNavigation } from '../../hooks/useMonthNavigation';
import PieChart from '../PieChart/PieChart';
import HorizontalBarChart from '../HorizontalBarChart/HorizontalBarChart';
import CategoryColumn from '../CategoryColumn/CategoryColumn';
import NewCategoryPanel from '../NewCategoryPanel/NewCategoryPanel';
import NewExpensePanel from '../NewExpensePanel/NewExpensePanel';
import styles from './MonthDetail.module.css';

interface MonthDetailProps {
  yearMonth: string;
}

export default function MonthDetail({ yearMonth }: MonthDetailProps) {
  const navigate = useNavigate();

  const {
    loading,
    transactions,
    categories,
    allCategoryNames,
    customCategories,
    colorMap,
    categoriesWithTxs,
    totalSpending,
    dragOverCat,
    startDrag,
    cancelDrag,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    addCategory,
    addTransaction,
    deleteCategory,
    deleteTransaction,
  } = useMonthData(yearMonth);

  const { cards } = useCards();
  const { cardColorMap, cardsWithSpending, highlightedTxIds: cardHighlightedTxIds, onCardHover, onCardClick, lockedCard, clearCardLock } = useCardSpending(transactions, cards);
  const { categoryHighlightedTxIds, onCategoryHover, onCategoryClick, lockedCategory, clearCategoryLock } = useCategoryHighlight(transactions);
  const { prevMonth, nextMonth } = useMonthNavigation(yearMonth);

  function handleCategoryHover(name: string | null): void {
    onCategoryHover(name);
    if (name !== null) clearCardLock();
  }

  function handleCategoryClick(name: string): void {
    onCategoryClick(name);
    clearCardLock();
  }

  function handleCardHover(name: string | null): void {
    onCardHover(name);
    if (name !== null) clearCategoryLock();
  }

  function handleCardClick(name: string): void {
    onCardClick(name);
    clearCategoryLock();
  }

  const highlightedTxIds = useMemo(() => {
    if (cardHighlightedTxIds.size > 0) return cardHighlightedTxIds;
    return categoryHighlightedTxIds;
  }, [cardHighlightedTxIds, categoryHighlightedTxIds]);

  return (
    <div className={styles.detailContainer}>
      <div className={styles.monthHeader}>
        <button onClick={() => navigate(`/month/${prevMonth}`)} className={styles.arrowBtn} disabled={!prevMonth}>
          <svg width="20" height="14" viewBox="0 0 20 14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 1 L2 7 L8 13 M2 7 L18 7" />
          </svg>
        </button>
        <h1 className={styles.pageTitle}>{formatMonth(yearMonth)}</h1>
        <button onClick={() => navigate(`/month/${nextMonth}`)} className={styles.arrowBtn} disabled={!nextMonth}>
          <svg width="20" height="14" viewBox="0 0 20 14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 1 L18 7 L12 13 M18 7 L2 7" />
          </svg>
        </button>
      </div>
      {!loading && <p className={styles.totalSpend}>Total Spending: {formatDollar(totalSpending)}</p>}

      {loading ? (
        <p className={styles.muted}>Loading<AnimatedEllipsis /></p>
      ) : (
        <>
          {(categoriesWithTxs.length > 0 || cardsWithSpending.length > 0) && (
            <div className={styles.pieRow}>
              {categoriesWithTxs.length > 0 && (
                <div className={styles.pieCell}>
                  <PieChart title="Spending by Category" categories={categoriesWithTxs} colorMap={colorMap} onSliceHover={handleCategoryHover} onSliceClick={handleCategoryClick} lockedSlice={lockedCategory} />
                </div>
              )}
              {categoriesWithTxs.length > 0 && cardsWithSpending.length > 0 && (
                <div className={styles.verticalDivider} />
              )}
              {cardsWithSpending.length > 0 && (
                <div className={styles.pieCell}>
                  <HorizontalBarChart title="Spending by Card" categories={cardsWithSpending} colorMap={cardColorMap} onSliceHover={handleCardHover} onSliceClick={handleCardClick} lockedSlice={lockedCard} />
                </div>
              )}
            </div>
          )}

          <div className={styles.centeredText}>
            <h2 className={styles.categoriesHeading}>Categories</h2>
            <p className={styles.muted}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.3em', marginBottom: '0.1em' }}>
                <path d="M10 9h4V6h3l-5-5-5 5h3v3zm-1 1H6V7l-5 5 5 5v-3h3v-4zm14 2l-5-5v3h-3v4h3v3l5-5zm-9 3h-4v3H7l5 5 5-5h-3v-3z"/>
              </svg>
              Drag transactions between groups to recategorize
            </p>
          </div>

          <div className={styles.categoryRow}>
            {categories.map(cat => (
              <CategoryColumn
                key={cat.name}
                cat={cat}
                color={colorMap[cat.name]}
                isDragOver={dragOverCat === cat.name}
                isCustom={customCategories.some(c => c.name === cat.name)}
                highlightedTxIds={highlightedTxIds}
                onDragStart={startDrag}
                onDragEnd={cancelDrag}
                onDragOver={e => handleDragOver(e, cat.name)}
                onDragLeave={handleDragLeave}
                onDrop={e => handleDrop(e, cat.name)}
                onDeleteCategory={() => deleteCategory(cat.name)}
                onDeleteTransaction={deleteTransaction}
              />
            ))}

            <div className={styles.rightCol}>
              <NewCategoryPanel onAddCategory={addCategory} />
              <NewExpensePanel
                allCategoryNames={allCategoryNames}
                cards={cards}
                onAddTransaction={addTransaction}
                defaultDate={`${yearMonth}-01`}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
