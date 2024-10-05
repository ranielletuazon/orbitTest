import React, { useState } from 'react'; 
import logo from './assets/logo.png';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from "../firebase/firebase.jsx"; 
import { doc, setDoc, Timestamp } from 'firebase/firestore'; 


function Register() {
    // State for user inputs and error messages
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [birthdate, setBirthdate] = useState('');
    const [error, setError] = useState(''); // State for error messages
    
    const navigate = useNavigate();

    // Navigate to login page
    const handleGoToLoginClick = () => {
        navigate('/login');
    };

    // Handle user registration
    const handleSignUp = async (e) => {
        e.preventDefault(); 
        
        // Ensure all fields are filled
        if (!email || !password || !username || !birthdate) {
            setError('Please fill all fields.'); // Display error message
            return; 
        }

        try {
            // Create user in Firebase Authentication
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Convert birthdate to Firestore Timestamp
            const birthdateTimestamp = Timestamp.fromDate(new Date(birthdate));

            // Store additional user data in Firestore
            await setDoc(doc(db, 'users', user.uid), { 
                username: username,
                birthdate: birthdateTimestamp // Store as a timestamp
            });

            console.log('User created successfully:', user); 
            navigate('/space'); // Redirect after successful registration
        } catch (error) {
            const errorCode = error.code;
            let errorMessage = 'Error creating user. Please try again.';

            // Check for specific error codes
            if (errorCode === 'auth/email-already-in-use') {
                errorMessage = 'This email address is already in use. Please use a different email.';
            } else if (errorCode === 'auth/invalid-email') {
                errorMessage = 'Invalid email address. Please enter a valid email.';
            } else if (errorCode === 'auth/weak-password') {
                errorMessage = 'Password should be at least 6 characters.';
            }

            setError(errorMessage); // Set the error message to state
            console.error('Error creating user:', errorCode, error.message);  
        }
    };

    return (
        <div>
            <header className='header'>
                <div className="header-logo">
                    <img src={logo} alt="Logo" />
                </div>
            </header>
            <div className={"center-container " } style={{ margin: 0 }} >
                <div className="card">
                    <div className="card-header">
                        <h4>CREATE AN ACCOUNT</h4>
                    </div>
                    <form className="card-body" onSubmit={handleSignUp}>
                        <p className="card-title">EMAIL ADDRESS</p>
                        <input 
                            type="email" 
                            className="input-box" 
                            placeholder="Enter your email" 
                            required 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                        />

                        <p className="card-title">USERNAME</p>
                        <input 
                            type="text" 
                            className="input-box" 
                            placeholder="Enter your username" 
                            required 
                            value={username} 
                            onChange={(e) => setUsername(e.target.value)} 
                        />

                        <p className="card-title">PASSWORD</p>
                        <input 
                            type="password" 
                            className="input-box" 
                            placeholder="Enter your password" 
                            required 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                        />

                        <p className="card-title">DATE OF BIRTH</p>
                        <input 
                            type="date" 
                            className="input-box-birth" 
                            required 
                            value={birthdate} 
                            onChange={(e) => setBirthdate(e.target.value)} 
                        />

                        <button type="submit" className="btn btn-primary" style={{ marginTop: 27 }}>
                            Continue
                        </button>

                        {error && <p className="error-message" style={{ color: '#e36f74' }}>{error}</p>} {/* Display error message */}

                        <span 
                            className="card-title-a" 
                            onClick={handleGoToLoginClick} 
                            style={{ cursor: 'pointer', color: '#2cc6ff', textDecoration: 'none', padding: 3 }}>
                            ALREADY HAVE AN ACCOUNT?
                        </span>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default Register;
