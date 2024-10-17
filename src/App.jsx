import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Space from './pages/Space.jsx';
import Profile from './pages/Profile.jsx'; // Import the Profile component

import { auth } from './firebase/firebase.jsx';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';
import { useEffect, useState } from 'react';

function App() {
  const [user, setUser] = useState(null);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('Auth State Changed:', user); 
      setUser(user);
      setIsFetching(false);
    });

    return () => unsubscribe();
  }, []);

  if (isFetching) {
    return <h2>Loading...</h2>; 
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
        <Route 
          path="/space/profile" 
          element={
            <ProtectedRoute user={user}> {/* Pass user to ProtectedRoute */}
              <Profile user={user} /> {/* Pass user to Profile */}
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;
