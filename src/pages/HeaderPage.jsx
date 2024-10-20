import React, { useState, useRef, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { auth, storage, db } from '../firebase/firebase';
import { useNavigate } from 'react-router-dom';
import { getDownloadURL, ref } from 'firebase/storage';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import styles from './HeaderPage.module.css'; // Assuming CSS modules

function HeaderPage({ user }) {
    const [logoImageUrl, setLogoImageUrl] = useState(null);
    const [profileImageUrl, setProfileImageUrl] = useState(null);
    const [isPopupVisible, setIsPopupVisible] = useState(false);
    const [isLoadingSignOut, setIsLoadingSignOut] = useState(false); // New state for loading spinner
    const popupRef = useRef(null);
    const buttonRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchLogoImage = async () => {
            try {
                const logoImageRef = ref(storage, 'orbitLogo.png');
                const urlOrbit = await getDownloadURL(logoImageRef);
                setLogoImageUrl(urlOrbit);
            } catch (error) {
                console.error('Error fetching logo image:', error);
            }
        };

        const fetchProfileImage = async () => {
            if (user && user.uid) {
                try {
                    const userDocRef = doc(db, 'users', user.uid);
                    const userDocSnap = await getDoc(userDocRef);

                    if (userDocSnap.exists()) {
                        const userData = userDocSnap.data();
                        if (userData.profileImage) {
                            const profileImageRef = ref(storage, userData.profileImage);
                            const profileUrl = await getDownloadURL(profileImageRef);
                            setProfileImageUrl(profileUrl);
                        } else {
                            setDefaultProfileImage();
                        }
                    } else {
                        setDefaultProfileImage();
                    }
                } catch (error) {
                    console.error('Error fetching profile image:', error);
                    setDefaultProfileImage();
                }
            } else {
                setDefaultProfileImage();
            }
        };

        const setDefaultProfileImage = async () => {
            const defaultImageRef = ref(storage, 'profileImages/defaultProfileImage.png');
            const defaultUrl = await getDownloadURL(defaultImageRef);
            setProfileImageUrl(defaultUrl);
        };

        fetchLogoImage();
        fetchProfileImage();
    }, [user]);

    const handleSignOut = async () => {
        setIsLoadingSignOut(true); // Show the spinner when sign out is initiated

        if (user && user.uid) {
            const userDocRef = doc(db, 'users', user.uid);
            await updateDoc(userDocRef, {
                'userStatus.isOnline': false // Update online status in Firestore
            });
        }

        signOut(auth)
            .then(() => {
                setIsLoadingSignOut(false); // Hide the spinner after sign-out completes
                navigate('/login');
            })
            .catch((error) => {
                console.log(error);
                setIsLoadingSignOut(false); // Hide spinner in case of error
            });
    };

    const togglePopup = () => {
        setIsPopupVisible((prev) => !prev);
    };

    const handleClickOutside = (event) => {
        if (popupRef.current && !popupRef.current.contains(event.target) && buttonRef.current && !buttonRef.current.contains(event.target)) {
            setIsPopupVisible(false);
        }
    };

    const goToProfilePage = () => {
        navigate('/space/profile');
    };

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className={styles.headerPage}>
            <span className={styles.profileContainer}>
                {profileImageUrl ? (
                    <button className={styles.profileButton} onClick={goToProfilePage}>
                        <img
                            src={profileImageUrl}
                            alt="Profile"
                            className={styles.profileImage}
                        />
                    </button>
                ) : (
                    <div></div>
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
                    <div></div>
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
                        <button 
                            className={styles.signOutButton} 
                            onClick={handleSignOut}
                            disabled={isLoadingSignOut} // Disable button when loading
                        >
                            {isLoadingSignOut ? (
                                <div className={styles.spinner}></div> // Show spinner if loading
                            ) : (
                                'Sign Out'
                            )}
                        </button>
                    )}
                </div>
            </span>
        </div>
    );
}

export default HeaderPage;
