import React, { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db, storage } from '../firebase/firebase.jsx'; 
import { useNavigate } from 'react-router-dom';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import styles from './Profile.module.css';
import HeaderPage from './HeaderPage.jsx';
import SidebarPage from './SidebarPage.jsx';

function Profile({ user }) {
    const [userData, setUserData] = useState(null);
    const [newUsername, setNewUsername] = useState('');
    const [profileImageUrl, setProfileImageUrl] = useState(null);
    const [birthdate, setBirthdate] = useState(null); // To store the formatted birthdate
    const navigate = useNavigate(); 

    useEffect(() => {
        const fetchUserData = async () => {
            if (user) {
                try {
                    const userDocRef = doc(db, 'users', user.uid);
                    const userDocSnap = await getDoc(userDocRef);
    
                    if (userDocSnap.exists()) {
                        const userData = userDocSnap.data();
                        setUserData(userData);
                        setNewUsername(userData.username);
    
                        // Convert Firestore timestamp to Date format and display as "Month 00, 0000"
                        if (userData.birthdate) {
                            const birthdateObj = userData.birthdate.toDate(); // Convert Firestore timestamp to Date
                            setBirthdate(birthdateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })); // Format date
                        }
    
                        const userProfileImage = userData.profileImage;
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
            return url;
        } catch (error) {
            console.error('Error fetching default profile image:', error);
            return null;
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
            const fileSizeInMB = file.size / (1024 * 1024);
            if (fileSizeInMB > 2) {
                alert('File size exceeds the 2MB limit. Please choose a smaller file.');
                return;
            }

            try {
                const storageRef = ref(storage, `profileImages/${user.uid}`);
                await uploadBytes(storageRef, file);
                const url = await getDownloadURL(storageRef);

                const userDocRef = doc(db, 'users', user.uid);
                await updateDoc(userDocRef, { profileImage: url });

                setProfileImageUrl(url);
                alert('Profile image updated successfully!');
            } catch (error) {
                console.error('Error uploading profile image:', error);
            }
        }
    };

    const handleEscButton = () => {
        navigate('/space');
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
                            <div className={styles.profileDetails} style={{marginBottom: '1rem'}}>
                                <div className={styles.styleDetails}>
                                    <span>Username </span>
                                    <span style={{fontSize: '1rem', color: 'white'}}>{newUsername || 'No username set'}</span>
                                </div>
                                <div className={styles.editUsername}>
                                    <button className={styles.editButton}>Edit</button>
                                </div>
                            </div>
                            <div className={styles.profileDetails} style={{marginBottom: '1rem'}}>
                                <div className={styles.styleDetails}>
                                    <span>Email </span>
                                    <span style={{fontSize: '1rem', color: 'white'}}>{user?.email || 'No email available'}</span> 
                                </div>
                                <div className={styles.editEmail}>
                                    <button className={styles.editButton}>Edit</button>
                                </div>
                            </div>
                            <div className={styles.profileDetails}>
                                <div className={styles.styleDetails}>
                                    <span>Birthday </span>
                                    <span style={{fontSize: '1rem', color: 'white'}}>{birthdate || 'No birthdate available'}</span>
                                </div>
                                <div className={styles.editBirthdate}>
                                    <button className={styles.editButton}>Edit</button>
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
