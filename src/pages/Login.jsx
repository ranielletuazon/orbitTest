import logo from './assets/logo.png';
import './login.css';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { signInWithEmailAndPassword } from 'firebase/auth'; 
import { auth } from '../firebase/firebase.jsx';

function Login() {
  const navigate = useNavigate(); 

  // Local state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState(''); 
  const [passwordError, setPasswordError] = useState(''); 
  const [shakeClass, setShakeClass] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault(); // Prevent the default form submission behavior
  
    setShakeClass(''); // Reset shake class before checking errors
    let hasError = false; // Flag to track if there are errors
  
    // Clear previous error messages
    setEmailError('');
    setPasswordError('');
  
    // Check for empty fields
    if (!email) {
      setEmailError("Email address is invalid."); 
      hasError = true;
    } else if (!/\S+@\S+\.\S+/.test(email)) { // Basic email validation
      setEmailError("Please enter a valid email address.");
      hasError = true;
    }
  
    if (!password) {
      setPasswordError("Password cannot be empty."); 
      hasError = true;
    } else if (password.length < 6) { // Optional password length check
      setPasswordError("Password must be at least 6 characters.");
      hasError = true;
    }
  
    // If there's an error, shake the container and exit
    if (hasError) {
      setShakeClass('shake'); // Add shake effect
      return; 
    }
  
    // Try to sign in with Firebase
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/space'); 
    } catch (error) {
      // Log the error to the console for debugging
      console.error(error); // Add this line to log the error
  
      // Handle Firebase authentication errors
      if (error.code === 'auth/user-not-found') {
        setEmailError("Email address does not exist."); 
      } else if (error.code === 'auth/wrong-password') {
        setPasswordError("Incorrect password. Please try again.");
      } else {
        // Other errors
        setEmailError("An error occurred. Please try again.");
      }
      setShakeClass('shake'); // Add shake effect
    }
  };  

  const handleRegisterClick = () => {
    navigate('/register');  
  };

  return (
    <div>
      <header className="header">
        <div className="header-logo">
          <img src={logo} alt="Logo" />  
        </div>
      </header>
      <div className={`center-container ${shakeClass}`}>
        <div className="card">
          <div className="card-header">
            <h4>WELCOME BACK!</h4>
            <h5>Best of luck to your games!</h5>
          </div>
          <div className="card-body">
            <p className="card-title">
              EMAIL ADDRESS {emailError && <span style={{ color: 'white' }}> - </span>} 
              {emailError && <span style={{ color: '#d51f1f' }}>{emailError}</span>}
            </p>
            <input type="email" className="input-box" value={email} onChange={(e) => setEmail(e.target.value)} />

            <p className="card-title">
              PASSWORD {passwordError && <span style={{ color: 'white' }}> - </span>} 
              {passwordError && <span style={{ color: '#d51f1f' }}>{passwordError}</span>}
            </p>
            <input type="password" className="input-box" value={password} onChange={(e) => setPassword(e.target.value)} />  

            <span 
              className="card-title-a" 
              onClick={handleRegisterClick} 
              style={{ cursor: 'pointer', color: '#2cc6ff', textDecoration: 'none', marginTop: 5 }}>
              FORGOT YOUR PASSWORD?
            </span>

            <button className="btn btn-primary" onClick={handleLogin}>Login</button> 

            <p className='card-title' style={{ marginTop: 5 }}>
              Need an account?
              <span 
                className="card-title-a" 
                onClick={handleRegisterClick} 
                style={{ cursor: 'pointer', color: '#2cc6ff', textDecoration: 'none', padding: 3 }}>
                REGISTER
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
