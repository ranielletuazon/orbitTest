import React, { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db, storage } from '../firebase/firebase.jsx'; // Ensure storage is imported
import { useNavigate } from 'react-router-dom';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'; // Import uploadBytes for uploading files
import styles from './Profile.module.css';
import HeaderPage from './HeaderPage.jsx';
import SidebarPage from './SidebarPage.jsx';

function Profile({ user }) {
    const [userData, setUserData] = useState(null);
    const [newUsername, setNewUsername] = useState('');
    const [profileImageUrl, setProfileImageUrl] = useState(null);
    const navigate = useNavigate(); 

    useEffect(() => {
        const fetchUserData = async () => {
            if (user) {
                try {
                    const userDocRef = doc(db, 'users', user.uid);
                    const userDocSnap = await getDoc(userDocRef);

                    if (userDocSnap.exists()) {
                        setUserData(userDocSnap.data());
                        setNewUsername(userDocSnap.data().username);
                        const userProfileImage = userDocSnap.data().profileImage;
                        // Set to user's profile image or default image if not available
                        setProfileImageUrl(userProfileImage || await fetchDefaultProfileImage());
                    }
                } catch (error) {
                    console.error('Error fetching user data:', error);
                }
            }
        };

        fetchUserData();
    }, [user]);

    const fetchDefaultProfileImage = async () => {
        try {
            const defaultImageRef = ref(storage, 'profileImages/defaultProfileImage.png');
            const url = await getDownloadURL(defaultImageRef);
            return url; // Return the default image URL
        } catch (error) {
            console.error('Error fetching default profile image:', error);
            return null; // Return null if there's an error fetching the default image
        }
    };

    const handleUpdateUsername = async () => {
        if (user) {
            try {
                const userDocRef = doc(db, 'users', user.uid);
                await updateDoc(userDocRef, { username: newUsername });
                alert('Profile updated successfully!');
            } catch (error) {
                console.error('Error updating profile:', error);
            }
        }
    };

    const handleProfileImageUpload = async (event) => {
        const file = event.target.files[0];
        if (file) {
            try {
                const storageRef = ref(storage, `profileImages/${user.uid}`); // Store under UID to avoid duplication
                await uploadBytes(storageRef, file); // Upload the file
                const url = await getDownloadURL(storageRef); // Get the download URL

                // Update Firestore with the new image URL
                const userDocRef = doc(db, 'users', user.uid);
                await updateDoc(userDocRef, { profileImage: url });

                // Update local state to reflect the new image
                setProfileImageUrl(url);
                alert('Profile image updated successfully!');
            } catch (error) {
                console.error('Error uploading profile image:', error);
            }
        }
    };

    const handleEscButton = () => {
        navigate('/space'); // Navigate back to /space
    };

    return (
        <>
            <div className={styles.containerPage}>
                <HeaderPage user={user} />
                <div className={styles.contentPage}>
                    <div className={styles.containerCard}>
                        <div className={styles.escapeSection}>
                            <button className={styles.escButton} onClick={handleEscButton}>
                                <i className="fa-regular fa-circle-xmark"></i>
                            </button> 
                            <span style={{ marginLeft: '1rem' }}>ESC</span>
                        </div>
                        <div className={styles.profilePage}>
                            <h3 style={{ marginBottom: '-5px' }}>Profile Settings</h3>
                            <span>Change your personal details</span>
                            <div className={styles.editProfileImageHandler}>
                                {profileImageUrl ? (
                                    <img
                                        src={profileImageUrl}
                                        alt="Profile"
                                        className={styles.profileImage}
                                    />
                                ) : null}
                                <span>Image must be 256x256 - Max 2MB</span>
                                <div className={styles.editImageButtonHandler}>
                                    <label className={styles.uploadLabel}>
                                        Edit Profile Image
                                        <input 
                                            type="file" 
                                            accept="image/*" 
                                            onChange={handleProfileImageUpload} 
                                            className={styles.editImageButton} 
                                        />
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <SidebarPage />
            </div>
        </>
    );
}

export default Profile;
