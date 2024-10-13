import React, { useEffect, useState, useRef } from 'react';
import { signOut } from 'firebase/auth';
import { auth, db, storage } from '../firebase/firebase.jsx'; 
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { getDownloadURL, ref } from 'firebase/storage'; 
import styles from './Space.module.css'; 

function Space({ user }) {
    const navigate = useNavigate();
    const [userData, setUserData] = useState(null);
    const [profileImageUrl, setProfileImageUrl] = useState(null); 
    const [logoImageUrl, setLogoImageUrl] = useState(null); 
    const [isPopupVisible, setIsPopupVisible] = useState(false); 
    const popupRef = useRef(null); 
    const buttonRef = useRef(null); 

    useEffect(() => {
        const fetchUserData = async () => {
            if (user) {
                try {
                    const userDocRef = doc(db, 'users', user.uid);
                    const userDocSnap = await getDoc(userDocRef);

                    if (userDocSnap.exists()) {
                        setUserData(userDocSnap.data());
                    } else {
                        console.log('No such document!');
                    }
                } catch (error) {
                    console.error('Error fetching user data:', error);
                }
            }
        };

        fetchUserData();

        const fetchProfileImage = async () => {
            try {
                const profileImageRef = ref(storage, 'profileImages/defaultProfileImage.png');
                const urlProf = await getDownloadURL(profileImageRef);
                setProfileImageUrl(urlProf);
            } catch (error) {
                console.error('Error fetching profile image:', error);
            }
        };

        const fetchLogoImage = async () => {
            try {
                const logoImageRef = ref(storage, 'orbitLogo.png');
                const urlOrbit = await getDownloadURL(logoImageRef);
                setLogoImageUrl(urlOrbit);
            } catch (error) {
                console.error('Error fetching logo image:', error);
            }
        };

        fetchProfileImage();
        fetchLogoImage();
    }, [user]);

    const handleSignOut = () => {
        signOut(auth)
            .then(() => {
                navigate('/login');
            })
            .catch((error) => console.log(error));
    };

    const togglePopup = () => {
        setIsPopupVisible((prev) => !prev);
    };

    const handleClickOutside = (event) => {
        if (popupRef.current && !popupRef.current.contains(event.target) && buttonRef.current && !buttonRef.current.contains(event.target)) {
            setIsPopupVisible(false);
        }
    };

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <>
            <div className={styles.spacePage}> 
                <div className={styles.headerPage}>
                    <span className={styles.profileContainer}>
                        {profileImageUrl ? (
                            <img 
                                src={profileImageUrl} 
                                alt="Profile" 
                                className={styles.profileImage} 
                            />
                        ) : (
                            <p>Loading profile image...</p>
                        )}
                    </span>
                    <span className={styles.logoContainer}>
                        {logoImageUrl ? (
                            <img 
                                src={logoImageUrl} 
                                alt="Orbit Logo" 
                                className={styles.logoImage}
                            />
                        ) : (
                            <p>Loading logo image...</p>
                        )}
                    </span>
                    <span className={styles.settingsContainer}>
                        <button 
                            ref={buttonRef}
                            className={styles.settingsButton} 
                            onClick={togglePopup}
                        >
                            <i className="fa-solid fa-gear" style={{ fontSize: '2rem', color: 'white' }}></i>
                        </button>
                        <div ref={popupRef} className={`${styles.popup} ${isPopupVisible ? styles.active : ''}`}>
                            {isPopupVisible && (
                                <button className={styles.signOutButton} onClick={handleSignOut}>Sign Out</button>
                            )}
                        </div>
                    </span>
                </div>
                <div className={styles.contentPage}>
                    <span className="welcomeText" style={{ color: 'white', fontSize: '1.5rem'}}>
                        Welcome back,{' '}
                        <span style={{ color: '#2cc6ff' }}>
                            {user && userData ? userData.username : 'Guest'}
                        </span>
                        !
                    </span>
                    <span className="cardText" style={{ color: 'white', fontSize: '1.5rem'}}>FIND YOUR TEAMMATE!</span>
                </div>
                <div className={styles.sidebarPage}>
                    {/* Sidebar content goes here */}
                </div>
            </div>
        </>
    );
}

export default Space;
