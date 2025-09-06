import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import SalaryCalculatorPage from "./pages/SalaryCalculatorPage";
import UnemploymentSimulatorPage from "./pages/UnemploymentSimulatorPage";
import OvertimeCalculatorPage from "./pages/OvertimeCalculatorPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import { EditCalculationPage } from "./pages/EditCalculationPage";
import { EditTimeEntriesPage } from "./pages/EditTimeEntriesPage";
import { EditResultsPage } from "./pages/EditResultsPage";
import { ProfilePage } from "./pages/ProfilePage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/calculadora-salario" element={<SalaryCalculatorPage />} />
          <Route path="/simulador-seguro-desemprego" element={<UnemploymentSimulatorPage />} />
          <Route path="/horas-extras" element={<OvertimeCalculatorPage />} />
          <Route path="/painel-administrativo" element={<AdminDashboardPage />} />
          <Route path="/horas-extras/editar/:id" element={<EditCalculationPage />} />
          <Route path="/horas-extras/editar-horarios/:id" element={<EditTimeEntriesPage />} />
          <Route path="/horas-extras/resultados/:id" element={<EditResultsPage />} />
          <Route path="/horas-extras/perfil" element={<ProfilePage />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
