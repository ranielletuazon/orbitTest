import React, { useEffect, useState, useRef } from 'react';
import { auth, db } from '../firebase/firebase.jsx'; 
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';

import styles from './Space.module.css'; 

import HeaderPage from './HeaderPage.jsx';
import SidebarPage from './SidebarPage.jsx';

function Space({ user }) {
    const navigate = useNavigate();
    const [userData, setUserData] = useState(null);
    const [games, setGames] = useState([]); // List of games from Firestore
    const [searchTerm, setSearchTerm] = useState(''); // Search input state
    const [filteredGames, setFilteredGames] = useState([]); // Filtered games based on search term
    const [selectedGame, setSelectedGame] = useState(null); // State to hold the selected game
    const [showSearchResults, setShowSearchResults] = useState(false); // State to control visibility of search results
    const [isModalVisible, setIsModalVisible] = useState(false); // State to control modal visibility
    const [modalMessage, setModalMessage] = useState(''); // Initialize modalMessage state
    const searchRef = useRef(null); // Reference for the search box container

    // Fetch user data
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

    // Fetch all games from Firestore
    useEffect(() => {
        const fetchGames = async () => {
            try {
                const gamesCollection = collection(db, 'onlineGames');
                const gamesSnapshot = await getDocs(gamesCollection);
                const gamesList = gamesSnapshot.docs.map((doc) => ({
                    id: doc.id, // Document ID
                    title: doc.data().gameTitle, // Field for game title
                }));
                setGames(gamesList); // Set the games in state
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
    // Handle clicking the search button to navigate to /space/ship
    const handleSearchButtonClick = async () => {
        if (!userData || userData.isUpdated === false || userData.isUpdated === undefined) {
            // Show modal if profile needs updating (if isUpdated is false or does not exist)
            setIsModalVisible(true);
            setModalMessage('For a better experience, please update your profile information.');
            return;
        }
        
        if (!selectedGame) {
            // Show modal if no game is selected
            setIsModalVisible(true);
            setModalMessage('Please select a game to continue.');
            return;
        }

        // If the profile is updated, navigate to /space/ship with the selected game
        console.log('Selected game before navigating:', selectedGame);
        navigate('/space/ship', { state: { selectedGame } });
    };


    // Handle closing modal and navigating to profile
    const handleProfileUpdate = () => {
        setIsModalVisible(false);
        navigate('/space/profile');
    };

    return (
        <>
            <div className={styles.spaceBody}>
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
                        
                        {/* Game search section */}
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
                                    placeholder="Search games..."
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
                            <div className={styles.gameButton} onClick={handleSearchButtonClick}>
                                <span>Search</span>
                            </div>
                        </form>

                        <div className={styles.popularGameTab } style={{ color: 'white', fontSize: '1.5rem', marginBottom:'2rem'}}>
                            <span>Popular Games</span>
                            <div className={styles.popularGamesHolder}>
                                <div className={styles.popularGamesBox} style={{marginRight: '1rem'}}></div>
                                <div className={styles.popularGamesBox}></div>
                            </div>
                        </div>
                    </div>
                    <SidebarPage />
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
