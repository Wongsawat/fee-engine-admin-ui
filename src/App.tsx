import { Routes, Route, Navigate } from 'react-router-dom';
import wpantherLogo from './assets/wpanther-logo.png';
import { AppNav } from './components/AppNav';
import { AuthGuard } from './auth/AuthGuard';
import { ErrorToast } from './components/ErrorToast';
import { RuleListPage } from './pages/RuleListPage';
import { RuleFormPage } from './pages/RuleFormPage';
import { DryRunPage } from './pages/DryRunPage';
import { DraftListPage } from './pages/DraftListPage';
import { DraftNewPage } from './pages/DraftNewPage';
import { DraftDetailPage } from './pages/DraftDetailPage';

export function App() {
  return (
    <AuthGuard>
      <ErrorToast />
      <div className="relative min-h-screen bg-background">
        <img
          src={wpantherLogo}
          aria-hidden="true"
          className="pointer-events-none fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-5 select-none"
        />
        <AppNav />
        <main>
          <Routes>
            <Route path="/" element={<Navigate to="/rules" replace />} />
            <Route path="/rules" element={<RuleListPage />} />
            <Route path="/rules/new" element={<RuleFormPage />} />
            <Route path="/rules/:id" element={<RuleFormPage />} />
            <Route path="/ai-drafts" element={<DraftListPage />} />
            <Route path="/ai-drafts/new" element={<DraftNewPage />} />
            <Route path="/ai-drafts/:id" element={<DraftDetailPage />} />
            <Route path="/dry-run" element={<DryRunPage />} />
            <Route path="*" element={
              <div className="flex h-64 items-center justify-center text-muted-foreground">
                Page not found
              </div>
            } />
          </Routes>
        </main>
      </div>
    </AuthGuard>
  );
}
