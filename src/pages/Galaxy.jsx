import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import styles from "./Galaxy.module.css";
import HeaderPage from "./HeaderPage";
import { collection, doc, query, where, getDocs, getDoc, setDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "../firebase/firebase";

function Galaxy({ user }) {
    const navigate = useNavigate();
    const [userData, setUserData] = useState(null);
    const [usersList, setUsersList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [gamesPlayed, setGamesPlayed] = useState([]);
    const [excludedIds, setExcludedIds] = useState([]); // List of IDs to exclude
    const [openModals, setOpenModals] = useState([]); // State to handle modal visibility
    const [currentUserId, setCurrentUserId] = useState(null); // Current user selected for messaging
    const [unreadCount, setUnreadCount] = useState(0);

    // Fetch user's chats and extract `rId` values
    const fetchExcludedIds = async () => {
        if (!user || !user.uid) return;

        const chatDocRef = doc(db, "chats", user.uid);
        try {
            const chatDoc = await getDoc(chatDocRef);

            if (chatDoc.exists()) {
                const chatsData = chatDoc.data().chatsData || [];
                const rIds = chatsData.map((chat) => chat.rId); // Extract all recipient IDs
                setExcludedIds(rIds);
            } else {
                console.log("No chat data found for the user.");
            }
        } catch (error) {
            console.error("Error fetching chats data:", error);
        }
    };

    const fetchGamesPlayed = async (selectedGames) => {
        if (!selectedGames || Object.keys(selectedGames).length === 0) {
            setGamesPlayed([]);
            return;
        }

        const gamesRef = collection(db, "onlineGames");
        try {
            const querySnapshot = await getDocs(gamesRef);
            const allGames = [];

            querySnapshot.forEach((doc) => {
                const gameId = doc.id;
                const gameData = doc.data();

                if (selectedGames[gameId] === true) {
                    allGames.push(gameData.gameTitle);
                }
            });

            setGamesPlayed(allGames);
        } catch (error) {
            console.error("Error fetching games:", error);
        }
    };

    const selectRandomUser = (list, currentUserId) => {
        // Filter out users already in the excluded IDs list
        const filteredList = list.filter(
            (user) => !excludedIds.includes(user.id) && user.id !== currentUserId
        );

        if (filteredList.length === 0) {
            console.log("No more users to select!");
            return;
        }

        const randomUser = filteredList[Math.floor(Math.random() * filteredList.length)];
        setUserData(randomUser);

        if (randomUser.selectedGames) {
            fetchGamesPlayed(randomUser.selectedGames);
        } else {
            setGamesPlayed([]);
        }
    };

    useEffect(() => {
        const fetchUsers = async () => {
            const usersRef = collection(db, "users");
            const q = query(
                usersRef,
                where("emailConsent", "==", true),
                where("isUpdated", "==", true)
            );

            try {
                const querySnapshot = await getDocs(q);
                const fetchedUsers = querySnapshot.docs.map((doc) => ({
                    id: doc.id, // Include document ID for tracking
                    ...doc.data(),
                }));

                if (fetchedUsers.length > 0) {
                    setUsersList(fetchedUsers);
                } else {
                    console.log("No matching users found!");
                }
            } catch (error) {
                console.error("Error fetching users:", error);
            }
        };

        // Fetch excluded IDs and users
        if (user && user.uid) {
            fetchExcludedIds();
            fetchUsers();
        }
    }, [user]);

    useEffect(() => {
        // Once excluded IDs and users are loaded, select a random user
        if (usersList.length > 0 && excludedIds.length >= 0) {
            selectRandomUser(usersList, user.uid);
        }
    }, [usersList, excludedIds]);

    const handleSkip = () => {
        if (usersList.length > 0 && userData) {
            setLoading(true);  // Disable button
            selectRandomUser(usersList, user.uid);
    
            // Re-enable the button after 2 seconds
            setTimeout(() => {
                setLoading(false);
            }, 2000);
        } else {
            console.log("No users available to skip!");
        }
    };

    const toggleMessageModal = (index, selectedUserID) => {
        console.log("Logged-in User ID:", user.uid);
        console.log("Selected User ID:", selectedUserID);

        setCurrentUserId(selectedUserID); // Set selectedUserID when opening the modal
        setOpenModals((prev) => {
            const newModals = [...prev];
            newModals[index] = !newModals[index]; // Toggle the modal visibility for the selected index
            return newModals;
        });
    };

    const closeMessageModal = (index) => {
        setOpenModals((prev) => {
            const newModals = [...prev];
            newModals[index] = false; // Close the modal by setting the state to false
            return newModals;
        });
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
                    messageSeen: true, // Set as unread initially
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
            navigate("/space/messages")
    
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    useEffect(() => {
        const fetchUnreadMessages = async () => {
            try {
                // Reference to the 'chats' collection
                const chatsRef = doc(db, 'chats', user.uid);
                const chatsSnapshot = await getDoc(chatsRef);
                const chatsData = chatsSnapshot.exists() ? chatsSnapshot.data().chatsData : [];
                
                // Filter unread messages where messageSeen is false
                const unreadMessages = chatsData.filter(chat => chat.messageSeen === false);
                setUnreadCount(unreadMessages.length);
            } catch (error) {
                console.error('Error fetching unread messages:', error);
            }
        };
    
        if (user) {
            fetchUnreadMessages();
        }
    }, [user]);

    return (
        <div className={styles.pageContainer}>
            <button onClick={() => navigate('/space/messages')} className={styles.messagesButton}>
                {unreadCount > 0 && (
                    <div className={styles.notificationPop}></div>
                )}
                <i className="fa-solid fa-message"></i>
            </button>
            {openModals[0] && (  // Open modal only when the corresponding index is true
                        <div className={styles.messageOverlay}>
                            <div className={styles.messageModal}>
                                <div className={styles.modalHeader}>
                                    Invite {userData?.username} to play with you?
                                    <button
                                        className={styles.modalCloseButton}
                                        onClick={() => closeMessageModal(0)}  // Close the modal by passing the correct index
                                    >
                                        <i className="fa-regular fa-circle-xmark"></i>
                                    </button>
                                </div>
                                <div className={styles.messageHandler}>
                                    <textarea
                                        className={styles.modalTextArea}
                                        placeholder="Write a message to this player..."
                                        maxLength="35"
                                    />
                                    <button
                                        onClick={() => handleSendMessage(0)}
                                        className={styles.modalSendButton}
                                    >
                                        <i className="fa-solid fa-paper-plane"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
            <HeaderPage user={user} />
            <div className={styles.contentPage}>
                <div className={styles.cardGroup}>
                    <div
                        className={styles.skipButton}
                        onClick={handleSkip}
                        style={{ pointerEvents: loading ? 'none' : 'auto' }}  // Disable click interactions
                    >
                        {loading ? (
                            <i className="fa-solid fa-spinner fa-spin" />  // Spinner icon when loading
                        ) : (
                            <i className="fa-solid fa-chevron-right" />  // Default right arrow
                        )}
                    </div>
                    <div className={styles.profileImage}>
                        {userData && userData.profileImage ? (
                            <>
                                <div
                                    className={styles.circleGender}
                                    style={{
                                        backgroundColor:
                                            userData.gender === "Female"
                                                ? "pink"
                                                : userData.gender === "Male"
                                                ? "#2cc6ff"
                                                : "grey",
                                    }}
                                ></div>
                                <img
                                    src={userData.profileImage}
                                    alt="Profile"
                                    className={styles.profileImageImg}
                                    style={{
                                        borderColor:
                                            userData.gender === "Female"
                                                ? "pink"
                                                : userData.gender === "Male"
                                                ? "#2cc6ff"
                                                : "grey",
                                    }}
                                />
                            </>
                        ) : (
                            <div>No Image Available</div>
                        )}
                    </div>

                    <div className={styles.userDetails}>
                        <div className={styles.userDiv}>
                            <div className={styles.userName}>{userData ? userData.username : "Loading..."}</div>
                            <div className={styles.userBio}>{userData ? userData.bio : "Loading..."}</div>
                        </div>
                        <div className={styles.gameGenres}>
                            {userData && userData.favoriteGameGenres && userData.favoriteGameGenres.length > 0 ? (
                                userData.favoriteGameGenres.map((genre, index) => (
                                    <div key={index} className={styles.genreBox}>
                                        {genre}
                                    </div>
                                ))
                            ) : (
                                <div>No Genres Available</div>
                            )}
                        </div>
                        <div className={styles.gamesPlayed}>
                            <div className={styles.gameHeader}>Games Played:</div>
                            <div className={styles.gameContainer}>
                                {gamesPlayed.length > 0 ? (
                                    gamesPlayed.map((game, index) => (
                                        <div key={index} className={styles.gameBox}>
                                            {game}
                                        </div>
                                    ))
                                ) : (
                                    <div>No Games Played</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Message Button */}
                    <div
                        className={styles.messageHolder}
                        onClick={() => toggleMessageModal(0, userData ? userData.id : null)} // 0 is the index for modal
                    >
                        <i className="fa-solid fa-message"></i>
                    </div>

                    {/* Modal */}
                </div>
            </div>
        </div>
    );
}

export default Galaxy;
