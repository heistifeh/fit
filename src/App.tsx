import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Layout from '@/components/general/Layout';
import Home from '@/pages/Home';
import History from '@/pages/History';
import Stats from '@/pages/Stats';
import Profile from '@/pages/Profile';
import CurrentWorkout from '@/pages/CurrentWorkout';
import WorkoutDetail from '@/pages/WorkoutDetail';
import WorkoutSummary from '@/pages/WorkoutSummary';

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Full-screen — no Layout wrapper */}
        <Route path="/workout/summary" element={<WorkoutSummary />} />

        <Route element={<Layout />}>
          <Route path="/"               element={<Home />} />
          <Route path="/history"        element={<History />} />
          <Route path="/stats"          element={<Stats />} />
          <Route path="/profile"        element={<Profile />} />
          <Route path="/workout/current" element={<CurrentWorkout />} />
          <Route path="/workout/:id"    element={<WorkoutDetail />} />
        </Route>
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AnimatedRoutes />
    </BrowserRouter>
  );
}
