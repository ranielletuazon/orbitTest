import React, { useEffect, useState } from 'react';
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
import LoadingScreen from './pages/LoadingScreen.jsx';
import Spaceship from './pages/Spaceship.jsx'; // Import the Spaceship component
import { auth, db } from './firebase/firebase.jsx'; // Import db for Firestore access
import { ProtectedRoute } from './components/ProtectedRoute.jsx';

function App() {
  const [user, setUser] = useState(null);
  const [isFetching, setIsFetching] = useState(true);
  const [surveyCompleted, setSurveyCompleted] = useState(false); // Initialize to false
  const [isLoadingMinTime, setIsLoadingMinTime] = useState(true); // State to control 3 seconds delay

  // Minimum 3-second loading delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoadingMinTime(false); // After 3 seconds, this becomes false
    }, 1000);

    return () => clearTimeout(timer); // Cleanup the timer if the component unmounts
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        // Check if the user has completed the survey
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          setSurveyCompleted(userData.surveyCompleted || false); // Update survey completion status
        } else {
          setSurveyCompleted(false); // If no user data, assume survey not completed
        }
      } else {
        setSurveyCompleted(false); // Reset survey completion on logout
      }
      setIsFetching(false); // Finish fetching whether user is authenticated
    });

    return () => unsubscribe();
  }, []);

  // Check if either the data is fetching or the minimum 3 seconds has not elapsed
  if (isFetching || isLoadingMinTime) {
    return <LoadingScreen />; // Show loading while fetching auth state and ensure minimum 3 seconds
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

        {/* Add Spaceship route */}
        <Route
          path="/space/ship"
          element={
            <ProtectedRoute user={user}> {/* Pass user to ProtectedRoute */}
              <Spaceship  user={user}/> {/* Render the Spaceship component */}
            </ProtectedRoute>
          }
        />

        {/* Admin Console route, only accessible to the admin with a specific UID */}
        <Route
          path="/space/adminconsole"
          element={
            <ProtectedRoute user={user}> {/* Pass user to ProtectedRoute */}
              {user && user.uid === '9uIKwsGZGbRzKo9SfMnWqD8Vbhu1' ? (
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
