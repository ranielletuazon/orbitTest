import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { doc, setDoc, serverTimestamp, getDoc, deleteField } from "firebase/firestore";
import { db } from "../firebase/firebase.jsx";
import styles from './Spaceship.module.css';

import HeaderPage from './HeaderPage.jsx';
import SidebarPage from './SidebarPage.jsx';

function Spaceship({ user }) {
    const location = useLocation();
    const navigate = useNavigate();
    const { selectedGame } = location.state || {};

    const [bio, setBio] = useState('');
    const [gameType, setGameType] = useState('');
    const [gameRank, setGameRank] = useState('');
    const [userData, setUserData] = useState([]);
    const [loading, setLoading] = useState(false); 
    const [isModalOpen, setIsModalOpen] = useState(false); // State for modal

    const handleBioChange = (e) => setBio(e.target.value);
    const handleGameTypeChange = (e) => setGameType(e.target.value);
    const handleGameRankChange = (e) => setGameRank(e.target.value);

    const handleStart = async () => {
        if (!selectedGame) {
            console.error('No game selected');
            return;
        }

        const gameID = selectedGame.id;
        const gameTitle = selectedGame.title;

        try {
            const userDocRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);

            if (!userDoc.exists()) {
                console.error('User not found');
                return;
            }

            const userData = userDoc.data();
            const { username, profileImage, gender } = userData;

            await setDoc(doc(db, 'usersQueue', gameID), {
                [user.uid]: {
                    bio,
                    gameType,
                    gameRank,
                    gameTitle,
                    userID: user.uid,
                    username,
                    profileImage,
                    gender,
                    postedAt: serverTimestamp(),
                },
            }, { merge: true });

            console.log('User data stored successfully in Firestore');
            fetchUserData(gameID);
        } catch (error) {
            console.error('Error storing data in Firestore:', error);
        }
    };

    const fetchUserData = async (gameID) => {
        setLoading(true);
        try {
            const usersRef = doc(db, 'usersQueue', gameID);
            const usersDoc = await getDoc(usersRef);

            if (usersDoc.exists()) {
                const usersData = usersDoc.data();
                const usersArray = Object.entries(usersData).map(([uid, data]) => ({
                    userID: uid,
                    ...data,
                }));
                setUserData(usersArray);
            } else {
                console.log('No users found for this game.');
                setUserData([]);
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleQuit = async () => {
        if (!selectedGame) {
            console.error('No game selected');
            return;
        }

        const gameID = selectedGame.id;

        try {
            await setDoc(doc(db, 'usersQueue', gameID), {
                [user.uid]: deleteField()
            }, { merge: true });

            console.log('User data deleted successfully from Firestore');
            fetchUserData(gameID);
            navigate('/space');
        } catch (error) {
            console.error('Error deleting user data from Firestore:', error);
        }
    };

    const handleModalConfirmQuit = () => {
        handleQuit(); // Perform the quit operation
        setIsModalOpen(false); // Close modal after quitting
    };

    const handleModalCancel = () => {
        setIsModalOpen(false); // Just close the modal
    };

    const handleRefresh = () => {
        if (selectedGame) {
            fetchUserData(selectedGame.id);
        } else {
            console.log('No game selected for refresh.');
        }
    };

    return (
        <>
            <div className={styles.spaceshipBody}>
                <div className={styles.contentPage}>
                    <HeaderPage user={user} />
                    <div className={styles.contentBody}>
                        <div className={styles.card}>
                            <button className={styles.quitButton} onClick={() => setIsModalOpen(true)}>
                                <i className="fa-regular fa-circle-xmark"></i>
                            </button>
                            <div className={styles.titleCard}>
                                <span style={{ color: "white", fontSize: "2rem" }}>
                                    Welcome to the Spaceship!
                                </span>
                                <span style={{ color: "#8f8e8e", fontSize: ".8rem", marginTop: "-.3rem" }}>
                                    Complete your information. Once satisfied, just click Start!
                                </span>
                            </div>
                            <div className={styles.infoCard}>
                                <div className={styles.firstSection}>
                                    <div className={styles.chosenGame}>
                                        <div className={styles.gameDisplay}>
                                            {selectedGame ? selectedGame.title : 'No game selected'}
                                        </div>
                                        <span style={{ marginLeft: ".5rem", color: "#8f8e8e" }}>Game</span>
                                    </div>
                                    <div className={styles.bioPlacer}>
                                        <input
                                            className={styles.inputBio}
                                            type="text"
                                            placeholder="Add bio..."
                                            value={bio}
                                            onChange={handleBioChange}
                                        />
                                    </div>
                                </div>
                                <div className={styles.secondSection}>
                                    <div className={styles.typeGame}>
                                        <div className={styles.userGameType}>
                                            <input
                                                className={styles.inputGameType}
                                                type="text"
                                                placeholder="Game Type..."
                                                value={gameType}
                                                onChange={handleGameTypeChange}
                                            />
                                        </div>
                                        <div className={styles.userGameRank}>
                                            <input
                                                className={styles.inputGameRank}
                                                type="text"
                                                placeholder="Rank..."
                                                value={gameRank}
                                                onChange={handleGameRankChange}
                                            />
                                        </div>
                                    </div>
                                    <button className={styles.startButton} onClick={handleStart}>
                                        Start
                                    </button>
                                </div>
                                <div className={styles.thirdSection}>
                                    <button className={styles.refreshButton} onClick={handleRefresh}>
                                        <i className="fa-solid fa-arrows-rotate"></i>
                                    </button>
                                    {loading ? (
                                        <div className={styles.spinnerContainer}>
                                            <div className={styles.spinner}></div>
                                        </div>
                                    ) : (
                                        <div className={styles.userResults}>
                                            {userData
                                                .filter(userItem => userItem.userID !== user.uid)
                                                .map((userItem) => (
                                                    <div key={userItem.userID} className={styles.userBar}>
                                                        <div className={styles.profile}>
                                                            <div className={styles.profileHandler}>
                                                                <img src={userItem.profileImage} alt={`${userItem.username}'s profile`} className={styles.profileImage} />
                                                            </div>
                                                            <div className={styles.nameAndBio}>
                                                                <div className={styles.userUserName}>{userItem.username}</div>
                                                                <div className={styles.userBio}>{userItem.bio}</div>
                                                            </div>
                                                        </div>
                                                        <div className={styles.gameTitle}>{userItem.gameTitle}</div>
                                                        <div className={styles.gameTypeDisplay}>
                                                            <div className={styles.userGameTypeDisplay}>{userItem.gameType}</div>
                                                            <div className={styles.userGameRankDisplay}>{userItem.gameRank}</div>
                                                        </div>
                                                        <button className={styles.messageButton}>
                                                            <i className="fa-solid fa-comment-dots"></i>
                                                        </button>
                                                    </div>
                                                ))}
                                        </div>
                                    )}
                                </div>
                                {loading && <div className={styles.blurBackground}></div>}
                            </div>
                        </div>
                    </div>
                    <SidebarPage />
                </div>
            </div>

            {/* Modal for Quit Confirmation */}
            {isModalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <div className={styles.modalHeader}>Are you sure you want to quit?</div>
                        <div className={styles.modalButtons}>
                            <button className={styles.modalButton} style={{marginRight: "1rem"}}onClick={handleModalConfirmQuit}>
                                Quit
                            </button>
                            <button className={styles.modalButton} onClick={handleModalCancel}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default Spaceship;
