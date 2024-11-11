import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { doc, setDoc, serverTimestamp, getDoc, deleteField, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase/firebase.jsx";
import styles from './Spaceship.module.css';
import { collection, updateDoc, arrayUnion } from "firebase/firestore";

import HeaderPage from './HeaderPage.jsx';

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
    const [isMessageSent, setIsMessageSent] = useState(false);
    const [openModals, setOpenModals] = useState([]); // Array to manage multiple message modals
    const [currentUserId, setCurrentUserId] = useState(null); // Add state variable for current user ID
    const [chatPartnerIDs, setChatPartnerIDs] = useState([]);


    useEffect(() => {
        // If no game is selected, redirect the user to /space
        if (!selectedGame) {
            navigate('/space');
        } else {
            fetchChatPartnerIDs(); // Fetch chat partner IDs once a game is selected
        }
    }, [selectedGame, navigate]);

    const fetchChatPartnerIDs = async () => {
        try {
            const chatsRef = doc(db, 'chats', user.uid); // Reference to the user's chats document
            const chatsDoc = await getDoc(chatsRef);

            if (chatsDoc.exists()) {
                const chatsData = chatsDoc.data().chatsData || [];
                const partnerIDs = chatsData.map(chat => chat.rId); // Extract rId from each chat
                setChatPartnerIDs(partnerIDs); // Store IDs in state
            } else {
                console.log("No chat data found for this user.");
                setChatPartnerIDs([]); // Reset if no chats
            }
        } catch (error) {
            console.error("Error fetching chat partner IDs:", error);
        }
    };

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

                // Filter out self and chat partners
                const filteredUsers = usersArray.filter(
                    userItem => userItem.userID !== user.uid && !chatPartnerIDs.includes(userItem.userID)
                );

                setUserData(filteredUsers);
                setOpenModals(filteredUsers.map(() => false)); // Initialize openModals with filtered users
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
        navigate('/space'); //remove this once firebase is fixed
        if (!selectedGame) {
            console.error('No game selected');
            return;
        }
    
        const gameID = selectedGame.id;
    
        try {
            // Delete user data from Firestore
            await setDoc(doc(db, 'usersQueue', gameID), {
                [user.uid]: deleteField()
            }, { merge: true });
    
            console.log('User data deleted successfully from Firestore');
            fetchUserData(gameID);
    
            // Navigate after the deletion is done
            navigate('/space'); // Or navigate to another page, such as the game space
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

    const handleSendMessage = async (index) => {
        const messageText = document.querySelector(`.${styles.modalTextArea}`).value.trim(); // Get the input text
        if (!messageText) return; // Don't send empty messages
    
        console.log(user.uid); // Current user's UID
        console.log(currentUserId); // The ID of the user being invited
    
        const messagesRef = collection(db, "messages");
        const chatsRef = collection(db, "chats");
    
        try {
            // Create a new message document
            const newMessageRef = doc(messagesRef);
            await setDoc(newMessageRef, {
                messages: [{
                    sId: user.uid,
                    text: messageText,
                    createdAt: new Date()
                }]
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
    
            // Update the chats with the new message and the last message text
            await updateDoc(userChatRef, {
                chatsData: arrayUnion({
                    messageId: newMessageRef.id,
                    lastMessage: messageText, // Set lastMessage to the current message
                    rId: currentUserId,
                    updatedAt: Date.now(),
                    messageSeen: false, // Set as unread initially
                })
            });
    
            await updateDoc(currentUserChatRef, { // Update for the other user
                chatsData: arrayUnion({
                    messageId: newMessageRef.id,
                    lastMessage: messageText, // Set lastMessage to the current message
                    rId: user.uid,
                    updatedAt: Date.now(),
                    messageSeen: false, // Set as unread initially
                })
            });
    
            closeMessageModal(index); // Close the modal after sending the message
    
            // After sending the message, navigate to the messages page
            setIsMessageSent(true);

            fetchUserData(selectedGame.id);//refresh the div
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

    const closeNotifcation = () => {
        setIsMessageSent(false);
    }

    useEffect(() => {
        console.log("Current User ID updated:", currentUserId);
    }, [currentUserId]);

    //Idea stops here

    return (
        <>
            <div className={styles.spaceshipBody}>
                <button onClick={() => navigate('/space/messages')} className={styles.messagesButton}>
                    <i className="fa-solid fa-message"></i>
                </button>
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
                                                            <i className="fa-solid fa-gamepad"></i>
                                                        </button>
                                                        {openModals[index] && (
                                                            <div className={styles.messageOverlay}>
                                                                <div className={styles.messageModal}>
                                                                    <div className={styles.modalHeader}>
                                                                        Invite {userItem.username} to play with you?
                                                                        <button className={styles.modalCloseButton} onClick={() => closeMessageModal(index)}>
                                                                            <i className="fa-regular fa-circle-xmark"></i>
                                                                        </button>
                                                                    </div>
                                                                    <div className={styles.messageHandler}>
                                                                        <input className={styles.modalTextArea} placeholder="Write a message to this player..." maxLength="35"/>
                                                                        <button onClick={() => handleSendMessage(index)} className={styles.modalSendButton}><i className="fa-solid fa-paper-plane"></i></button>
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
            {isMessageSent && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <button className={styles.modalCloseButton} style={{margin:"11px 1rem"}} onClick={closeNotifcation}>
                            <i className="fa-regular fa-circle-xmark"></i>
                        </button>
                        <div className={styles.modalHeader}>Notification</div>
                        <div className={styles.modalText}>
                            <span>Message has been sent!</span>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default Spaceship;
