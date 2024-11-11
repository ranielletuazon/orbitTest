import React, { useEffect, useState, useRef } from 'react';
import { auth, db } from '../firebase/firebase.jsx'; 
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, getDocs, increment, runTransaction } from 'firebase/firestore';
import { ClipLoader } from 'react-spinners';

import styles from './Space.module.css'; 

import HeaderPage from './HeaderPage.jsx';
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

    return (
        <>
            <div className={styles.spaceBody}>
                <button onClick={() => navigate('/space/messages')} className={styles.messagesButton}>
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
        </>
    );
}

export default Space;
