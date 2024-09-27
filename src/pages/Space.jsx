import React from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/firebase.jsx'; // Adjust the path based on your structure
import { useNavigate } from 'react-router-dom';

function Space() {
    const navigate = useNavigate();
    const user = auth.currentUser; // Get the current user

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            navigate('/login'); // Redirect to the login page after signing out
        } catch (error) {
            console.error("Error signing out: ", error);
        }
    };

    return (
        <div>
            {user ? ( // Check if the user is logged in
                <>
                    <h1>Hello, {user.email}!</h1> {/* Display the user's email */}
                    <button onClick={handleSignOut} className="btn btn-danger">Sign Out</button>
                </>
            ) : (
                <h1>No user is signed in.</h1> // Message when no user is signed in
            )}
        </div>
    );
}

export default Space;
