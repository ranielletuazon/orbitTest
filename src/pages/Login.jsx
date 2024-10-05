import React, { useState, useEffect } from 'react';  // Import React, useState, and useEffect
import logo from './assets/logo.png';
import './login.css';
import { Navigate, useNavigate } from 'react-router-dom'; 
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from "../firebase/firebase.jsx";  // Firebase import

function Login({ user }) {
  const navigate = useNavigate();

  // State for email, password, and error message
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(''); // Error state

  // Redirect to "/space" if user is already authenticated
  useEffect(() => {
    if (user) {
      navigate('/space');  // Automatically redirect authenticated users
    }
  }, [user, navigate]);

  const handleRegisterClick = () => {
    navigate('/register');  
  };

  // Sign in with email and password
  const handleSignIn = (e) => {
    e.preventDefault(); // Prevent the default form submission

    if (!email || !password) return;  // Check if inputs are valid
    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        console.log(user);  // Handle successful login
        navigate('/space');  // Redirect after login
        setError(''); // Clear error on successful login
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.log(errorCode, errorMessage);  
        setError('Email Address or Password is invalid'); // Set error message
      });
  };

  // Prevent logged-in users from accessing the login page
  if (user) {
    return <Navigate to="/space" />;
  }

  return (
    <div>
      <header className="header">
        <div className="header-logo">
          <img src={logo} alt="Logo" />  
        </div>
      </header>

      <div className={`center-container ${error ? 'shake' : ''}`}> {/* Add shake class conditionally */}
        <div className="card">
          <div className="card-header">
            <h4>WELCOME BACK!</h4>
            <h5>Best of luck to your games!</h5>
          </div>
          <form className="card-body" onSubmit={handleSignIn}> {/* Handle form submission */}
            <p className="card-title" style={{ color: error ? '#e36f74' : 'inherit' }}>
              EMAIL {error && `- ${error}`} {/* Display error message */}
            </p>
            <input 
              type="email" 
              className="input-box" 
              placeholder="Enter your email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)} 
              required
            />

            <p className="card-title" style={{ color: error ? '#e36f74' : 'inherit' }}>
              PASSWORD {error && `- ${error}`} {/* Display error message */}
            </p>
            <input 
              type="password" 
              className="input-box" 
              placeholder="Enter your password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}  
              required
            />

            <span 
              className="card-title-a" 
              onClick={handleRegisterClick} 
              style={{ cursor: 'pointer', color: '#2cc6ff', textDecoration: 'none', marginTop: 5 }}>
              FORGOT YOUR PASSWORD?
            </span>

            <button type="submit" className="btn btn-primary">  
              Login
            </button> 

            <p className='card-title' style={{ marginTop: 5 }}>
              Need an account?
              <span 
                className="card-title-a" 
                onClick={handleRegisterClick} 
                style={{ cursor: 'pointer', color: '#2cc6ff', textDecoration: 'none', padding: 3 }}>
                REGISTER
              </span>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;
