import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { doc, setDoc, serverTimestamp, getDoc, deleteField, getDocs } from "firebase/firestore";
import { db } from "../firebase/firebase.jsx";
import styles from './Spaceship.module.css';
import { collection, updateDoc, arrayUnion } from "firebase/firestore";

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
    const [isModalOpen, setIsModalOpen] = useState(false); // State for confirmation modal
    const [openModals, setOpenModals] = useState([]); // Array to manage multiple message modals
    const [currentUserId, setCurrentUserId] = useState(null); // Add state variable for current user ID

    useEffect(() => {
        // If no game is selected, redirect the user to /space
        if (!selectedGame) {
            navigate('/space');
        }
    }, [selectedGame, navigate]);

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
                // Initialize openModals with false values for each user
                setOpenModals(usersArray.map(() => false));
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
            navigate(-1);
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

    const handleSendMessage = async () => {
        console.log(user.uid);
        console.log(currentUserId); // Use currentUserId instead of selectedUserID
    
        const messagesRef = collection(db, "messages");
        const chatsRef = collection(db, "chats");
    
        try {
            // Create a new message document
            const newMessageRef = doc(messagesRef);
            await setDoc(newMessageRef, {
                createAt: serverTimestamp(),
                messages: []
            });
    
            // Ensure the chat documents exist before updating them
            const userChatRef = doc(chatsRef, user.uid);
            const currentUserChatRef = doc(chatsRef, currentUserId);
    
            const userChatDoc = await getDoc(userChatRef);
            const currentUserChatDoc = await getDoc(currentUserChatRef);
    
            if (!userChatDoc.exists()) {
                // If the user's chat document doesn't exist, create it
                await setDoc(userChatRef, {
                    chatsData: []
                });
            }
    
            if (!currentUserChatDoc.exists()) {
                // If the other user's chat document doesn't exist, create it
                await setDoc(currentUserChatRef, {
                    chatsData: []
                });
            }
    
            // Update the chats with the new message
            await updateDoc(userChatRef, {
                chatsData: arrayUnion({
                    messageId: newMessageRef.id,
                    lastMessage: "",
                    rId: currentUserId,
                    updatedAt: Date.now(),
                    messageSeen: true,
                })
            });
    
            await updateDoc(currentUserChatRef, { // Update for the other user
                chatsData: arrayUnion({
                    messageId: newMessageRef.id,
                    lastMessage: "",
                    rId: user.uid,
                    updatedAt: Date.now(),
                    messageSeen: true,
                })
            });
    
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };
    
    
    
    const toggleMessageModal = (index, selectedUserID) => {
        console.log("Logged-in User ID:", user.uid);
        console.log("Selected User ID:", selectedUserID);
    
        setCurrentUserId(selectedUserID); // Set selectedUserID when opening
        setOpenModals((prev) => {
            const newModals = [...prev];
            newModals[index] = !newModals[index];
            return newModals;
        });
    };
    
    const closeMessageModal = (index) => {
        setCurrentUserId(""); // Clear currentUserId when closing
        setOpenModals((prev) => {
            const newModals = [...prev];
            newModals[index] = false; // Explicitly set to false
            return newModals;
        });
    };

    useEffect(() => {
        console.log("Current User ID updated:", currentUserId);
    }, [currentUserId]);

    //Idea stops here

    return (
        <>
            <div className={styles.spaceshipBody}>
                <div className={styles.contentPage}>
                    <HeaderPage user={user} />
                    <div className={styles.contentBody}>
                        <div className={styles.card}>
                            <button className={styles.quitButtons} onClick={() => setIsModalOpen(true)}>
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
                                                .map((userItem, index) => {
                                                    return(
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
                                                        <button className={styles.messageButton} onClick={() => toggleMessageModal(index, userItem.userID)}>
                                                            <i className="fa-solid fa-comment-dots"></i>
                                                        </button>
                                                        {openModals[index] && (
                                                            <div className={styles.messageOverlay}>
                                                                <div className={styles.messageModal}>
                                                                    <div className={styles.modalHeader}>
                                                                        To: {userItem.username}
                                                                        <button className={styles.modalCloseButton} onClick={() => closeMessageModal(index)}>
                                                                            <i className="fa-regular fa-circle-xmark"></i>
                                                                        </button>
                                                                    </div>
                                                                    <div className={styles.messageHandler}>
                                                                        <input className={styles.modalTextArea} placeholder="Write a message to invite this player..."/>
                                                                        <button onClick={handleSendMessage}className={styles.modalSendButton}><i className="fa-solid fa-paper-plane"></i></button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                    );
                                                
                                                })}
                                        </div>
                                    )}
                                </div>
                                {loading && <div className={styles.blurBackground}></div>}
                            </div>
                        </div>
                    </div>
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
