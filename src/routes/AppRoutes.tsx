import React, { Suspense } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { obtenerSesion } from '../services/authService';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { PageLoader } from '../components/PageLoader';
import { LoginForm } from '../components/LoginForm';
import { Dashboard } from '../components/Dashboard';
import { PATHS } from './paths';

const SolicitarServicio = React.lazy(() =>
  import('../components/SolicitarServicio').then((m) => ({ default: m.SolicitarServicio }))
);
const AreaManagement = React.lazy(() =>
  import('../components/AreaManagement').then((m) => ({ default: m.AreaManagement }))
);
const CentroCostosManagement = React.lazy(() =>
  import('../components/CentroCostosManagement').then((m) => ({
    default: m.CentroCostosManagement,
  }))
);
const PersonalManagement = React.lazy(() =>
  import('../components/PersonalManagement').then((m) => ({ default: m.PersonalManagement }))
);
const ServiciosPersonal = React.lazy(() =>
  import('../components/ServiciosPersonal').then((m) => ({ default: m.ServiciosPersonal }))
);
const MisServicios = React.lazy(() =>
  import('../components/MisServicios').then((m) => ({ default: m.MisServicios }))
);
const Historial = React.lazy(() =>
  import('../components/Historial').then((m) => ({ default: m.Historial }))
);
const HistorialPersonal = React.lazy(() =>
  import('../components/HistorialPersonal').then((m) => ({ default: m.HistorialPersonal }))
);
const ValidarServicios = React.lazy(() =>
  import('../components/ValidarServicios').then((m) => ({ default: m.ValidarServicios }))
);
const VerificarServicios = React.lazy(() =>
  import('../components/VerificarServicios').then((m) => ({ default: m.VerificarServicios }))
);
const Perfil = React.lazy(() =>
  import('../components/Perfil').then((m) => ({ default: m.Perfil }))
);

const useVolverHome = () => {
  const navigate = useNavigate();
  return () => navigate(PATHS.home);
};

/** `/` → dashboard si hay sesión, si no → login */
const RootRedirect: React.FC = () => {
  const session = obtenerSesion();
  return <Navigate to={session?.key ? PATHS.home : PATHS.login} replace />;
};

const LoginPage: React.FC = () => {
  const session = obtenerSesion();
  if (session?.key) return <Navigate to={PATHS.home} replace />;
  return <LoginForm />;
};

const FallbackHome: React.FC = () => {
  const session = obtenerSesion();
  return <Navigate to={session?.key ? PATHS.home : PATHS.login} replace />;
};

const SolicitarPage: React.FC = () => {
  const navigate = useNavigate();
  const onVolver = useVolverHome();
  return (
    <Suspense fallback={<PageLoader message="Cargando solicitud de servicio..." />}>
      <SolicitarServicio
        onVolver={onVolver}
        onNavegar={(vista) => {
          if (vista === 'mis-servicios') navigate(PATHS.misServicios);
          else navigate(PATHS.home);
        }}
      />
    </Suspense>
  );
};

const withVolver = (
  Component: React.ComponentType<{ onVolver: () => void }>,
  message: string
) => {
  const Page: React.FC = () => {
    const onVolver = useVolverHome();
    return (
      <Suspense fallback={<PageLoader message={message} />}>
        <Component onVolver={onVolver} />
      </Suspense>
    );
  };
  Page.displayName = `Route(${Component.name || 'Page'})`;
  return Page;
};

const AreaPage = withVolver(AreaManagement, 'Cargando gestión de áreas...');
const CentroCostosPage = withVolver(
  CentroCostosManagement,
  'Cargando gestión de centros de costos...'
);
const PersonalPage = withVolver(PersonalManagement, 'Cargando gestión de personal...');
const ServiciosPersonalPage = withVolver(
  ServiciosPersonal,
  'Cargando servicios del personal...'
);
const MisServiciosPage = withVolver(MisServicios, 'Cargando mis servicios...');
const HistorialPage = withVolver(Historial, 'Cargando historial...');
const HistorialPersonalPage = withVolver(
  HistorialPersonal,
  'Cargando historial del personal...'
);
const ValidarServiciosPage = withVolver(
  ValidarServicios,
  'Cargando validación de servicios...'
);
const VerificarServiciosPage = withVolver(
  VerificarServicios,
  'Cargando verificación de servicios...'
);
const PerfilPage = withVolver(Perfil, 'Cargando perfil...');

/**
 * Rutas reales de la app. Cada tarjeta del dashboard cambia la URL.
 */
export const AppRoutes: React.FC = () => (
  <Routes>
    <Route path={PATHS.root} element={<RootRedirect />} />
    <Route path={PATHS.login} element={<LoginPage />} />

    <Route
      path={PATHS.home}
      element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      }
    />
    <Route
      path={PATHS.solicitar}
      element={
        <ProtectedRoute>
          <SolicitarPage />
        </ProtectedRoute>
      }
    />
    <Route
      path={PATHS.misServicios}
      element={
        <ProtectedRoute>
          <MisServiciosPage />
        </ProtectedRoute>
      }
    />
    <Route
      path={PATHS.historial}
      element={
        <ProtectedRoute>
          <HistorialPage />
        </ProtectedRoute>
      }
    />
    <Route
      path={PATHS.perfil}
      element={
        <ProtectedRoute>
          <PerfilPage />
        </ProtectedRoute>
      }
    />
    <Route
      path={PATHS.serviciosPersonal}
      element={
        <ProtectedRoute>
          <ServiciosPersonalPage />
        </ProtectedRoute>
      }
    />
    <Route
      path={PATHS.historialPersonal}
      element={
        <ProtectedRoute>
          <HistorialPersonalPage />
        </ProtectedRoute>
      }
    />
    <Route
      path={PATHS.validarServicios}
      element={
        <ProtectedRoute>
          <ValidarServiciosPage />
        </ProtectedRoute>
      }
    />
    <Route
      path={PATHS.verificarServicios}
      element={
        <ProtectedRoute>
          <VerificarServiciosPage />
        </ProtectedRoute>
      }
    />
    <Route
      path={PATHS.personal}
      element={
        <ProtectedRoute>
          <PersonalPage />
        </ProtectedRoute>
      }
    />
    <Route
      path={PATHS.centroCostos}
      element={
        <ProtectedRoute>
          <CentroCostosPage />
        </ProtectedRoute>
      }
    />
    <Route
      path={PATHS.area}
      element={
        <ProtectedRoute>
          <AreaPage />
        </ProtectedRoute>
      }
    />

    <Route path="*" element={<FallbackHome />} />
  </Routes>
);
