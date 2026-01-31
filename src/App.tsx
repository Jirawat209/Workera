import { useEffect } from 'react';
import { Sidebar } from './components/board/Sidebar'
import { BoardHeader } from './components/board/BoardHeader';
import { useBoardStore } from './store/useBoardStore'
import { Table } from './components/table/Table'
import { useUserStore } from './store/useUserStore';


import { SidePanel } from './components/ui/SidePanel';
import { TaskDetail } from './components/task/TaskDetail';
import { BatchActionsBar } from './components/table/BatchActionsBar';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginPage } from './pages/LoginPage';

import { HomePage } from './pages/HomePage';
import { TopBar } from './components/layout/TopBar';
import { NotificationPage } from './pages/NotificationPage';

function MainApp() {
  const activeBoardId = useBoardStore(state => state.activeBoardId);
  const activePage = useBoardStore(state => state.activePage);
  const navigateTo = useBoardStore(state => state.navigateTo);

  const boards = useBoardStore(state => state.boards);
  const activeItemId = useBoardStore(state => state.activeItemId);
  const setActiveItem = useBoardStore(state => state.setActiveItem);
  const loadUserData = useBoardStore(state => state.loadUserData);
  const isLoading = useBoardStore(state => state.isLoading);
  const subscribeToRealtime = useBoardStore(state => state.subscribeToRealtime);
  const unsubscribeFromRealtime = useBoardStore(state => state.unsubscribeFromRealtime);
  const activeWorkspaceId = useBoardStore(state => state.activeWorkspaceId);
  const activeBoard = boards.find(b => b.id === activeBoardId);
  const { session } = useAuth();
  const setUser = useUserStore(state => state.setUser); // Import setter

  useEffect(() => {
    console.log('MainApp: session changed', session);
    if (session) {
      // Sync UserStore with Supabase Session
      setUser({
        id: session.user.id,
        name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
        email: session.user.email,
        avatar: session.user.user_metadata?.avatar_url,
        role: 'owner' // Simplified for now
      });

      console.log('MainApp: calling loadUserData');
      loadUserData();
    }
  }, [session]);

  // URL Sync and Popstate Handler
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === '/notifications') {
        navigateTo('notifications');
      } else if (path === '/' || path === '') {
        navigateTo('home');
      } else if (path.startsWith('/board/')) {
        // Logic to switch to board from URL would go here if we were doing full hydration from URL
        // For now, we assume store populates it, or we just trust the store state.
        // Ideally, we'd parse the ID and confirm it matches.
      }
    };

    window.addEventListener('popstate', handlePopState);

    // Initial Hydration from URL (Basic)
    const path = window.location.pathname;
    if (path === '/notifications') navigateTo('notifications');

    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (activeWorkspaceId) {
      subscribeToRealtime();

      // Polling Fallback to ensure consistency (30s) - running silently
      const intervalId = setInterval(() => {
        if (!document.hidden) {
          loadUserData(true);
        }
      }, 30000);

      return () => {
        unsubscribeFromRealtime();
        clearInterval(intervalId);
      };
    }
    return () => unsubscribeFromRealtime();
  }, [activeWorkspaceId]);

  if (isLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Loading your workspace...</p>
      </div>
    );
  }

  return (
    <div className="app-container" style={{ height: '100vh', display: 'flex' }}>
      <Sidebar />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: 'hsl(var(--color-bg-canvas))' }}>
        <TopBar />

        {activePage === 'notifications' ? (
          <NotificationPage />
        ) : activePage === 'board' && activeBoard ? (
          <>
            <BoardHeader boardId={activeBoard.id} />
            <div style={{ flex: 1, overflow: 'hidden', padding: '0', display: 'flex', flexDirection: 'column' }}>
              <Table boardId={activeBoard.id} />
            </div>
          </>
        ) : (
          <div style={{ flex: 1, overflow: 'auto' }}>
            <HomePage />
          </div>
        )}

        {/* Task Detail Side Panel */}
        <SidePanel isOpen={!!activeItemId} onClose={() => setActiveItem(null)}>
          {activeItemId && <TaskDetail itemId={activeItemId} onClose={() => setActiveItem(null)} />}
        </SidePanel>

        <BatchActionsBar />
      </main>
    </div>
  )
}

function AppContent() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        Loading...
      </div>
    );
  }

  if (!session) {
    return <LoginPage />;
  }

  return <MainApp />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App; // Ensure export exists

