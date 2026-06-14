import { useMemo } from 'react';
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
  const { cardColorMap, cardsWithSpending, highlightedTxIds: cardHighlightedTxIds, onCardHover } = useCardSpending(transactions, cards);
  const { categoryHighlightedTxIds, onCategoryHover } = useCategoryHighlight(transactions);
  const { prevMonth, nextMonth } = useMonthNavigation(yearMonth);

  const highlightedTxIds = useMemo(() => {
    if (cardHighlightedTxIds.size > 0) return cardHighlightedTxIds;
    return categoryHighlightedTxIds;
  }, [cardHighlightedTxIds, categoryHighlightedTxIds]);

  return (
    <div className={styles.detailContainer}>
      <div className={styles.monthNav}>
        {prevMonth ? <button onClick={() => navigate(`/month/${prevMonth}`)} className={styles.navBtn}>← Previous Month</button> : <div />}
        {nextMonth ? <button onClick={() => navigate(`/month/${nextMonth}`)} className={styles.navBtn}>Next Month →</button> : <div />}
      </div>
      <h1 className={styles.pageTitle}>{formatMonth(yearMonth)}</h1>
      {!loading && <p className={styles.totalSpend}>Total Spending: {formatDollar(totalSpending)}</p>}

      {loading ? (
        <p className={styles.muted}>Loading…</p>
      ) : (
        <>
          {(categoriesWithTxs.length > 0 || cardsWithSpending.length > 0) && (
            <div className={styles.pieRow}>
              {categoriesWithTxs.length > 0 && (
                <div className={styles.pieCell}>
                  <PieChart title="Spending by Category" categories={categoriesWithTxs} colorMap={colorMap} onSliceHover={onCategoryHover} />
                </div>
              )}
              {cardsWithSpending.length > 0 && (
                <div className={styles.pieCell}>
                  <HorizontalBarChart title="Spending by Card" categories={cardsWithSpending} colorMap={cardColorMap} onSliceHover={onCardHover} />
                </div>
              )}
            </div>
          )}

          <div className={styles.centeredText}>
            <h2 className={styles.categoriesHeading}>Categories</h2>
            <p className={styles.muted}>You can drag and drop transactions between categories.</p>
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
