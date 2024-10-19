import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Space from './pages/Space.jsx';
import Profile from './pages/Profile.jsx'; // Import the Profile component
import Survey from './pages/Survey.jsx'; // Import the Survey component
import AdminConsole from './pages/AdminConsole.jsx'; // Import the AdminConsole component
import { auth, db } from './firebase/firebase.jsx'; // Import db for Firestore access
import { ProtectedRoute } from './components/ProtectedRoute.jsx';
import { useEffect, useState } from 'react';

function App() {
  const [user, setUser] = useState(null);
  const [isFetching, setIsFetching] = useState(true);
  const [surveyCompleted, setSurveyCompleted] = useState(null); // To track survey completion status

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        // Check if the user has completed the survey
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          setSurveyCompleted(userData.surveyCompleted || false); // Default to false if not set
        } else {
          setSurveyCompleted(false); // If no user data, assume survey not completed
        }
      }
      setIsFetching(false); // Finish fetching whether user is authenticated
    });

    return () => unsubscribe();
  }, []);

  if (isFetching) {
    return <h2>Loading...</h2>; // Show loading while fetching auth state
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login user={user} />} />
        <Route path="/register" element={<Register />} />
        
        {/* Conditionally show the Survey or Space depending on survey completion */}
        <Route
          path="/space"
          element={
            <ProtectedRoute user={user}> {/* Pass user to ProtectedRoute */}
              {surveyCompleted ? (
                <Space user={user} /> // If survey is completed, show Space
              ) : (
                <Survey user={user} setSurveyCompleted={setSurveyCompleted} /> // Show Survey if not completed
              )}
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

        {/* Admin Console route, only accessible to the admin with a specific UID */}
        <Route
          path="/space/adminconsole"
          element={
            <ProtectedRoute user={user}> {/* Pass user to ProtectedRoute */}
              {user && user.uid === 'OwrzqbBtwjP6Lx6fzFrnnQ1IaB62' ? (
                <AdminConsole /> // Render AdminConsole if the user is the admin
              ) : (
                <h2>Access Denied</h2> // Show Access Denied for non-admins
              )}
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
