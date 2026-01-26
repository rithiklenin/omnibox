import { useAuth } from './context/AuthContext';
import { Login } from './pages/Login';
import { Inbox } from './pages/Inbox';

function App() {
  const { isAuthenticated } = useAuth();

  return isAuthenticated ? <Inbox /> : <Login />;
}

export default App;
