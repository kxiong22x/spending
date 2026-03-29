import { useParams, useNavigate, Navigate } from 'react-router-dom';
import MonthDetail from '../../components/MonthDetail/MonthDetail';
import NewMonthForm from '../../components/NewMonthForm/NewMonthForm';

const YEAR_MONTH_REGEX = /^\d{4}-\d{2}$/;

export default function MonthPage() {
  const { yearMonth } = useParams();
  const navigate = useNavigate();

  if (yearMonth === 'new') {
    return <NewMonthForm onSuccess={ym => navigate(`/month/${ym}`)} />;
  }

  if (!YEAR_MONTH_REGEX.test(yearMonth)) {
    return <Navigate to="/" replace />;
  }

  return <MonthDetail yearMonth={yearMonth} />;
}
