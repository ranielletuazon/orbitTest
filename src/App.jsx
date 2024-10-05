import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Space from './pages/Space.jsx';

import { auth } from './firebase/firebase.jsx';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';
import { useEffect, useState } from 'react';

function App() {
  const [user, setUser] = useState(null);
  const [isFetching, setIsFetching] = useState(true); // Initialize fetching state

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('Auth State Changed:', user); // Log user state
      setUser(user); // Set user state to the authenticated user or null if not authenticated
      setIsFetching(false); // Update fetching state regardless of authentication
    });

    return () => unsubscribe(); // Cleanup listener
  }, []);

  if (isFetching) {
    return <h2>Loading...</h2>; // Show loading state while checking auth
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login user={user} />} />
        <Route path="/register" element={<Register />} />
        <Route 
          path="/space" 
          element={
            <ProtectedRoute user={user}> {/* Pass user to ProtectedRoute */}
              <Space user={user} /> {/* Pass user to Space */}
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;
