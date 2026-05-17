import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatMonth, formatDollar } from '../../utils/format';
import useMonthData from '../../hooks/useMonthData';
import useMonths from '../../hooks/useMonths';
import { useCards } from '../../hooks/useCards';
import { CARD_PIE_COLORS } from '../../constants/constants';
import PieChart from '../PieChart/PieChart';
import CategoryColumn from '../CategoryColumn/CategoryColumn';
import NewCategoryPanel from '../NewCategoryPanel/NewCategoryPanel';
import NewExpensePanel from '../NewExpensePanel/NewExpensePanel';
import styles from './MonthDetail.module.css';

export default function MonthDetail({ yearMonth }) {
  const [dragOverCat, setDragOverCat] = useState(null);
  const [hoveredCard, setHoveredCard] = useState(null);
  const navigate = useNavigate();

  const {
    loading,
    transactions,
    categories,
    allCategoryNames,
    customCategories,
    colorMap,
    categoriesWithTxs,
    startDrag,
    cancelDrag,
    dropOnCategory,
    addCategory,
    addTransaction,
    deleteCategory,
    deleteTransaction,
  } = useMonthData(yearMonth);

  const { cards } = useCards();

  const cardColorMap = useMemo(() => Object.fromEntries(
    cards.map((card, i) => [card.name, CARD_PIE_COLORS[i % CARD_PIE_COLORS.length]])
  ), [cards]);

  const highlightedTxIds = useMemo(() => {
    if (!hoveredCard) return new Set();
    const card = cards.find(c => c.name === hoveredCard);
    if (!card) return new Set();
    return new Set(transactions.filter(tx => tx.card_id === card.id).map(tx => tx.id));
  }, [hoveredCard, cards, transactions]);

  const cardsWithSpending = useMemo(() => {
    const cardById = Object.fromEntries(cards.map(c => [c.id, c.name]));
    const totals = {};
    for (const tx of transactions) {
      if (tx.card_id == null) continue;
      const name = cardById[tx.card_id];
      if (!name) continue;
      totals[name] = (totals[name] ?? 0) + tx.amount;
    }
    return Object.entries(totals).map(([name, total]) => ({ name, total }));
  }, [cards, transactions]);

  const { months } = useMonths();
  const sortedMonths = [...months].sort();
  const currentIndex = sortedMonths.indexOf(yearMonth);
  const prevMonth = currentIndex > 0 ? sortedMonths[currentIndex - 1] : null;
  const nextMonth = currentIndex < sortedMonths.length - 1 ? sortedMonths[currentIndex + 1] : null;

  const [year, month] = yearMonth.split('-');
  const label = formatMonth(yearMonth);
  const defaultDate = `${year}-${month}-01`;

  function handleDragOver(e, catName) {
    e.preventDefault();
    setDragOverCat(catName);
  }

  function handleDragLeave(e) {
    if (!e.currentTarget.contains(e.relatedTarget)) setDragOverCat(null);
  }

  function handleDrop(e, toCat) {
    e.preventDefault();
    setDragOverCat(null);
    dropOnCategory(toCat);
  }

  return (
    <div className={styles.detailContainer}>
      <div className={styles.monthNav}>
        {prevMonth ? <button onClick={() => navigate(`/month/${prevMonth}`)} className={styles.navBtn}>← Previous Month</button> : <div />}
        {nextMonth ? <button onClick={() => navigate(`/month/${nextMonth}`)} className={styles.navBtn}>Next Month →</button> : <div />}
      </div>
      <h1 className={styles.pageTitle}>{label}</h1>
      {!loading && <p className={styles.totalSpend}>Total Spending: {formatDollar(transactions.reduce((sum, t) => sum + t.amount, 0))}</p>}

      {loading ? (
        <p className={styles.muted}>Loading…</p>
      ) : (
        <>
          {(categoriesWithTxs.length > 0 || cardsWithSpending.length > 0) && (
            <div className={styles.pieRow}>
              {categoriesWithTxs.length > 0 && (
                <div className={styles.pieCell}>
                  <h2 className={styles.categoriesHeading}>Spending by Category</h2>
                  <PieChart categories={categoriesWithTxs} colorMap={colorMap} />
                </div>
              )}
              {cardsWithSpending.length > 0 && (
                <div className={styles.pieCell}>
                  <h2 className={styles.categoriesHeading}>Spending by Card</h2>
                  <PieChart categories={cardsWithSpending} colorMap={cardColorMap} onSliceHover={setHoveredCard} />
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
              <NewCategoryPanel yearMonth={yearMonth} onAddCategory={addCategory} />
              <NewExpensePanel
                allCategoryNames={allCategoryNames}
                cards={cards}
                onAddTransaction={addTransaction}
                defaultDate={defaultDate}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
