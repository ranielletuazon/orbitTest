import React, { useEffect, useState } from 'react';
import { Navigate } from "react-router-dom";
import styles from './LoadingScreen.module.css'; // Assuming you use a CSS module

function LoadingScreen() {
    const [loading, setLoading] = useState(true);
    const [fadeOut, setFadeOut] = useState(false); // To trigger fade-out animation

    useEffect(() => {
        // Set a 1-second timeout before loading finishes
        const timer = setTimeout(() => {
            setFadeOut(true); // Start the fade-out transition
            setTimeout(() => {
                setLoading(false); // Set loading to false after the fade-out animation finishes
            }, 500); // Adjust to match the fade-out duration in CSS (500ms)
        }, 1000); // Keep the 1-second delay for the loading screen

        // Cleanup the timeout in case the component unmounts before 1 second
        return () => clearTimeout(timer);
    }, []);

    // Once loading is complete, navigate to the desired page
    if (!loading) {
        return <Navigate to="/desired-path" />; // Update with your desired path
    }

    return (
        <div className={`${styles.loadingContainer} ${fadeOut ? styles.fadeOut : ''}`}>
            <div className={styles.spinner}></div>
            <div className={styles.loadingText}>Loading...</div>
        </div>
    );
}

export default LoadingScreen;
