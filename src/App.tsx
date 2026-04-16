import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from '@/components/general/Layout';
import Home from '@/pages/Home';
import History from '@/pages/History';
import Stats from '@/pages/Stats';
import Profile from '@/pages/Profile';
import CurrentWorkout from '@/pages/CurrentWorkout';
import WorkoutDetail from '@/pages/WorkoutDetail';
import WorkoutSummary from '@/pages/WorkoutSummary';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Summary is full-screen with its own max-w centering — no Layout wrapper */}
        <Route path="/workout/summary" element={<WorkoutSummary />} />

        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/history" element={<History />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/workout/current" element={<CurrentWorkout />} />
          <Route path="/workout/:id" element={<WorkoutDetail />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
