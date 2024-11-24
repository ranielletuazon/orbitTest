import React, { useState, useEffect } from 'react';  
import logo from './assets/logo.png';
import './login.css';
import { Navigate, useNavigate } from 'react-router-dom'; 
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from "../firebase/firebase.jsx";  
import { ClipLoader } from 'react-spinners';  
import { doc, updateDoc } from 'firebase/firestore'; // Import updateDoc
import { db } from "../firebase/firebase.jsx"; // Import db for Firestore access

function Login({ user }) {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(''); 
  const [loading, setLoading] = useState(false); 

  useEffect(() => {
    if (user) {
      navigate('/space');  
    }
  }, [user, navigate]);

  const handleRegisterClick = () => {
    navigate('/register');  
  };

  const handleSignIn = (e) => {
    e.preventDefault(); 

    if (!email || !password) return;  

    setLoading(true);  
    signInWithEmailAndPassword(auth, email, password)
      .then(async (userCredential) => {
        const user = userCredential.user;
        console.log(user);  

        // Update the user's isOnline status in Firestore
        const userDocRef = doc(db, 'users', user.uid);
        await updateDoc(userDocRef, {
          'userStatus.isOnline': true // Set isOnline to true
        });

        navigate('/space');  
        setError(''); 
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.log(errorCode, errorMessage);  
        setError('Email Address or Password is invalid'); 
      })
      .finally(() => {
        setLoading(false);  
      });
  };

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

      <div className={`center-container ${error ? 'shake' : ''}`}>
        <div className="card">
          <div className="card-header">
            <h4>WELCOME BACK!</h4>
            <h5>Best of luck to your games!</h5>
          </div>
          <form className="card-body" onSubmit={handleSignIn}>
            <p className="card-title" style={{ color: error ? '#e36f74' : 'inherit' }}>
              EMAIL {error && `- ${error}`} 
            </p>
            <input 
              type="email" 
              className="input-box" 
              placeholder="Enter your email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)} 
              required
              disabled={loading} 
            />

            <p className="card-title" style={{ color: error ? '#e36f74' : 'inherit' }}>
              PASSWORD {error && `- ${error}`} 
            </p>
            <input 
              type="password" 
              className="input-box" 
              placeholder="Enter your password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}  
              required
              disabled={loading} 
            />

            {/* <span 
              className="card-title-a" 
              onClick={handleRegisterClick} 
              style={{ cursor: 'pointer', color: '#2cc6ff', textDecoration: 'none', marginTop: 5 }}>
              FORGOT YOUR PASSWORD?
            </span> */}

            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading} 
              style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
            >  
              {loading ? (
                <ClipLoader color="#fff" size={21} />
              ) : (
                'Login'
              )}
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
