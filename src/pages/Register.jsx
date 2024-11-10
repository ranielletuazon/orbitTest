import React, { useState } from 'react';
import logo from './assets/logo.png';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from "../firebase/firebase.jsx";
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { ClipLoader } from 'react-spinners'; // Import the spinner

function Register() {
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [birthdate, setBirthdate] = useState('');
    const [emailError, setEmailError] = useState('');
    const [usernameError, setUsernameError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [birthdateError, setBirthdateError] = useState('');
    const [loading, setLoading] = useState(false); // Loading state for spinner

    const navigate = useNavigate();

    const handleGoToLoginClick = () => {
        navigate('/login');
    };

    const handleSignUp = async (e) => {
        e.preventDefault();

        // Resetting error states
        setEmailError('');
        setUsernameError('');
        setPasswordError('');
        setBirthdateError('');
        setLoading(true); // Start loading when the user clicks "Continue"
        let hasError = false;

        // Validation checks
        if (!email) {
            setEmailError('Please enter your email address.');
            hasError = true;
        } else {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                setEmailError('Please enter a valid email address.');
                hasError = true;
            } else if (email.length > 46) {
                setEmailError('Email cannot exceed 46 characters.');
                hasError = true;
            }
        }

        if (!username) {
            setUsernameError('Please enter your username.');
            hasError = true;
        } else if (username.length <= 6) {
            setUsernameError('Username must be longer than 6 characters.');
            hasError = true;
        } else if (username.length > 24) {
            setUsernameError('Username cannot exceed 24 characters.');
            hasError = true;
        }

        if (!password) {
            setPasswordError('Please enter your password.');
            hasError = true;
        } else if (password.length < 6) {
            setPasswordError('Password should be at least 6 characters.');
            hasError = true;
        }

        if (!birthdate) {
            setBirthdateError('Please enter your date of birth.');
            hasError = true;
        } else {
            const birthdateObj = new Date(birthdate);
            if (isNaN(birthdateObj.getTime())) {
                setBirthdateError('Please enter a valid date of birth.');
                hasError = true;
            } else if (birthdateObj >= new Date()) {
                setBirthdateError('Your birthday cannot be in the future.');
                hasError = true;
            }
        }

        // Validate username against regex (letters, numbers, and underscores only)
        const usernameRegex = /^[a-zA-Z0-9_]+$/;
        if (!usernameRegex.test(username)) {
            setUsernameError('Username cannot contain special characters.');
            hasError = true;
        }

        if (hasError) {
            setLoading(false); // Stop loading if validation fails
            return; // Stop execution if there are validation errors
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Convert birthdate to Firestore Timestamp
            const birthdateTimestamp = Timestamp.fromDate(new Date(birthdate));

            // Store additional user data in Firestore
            await setDoc(doc(db, 'users', user.uid), {
                username: username,
                birthdate: birthdateTimestamp,
                id: user.uid
            });

            navigate('/space');
        } catch (error) {
            const errorCode = error.code;

            if (errorCode === 'auth/email-already-in-use') {
                setEmailError('This email address is already in use. Please use a different email.');
            } else if (errorCode === 'auth/invalid-email') {
                setEmailError('Invalid email address. Please enter a valid email.');
            } else if (errorCode === 'auth/weak-password') {
                setPasswordError('Password should be at least 6 characters.');
            } else {
                // Set a generic error message for other errors
                setEmailError('Error creating user. Please try again.');
            }
        } finally {
            setLoading(false); // Stop loading after the process completes (success or fail)
        }
    };

    return (
        <div>
            <header className='header'>
                <div className="header-logo">
                    <img src={logo} alt="Logo" />
                </div>
            </header>
            <div className="center-container">
                <div className="card">
                    <div className="card-header">
                        <h4>CREATE AN ACCOUNT</h4>
                    </div>
                    <form className="card-body" onSubmit={handleSignUp}>
                        <div className="form-group">
                            <p className="card-title">
                                EMAIL ADDRESS 
                                {emailError && <span style={{ color: '#e36f74' }}> - {emailError}</span>}
                            </p>
                            <input
                                type="email"
                                className="input-box"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={loading} // Disable input when loading
                            />
                        </div>

                        <div className="form-group">
                            <p className="card-title">
                                USERNAME 
                                {usernameError && <span style={{ color: '#e36f74' }}> - {usernameError}</span>}
                            </p>
                            <input
                                type="text"
                                className="input-box"
                                placeholder="Enter your username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                disabled={loading} // Disable input when loading
                            />
                        </div>

                        <div className="form-group">
                            <p className="card-title">
                                PASSWORD 
                                {passwordError && <span style={{ color: '#e36f74' }}> - {passwordError}</span>}
                            </p>
                            <input
                                type="password"
                                className="input-box"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={loading} // Disable input when loading
                            />
                        </div>

                        <div className="form-group">
                            <p className="card-title">
                                DATE OF BIRTH 
                                {birthdateError && <span style={{ color: '#e36f74' }}> - {birthdateError}</span>}
                            </p>
                            <input
                                type="date"
                                className="input-box-birth"
                                value={birthdate}
                                onChange={(e) => setBirthdate(e.target.value)}
                                disabled={loading} // Disable input when loading
                            />
                        </div>

                        <button 
                            type="submit" 
                            className="btn btn-primary" 
                            style={{ marginTop: 27 }} 
                            disabled={loading} // Disable button while loading
                        >
                            {loading ? ( // Show spinner if loading
                                <ClipLoader color="#fff" size={20} />
                            ) : (
                                'Continue'
                            )}
                        </button>

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
