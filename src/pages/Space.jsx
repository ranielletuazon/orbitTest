import React, { useEffect, useState, useRef } from 'react';
import { auth, db } from '../firebase/firebase.jsx'; 
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, getDocs, increment, runTransaction, setDoc } from 'firebase/firestore';
import { ClipLoader } from 'react-spinners';
import { Rating } from 'react-simple-star-rating'

import styles from './Space.module.css'; 

import HeaderPage from './HeaderPage.jsx';
import AdminButton from './AdminButton.jsx';
import SidebarPage from './SidebarPage.jsx';

function Space({ user }) {
    const navigate = useNavigate();
    const [userData, setUserData] = useState(null);
    const [games, setGames] = useState([]); // To list of games from Firestore
    const [popularGames, setPopularGames] = useState([]); // To state to store top 3 games
    const [searchTerm, setSearchTerm] = useState(''); // To search input state
    const [filteredGames, setFilteredGames] = useState([]); // To filter games based on search term
    const [selectedGame, setSelectedGame] = useState(null); // To state to hold the selected game
    const [showSearchResults, setShowSearchResults] = useState(false); // To state to control visibility of search results
    const [isModalVisible, setIsModalVisible] = useState(false); // To state to control modal visibility
    const [modalMessage, setModalMessage] = useState(''); // To initialize modalMessage state
    const [loading, setLoading] = useState(false); // To state to track loading status for search button
    const searchRef = useRef(null); // To reference for the search box container
    const [unreadCount, setUnreadCount] = useState(0); // To notification
    const [isModalVisibleReview, setIsModalVisibleReview] = useState(false);
    const [reviewVisible, setReviewVisible] = useState(true);
    const [isUserAdmin, setIsUserAdmin] = useState(false); 
    const [rating, setRating] = useState(0);
    const [reviewText, setReviewText] = useState(""); // State to store the review input
    
    const handleRating = (rate) => {
        setRating(rate); // Update the rating state
    };

    useEffect(() => {
        const fetchUserAdminStatus = async () => {
            if (auth.currentUser) { // Ensure the user is logged in
                try {
                    // Reference the user's document in the Firestore 'users' collection
                    const userDocRef = doc(db, 'users', auth.currentUser.uid);
                    const userDocSnap = await getDoc(userDocRef);
    
                    if (userDocSnap.exists()) {
                        const userData = userDocSnap.data();
                        
                        // Check if 'isAdmin' exists and is true
                        if (userData.isAdmin === true) {
                            setIsUserAdmin(true); // Set isUserAdmin to true
                        } else {
                            setIsUserAdmin(false); // Set isUserAdmin to false
                        }
                    } else {
                        console.log('No such user document!');
                        setIsUserAdmin(false); // Default to false if the document doesn't exist
                    }
                } catch (error) {
                    console.error('Error checking admin status:', error);
                    setIsUserAdmin(false); // Default to false in case of error
                }
            } else {
                setIsUserAdmin(false); // Default to false if no user is logged in
            }
        };
    
        fetchUserAdminStatus();
    }, []);

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
    }, [user]);

    // Fetch all games from Firestore and sort popularity
    useEffect(() => {
        const fetchGames = async () => {
            try {
                const gamesCollection = collection(db, 'onlineGames');
                const gamesSnapshot = await getDocs(gamesCollection);
                const gamesList = gamesSnapshot.docs.map((doc) => ({
                    id: doc.id, 
                    title: doc.data().gameTitle, 
                    image: doc.data().gameImage, 
                    popularity: doc.data().gamePopularity, 
                }));

                // Filter out games with no popularity (gamePopularity <= 0)
                const filteredGames = gamesList.filter(game => game.popularity > 0);

                // Sort games by popularity in descending order
                const sortedGames = filteredGames.sort((a, b) => b.popularity - a.popularity);

                // Get the top 3 most popular games
                setPopularGames(sortedGames.slice(0, 3));
                setGames(gamesList); // Set all games for search functionality
            } catch (error) {
                console.error('Error fetching games:', error);
            }
        };

        fetchGames();
    }, []);

    // Handle search input change
    const handleSearchChange = (event) => {
        const value = event.target.value;
        setSearchTerm(value);

        // Filter games based on search term
        const filtered = games.filter((game) =>
            game.title.toLowerCase().includes(value.toLowerCase())
        );
        setFilteredGames(filtered);
        setShowSearchResults(value !== ''); // Show results if search term is not empty
    };

    // Handle game selection
    const handleGameSelect = (game) => {
        setSelectedGame(game); // Set the selected game
        setSearchTerm(game.title); // Update the search term to show the selected game
        setFilteredGames([]); // Clear filtered games to close the selection box
        setShowSearchResults(false); // Hide search results
        console.log('Selected game:', game); // Log the selected game
    };

    // Handle clicks outside the search box
    const handleClickOutside = (event) => {
        if (searchRef.current && !searchRef.current.contains(event.target)) {
            setShowSearchResults(false); // Hide search results when clicking outside
        }
    };

    // Use effect to add/remove event listener for clicks outside
    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Handle clicking the search button to navigate to /space/ship
    const handleSearchButtonClick = async () => {
        setLoading(true); // Start loading spinner
    
        // Check if the user profile is updated
        if (!userData || userData.isUpdated === false || userData.isUpdated === undefined) {
            // Show modal if profile needs updating
            setIsModalVisible(true);
            setModalMessage('For a better experience, please update your profile information.');
            setLoading(false);
            return;
        }
    
        // Check if a game is selected
        if (!selectedGame) {
            // Show modal if no game is selected
            setIsModalVisible(true);
            setModalMessage('Please select a game to continue.');
            setLoading(false);
            return;
        }
    
        try {
            // Perform Firestore transaction to ensure atomicity
            await runTransaction(db, async (transaction) => {
                // 1. Read the game document to get the current data
                const gameRef = doc(db, 'onlineGames', selectedGame.id);
                const gameDoc = await transaction.get(gameRef);
                if (!gameDoc.exists()) {
                    throw new Error("Game does not exist in the database");
                }
    
                // 2. Read the user document to get the current selectedGames
                const userRef = doc(db, 'users', user.uid);
                const userDoc = await transaction.get(userRef);
                if (!userDoc.exists()) {
                    throw new Error("User does not exist in the database");
                }
    
                // 3. Increment the game popularity in the onlineGames collection
                transaction.update(gameRef, {
                    gamePopularity: increment(1) // Increment game popularity by 1
                });
    
                // 4. Add the selected game to the user's selectedGames
                const userSelectedGames = userDoc.data().selectedGames || {}; // Fetch existing selectedGames or initialize empty
                transaction.update(userRef, {
                    selectedGames: {
                        ...userSelectedGames, // Preserve existing selected games
                        [selectedGame.id]: true // Add the selected game
                    }
                });
            });
    
            console.log('Game popularity incremented and user selected games updated successfully.');
    
            // Navigate to the new page after the game is updated
            navigate('/space/ship', { state: { selectedGame } });
        } catch (error) {
            console.error('Error during transaction:', error);
            setIsModalVisible(true);
            setModalMessage('An error occurred while processing your request. Please try again later.');
        }
    
        setLoading(false); // Stop loading spinner
    };

    // Handle closing modal and navigating to profile
    const handleProfileUpdate = () => {
        setIsModalVisible(false);
        navigate('/space/profile');
    };

    const handleReviewClick = () => {
        setIsModalVisibleReview(true);
    };

    const handleSubmitReview = async () => {
        try {
            const reviewData = {
                username: userData.username, // Fallback to 'Anonymous' if no username exists
                rating: rating, // Convert the rating value to stars (e.g., 100 -> 5 stars)
                review: reviewText, // User input review
                date: new Date().toLocaleString(), // Current timestamp
            };
    
            // Save the review to Firestore in the "reviews" collection
            await setDoc(doc(db, "reviews", auth.currentUser.uid), reviewData);
    
            // Mark the review as submitted in the "users" collection
            await setDoc(
                doc(db, "users", auth.currentUser.uid),
                { doneReview: true },
                { merge: true }
            );
    
            setIsModalVisibleReview(false); // Close the modal
            setReviewVisible(false);
        } catch (error) {
            console.error("Error submitting review:", error);
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

    const toggleReview = () => {
        setReviewVisible(!reviewVisible);
    };

    useEffect(() => {
        if (!auth.currentUser) return; // Ensure user is logged in

        const fetchReviewStatus = async () => {
            try {
                // Get the Firestore document for the user
                const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));

                if (userDoc.exists()) {
                    const doneReview = userDoc.data()?.doneReview;
                    // Set reviewVisible based on the field value
                    setReviewVisible(!(doneReview === true));
                } else {
                    // If document doesn't exist, assume review is visible
                    setReviewVisible(true);
                }
            } catch (error) {
                console.error("Error fetching review status:", error);
            }
        };

        fetchReviewStatus();
    }, []);

    const handSubmitReview = async () => {
        try {
            await setDoc(doc(db, "users", auth.currentUser.uid), { doneReview: true }, { merge: true });
            toggleModalReview(false);
        } catch (error) {
            console.error("Error submitting review:", error);
        }
    };

    return (
        <>
            <div className={styles.spaceBody}>

                { isUserAdmin && 
                    (<AdminButton/>)
                }

                { reviewVisible ? (
                    <>
                        <div className={styles.reviews}>
                            <div className={styles.closeButton} onClick={toggleReview}><i className="fa-regular fa-circle-xmark"></i></div>
                            <div className={styles.reviewText}>Are you enjoying Orbit?</div>
                            <div className={styles.reviewButton} onClick={handleReviewClick}>Leave a Review!</div>
                        </div>
                    </>
                ) : null
                }

                <button onClick={() => navigate('/space/messages')} className={styles.messagesButton}>
                    {unreadCount > 0 && (
                        <div className={styles.notificationPop}></div>
                    )}
                    <i className="fa-solid fa-message"></i>
                </button>
                <div className={styles.spacePage}> 
                    <HeaderPage user={user} className={styles.headerIndex}/>
                    <div className={styles.contentPage}>
                        <div className='welcomeHolder' style={{ marginBottom: '1.2rem' }}>
                            <span className="welcomeText" style={{ color: 'white', fontSize: '1.5rem'}}>
                                Welcome back,{' '}
                                <span style={{ color: '#2cc6ff' }}>
                                    {user && userData ? userData.username : ''}
                                </span>
                                !
                            </span>
                        </div>

                        <div className='gameSearcher'>
                            <span className="cardText" style={{ color: 'white', fontSize: '1.5rem'}}>FIND A TEAMMATE!</span>
                        </div>
                        <form 
                            style={{ display: 'flex', marginBottom: '2rem', alignItems: 'center', position: 'relative' }} 
                            onSubmit={(e) => { e.preventDefault(); handleSearchButtonClick(); }} // Handle form submission
                        >
                            <div className={styles.searchSection} ref={searchRef}>
                                <input 
                                    className={styles.chooseMultiplayerGame} 
                                    type="text" 
                                    value={searchTerm} 
                                    onChange={handleSearchChange} 
                                    placeholder="Choose a game..."
                                    onFocus={() => setShowSearchResults(true)} // Show results when focused
                                />
                                {/* Displaying search results */}
                                {showSearchResults && searchTerm && (
                                    <div className={styles.disappearingBlock}>
                                        {filteredGames.length > 0 ? (
                                            filteredGames.map((game) => (
                                                <div 
                                                    key={game.id} 
                                                    className={styles.searchGamesBox} 
                                                    onClick={() => handleGameSelect(game)} // Handle game selection
                                                >
                                                    {game.title}
                                                </div>
                                            ))
                                        ) : (
                                            <div className={styles.searchGamesBox}>
                                                No games found.
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <button className={styles.gameButton} onClick={handleSearchButtonClick} disabled={loading}>
                                {loading ? (
                                    <ClipLoader size={24} color="#fff" loading={loading} />
                                ) : (
                                    <span>Search</span>
                                )}
                            </button>
                        </form>

                        {/* Popular Games */}
                        <div className={styles.popularGameTab} style={{ color: 'white', fontSize: '1.5rem', marginBottom:'2rem'}}>
                            <span>Popular Games</span>
                            <div className={styles.popularGamesHolder}>
                                {popularGames.map((game, index) => (
                                    <div key={index} className={styles.popularGamesBox} style={{ marginRight: '1rem' }}>
                                        <img src={game.image} alt={game.title} className={styles.gameImage} />
                                        <span>{game.title}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal for profile update */}
            {isModalVisible && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <div className={styles.modalButtons}>
                            <button className={styles.buttonX} onClick={() => setIsModalVisible(false)}> <i className="fa-regular fa-circle-xmark"></i> </button>
                        </div>
                        <div className={styles.modalHeader}>Update Required</div>
                        <div className={styles.modalMessage}>{modalMessage}</div>
                    </div>
                </div>
            )}

            {isModalVisibleReview && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <div className={styles.modalButtons}>
                            <button className={styles.buttonX} onClick={() => setIsModalVisibleReview(false)}> <i className="fa-regular fa-circle-xmark"></i> </button>
                        </div>
                        <div className={styles.modalHeader}>Leave a Review</div>
                            {/* Star rating component */}
                        <Rating
                                onClick={handleRating}
                                ratingValue={rating}
                                size={25}
                                fillColor="gold"
                                emptyColor="gray"
                                allowHalfIcon
                                style={{marginBottom: '1rem'}}
                        />
                        <div className={styles.reviewSection}>
                            <input 
                                type="text" 
                                placeholder="Write a review" 
                                value={reviewText} 
                                onChange={(e) => setReviewText(e.target.value)}
                            />
                            <div className={styles.buttonHolder}>
                                <div className={styles.submitButton} onClick={handleSubmitReview}>Submit</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default Space;
