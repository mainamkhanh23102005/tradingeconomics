import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CountryProfile } from './pages/CountryProfile';
import { TradeFlowExplorer } from './pages/TradeFlowExplorer';
import { IndicatorComparison } from './pages/IndicatorComparison';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/country/:iso3" element={<CountryProfile />} />
        <Route path="/trade/:iso3" element={<TradeFlowExplorer />} />
        <Route path="/compare" element={<IndicatorComparison />} />
        <Route path="*" element={<Navigate to="/country/VNM" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

