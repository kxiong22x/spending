import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { YEAR_MONTH_REGEX } from '../../constants/constants';
import MonthDetail from '../../components/MonthDetail/MonthDetail';
import NewMonthForm from '../../components/NewMonthForm/NewMonthForm';

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
