import React from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/firebase.jsx'; 
import { useNavigate } from 'react-router-dom';

function Space({ user }) { // Accept user prop
    const navigate = useNavigate(); // Initialize useNavigate hook

    console.log('Space component user:', user); // Log user object

    const handleSignOut = () => {
        signOut(auth)
            .then(() => {
                console.log("Sign Out");
                navigate('/login'); // Redirect to login after signing out
            })
            .catch((error) => console.log(error));
    }

    return (
        <div>
            <h1>Hello, {user ? user.email : 'Guest'}!</h1> {/* Display user's email */}
            <button className="btn btn-danger" onClick={handleSignOut}>Sign Out</button>
        </div>
    );
}

export default Space;
