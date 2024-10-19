import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/firebase.jsx';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import styles from './Survey.module.css';
import orbitlogo from '../assets/orbitlogo.png';
import gdpr from './assets/gdpr.jpg';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGamepad, faHatWizard, faDragon, faChessKnight, faRunning, faFistRaised, faTowerObservation } from '@fortawesome/free-solid-svg-icons';

function Survey({ user }) {
    const [gameOptions, setGameOptions] = useState([]); // Limited list for display
    const [allGames, setAllGames] = useState([]); // Store all fetched games
    const [selectedGames, setSelectedGames] = useState([]);
    const [isVerifiedAge, setIsVerifiedAge] = useState(false);
    const [isEmailConsent, setIsEmailConsent] = useState(false);
    const [isTermsAgreed, setIsTermsAgreed] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPlatforms, setSelectedPlatforms] = useState([]);
 
    const [step, setStep] = useState(1);
    const [selectedGenres, setSelectedGenres] = useState([]);
    const [selectedGender, setSelectedGender] = useState();

    const navigate = useNavigate();

    // Fetch online games from Firestore's onlineGames collection
    useEffect(() => {
        const fetchGames = async () => {
            try {
                const gamesCollection = collection(db, 'onlineGames');
                const gamesSnapshot = await getDocs(gamesCollection);
                const gamesList = gamesSnapshot.docs.map(doc => ({
                    id: doc.id,
                    title: doc.data().gameTitle,
                    image: doc.data().gameImage, // Ensure gameImage is fetched
                }));

                // Set all games and limit display to a minimum of 16
                setAllGames(gamesList);
                setGameOptions(gamesList.slice(0, Math.max(gamesList.length, 16)));
            } catch (error) {
                console.error('Error fetching game options:', error);
            }
        };

        fetchGames();
    }, []);

    // Handle game selection
    const handleGameSelection = (gameId) => {
        if (selectedGames.includes(gameId)) {
            setSelectedGames(selectedGames.filter(id => id !== gameId));
        } else {
            setSelectedGames([...selectedGames, gameId]);
        }
    };

    // Handle genre selection
    const handleGenreSelection = (genre) => {
        if (selectedGenres.includes(genre)) {
            setSelectedGenres(selectedGenres.filter(g => g !== genre));
        } else {
            setSelectedGenres([...selectedGenres, genre]);
        }
    };

    const handleGenderSelection = (gender) => {
        setSelectedGender(gender);
    };    

    // Handle next step navigation
    const handleNext = () => {
        setStep(step + 1); // Move to the next step
    };

    // Handle previous step navigation
    const handlePrevious = () => {
        setStep(step - 1); // Move to the previous step
    };

    // Submit survey and update Firestore
    const handleSubmitSurvey = async () => {
        if (user && selectedGames.length > 0 && isVerifiedAge && isTermsAgreed) {
            try {
                const userDocRef = doc(db, 'users', user.uid);
                
                // Convert selectedGames array to an object/map
                const selectedGamesMap = selectedGames.reduce((acc, gameId) => {
                    acc[gameId] = true; // Save as an object/map
                    return acc;
                }, {});
    
                // Convert selectedPlatforms array to an object/map
                const userPlatformsMap = selectedPlatforms.reduce((acc, platform) => {
                    acc[platform] = true; // Save platforms as an object/map
                    return acc;
                }, {});
    
                await updateDoc(userDocRef, {
                    selectedGames: selectedGamesMap, // Save as an object/map
                    favoriteGameGenres: selectedGenres, // Save selected genres under favoriteGameGenres field
                    userPlatforms: userPlatformsMap, // Save platforms as an object/map
                    surveyCompleted: true,
                    emailConsent: isEmailConsent,
                    gender: selectedGender, // Add this line to store the selected gender
                    userStatus: { // Add userStatus field
                        isOnline: true, // Set isOnline to true
                        isUserQueue: false // Set isUserQueue to false
                    }
                });
                alert('Survey completed successfully!');
                navigate('/space'); // Navigate to /space
    
                // Optional: Refresh the /space page after navigation
                setTimeout(() => {
                    window.location.reload(); // Refresh the page after a short delay
                }, 500); // Adjust the delay as needed
            } catch (error) {
                console.error('Error updating user document:', error);
                alert('Failed to submit the survey. Please try again.');
            }
        } else {
            alert('Please complete all fields and agree to the terms.');
        }
    };
    

    // Handle user log out
    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate('/login');
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };

    const handlePlatformSelection = (platform) => {
        if (selectedPlatforms.includes(platform)) {
            setSelectedPlatforms(selectedPlatforms.filter(p => p !== platform)); // Deselect if already selected
        } else {
            setSelectedPlatforms([...selectedPlatforms, platform]); // Select if not already selected
        }
    };
    

    const genreIcons = {
        'FPS': faGamepad,
        'Survival': faHatWizard,
        'RPG': faDragon,
        'Strategy': faChessKnight,
        'Casual': faRunning,
        'Fighting': faFistRaised,
        'MOBA': faTowerObservation,
    };
    

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value.toLowerCase()); // Convert to lower case for case-insensitive search
    };

    // Filter the games based on the search query
    const filteredGames = allGames.filter(game =>
        game.title.toLowerCase().includes(searchQuery) // Check if game title includes the search query
    );

    return (
        <div className={styles.container}>
            {step === 1 && (
                <>
                    <div className={styles.header}>
                        <img className={styles.logo} src={orbitlogo} alt="Orbit Logo" />
                    </div>
                    <div className={styles.contentHeader}>
                        <h2>GDPR</h2>
                    </div>
                    <div className={styles.contentCard}>
                        <div className={styles.gdprPlaceholder}>
                            <img src={gdpr} alt="GDPR Image" />
                        </div>
                        <div className={styles.contentHolder}>
                            <span>Agree to the following terms to keep Orbit from running free! We are committed to protecting your privacy and ensuring that your personal data is handled securely and responsibly.</span>
                            
                            <div className={styles.buttonHolder}>
                                <label>
                                    <input 
                                        type="checkbox" 
                                        checked={isVerifiedAge} 
                                        onChange={() => setIsVerifiedAge(!isVerifiedAge)} 
                                    />
                                    I verify that I am 13+ years of age.
                                </label>

                                <label>
                                    <input 
                                        type="checkbox" 
                                        checked={isEmailConsent} 
                                        onChange={() => setIsEmailConsent(!isEmailConsent)} 
                                    />
                                    I agree to receive emails from the Orbit website.
                                </label>

                                <label>
                                    <input 
                                        type="checkbox" 
                                        checked={isTermsAgreed} 
                                        onChange={() => setIsTermsAgreed(!isTermsAgreed)} 
                                    />
                                    I agree to Orbit's Terms of Use and Privacy Policy.
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className={styles.footer}>
                        <div className={styles.progress}>Step 1 of 5</div>
                        <div className={styles.progressButton}>
                            <button
                                style={{marginRight: '1rem'}}
                                onClick={handleNext} 
                                disabled={!isVerifiedAge || !isTermsAgreed}
                            >
                                Next
                            </button>
                            <button onClick={handleLogout}>
                                Log Out
                            </button>
                        </div>
                    </div>
                </>
            )}

            {step === 2 && (
                <>
                    <div className={styles.header}>
                        <img className={styles.logo} src={orbitlogo} alt="Orbit Logo" />
                    </div>
                    <div className={styles.contentHeader}>
                        <h2>Select Your Favorite Game Genres</h2>
                    </div>
                    <div className={styles.contentCard}>
                        <div className={styles.selectionHolder1}>
                            {['FPS', 'Survival', 'RPG', 'Strategy', 'Casual', 'Fighting', 'MOBA'].map((genre) => (
                                <div
                                    key={genre}
                                    className={`${styles.genreBox} ${selectedGenres.includes(genre) ? styles.selected : ''}`}
                                    onClick={() => handleGenreSelection(genre)}
                                >
                                    <FontAwesomeIcon icon={genreIcons[genre]} size="3x" />
                                    <span>{genre}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className={styles.footer}>
                        <div className={styles.progress}>Step 2 of 5</div>
                        <div className={styles.progressButton}>
                            <button style={{ marginRight: '1rem' }} className={styles.previousButton} onClick={handlePrevious} disabled={step === 1}>
                                Previous
                            </button>
                            {/* Disable the Next button if no genres are selected */}
                            <button style={{ marginRight: '1rem' }} onClick={handleNext} disabled={selectedGenres.length === 0}>
                                Next
                            </button>
                            <button onClick={handleLogout}>
                                Log Out
                            </button>
                        </div>
                    </div>
                </>
            )}

            {step === 3 && (
                <>
                    <div className={styles.header}>
                        <img className={styles.logo} src={orbitlogo} alt="Orbit Logo" />
                    </div>
                    <div className={styles.contentHeader}>
                        <h2>Select Games You Play</h2>
                    </div>
                    <div className={styles.contentCardGame}>
                        <input
                            type="text"
                            className={styles.searchBar}
                            placeholder="Search games..."
                            value={searchQuery}
                            onChange={handleSearchChange}
                        />

                        <div className={styles.gameSelection}>
                            {/* Use filteredGames to display search results */}
                            {filteredGames.map(game => (
                                <div
                                    key={game.id}
                                    className={`${styles.gamebox} ${selectedGames.includes(game.id) ? styles.selected : ''}`}
                                    onClick={() => handleGameSelection(game.id)}
                                    style={{ backgroundImage: `url(${game.image})` }} // Set background image
                                >
                                    <span>{game.title}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className={styles.footer}>
                        <div className={styles.progress}>Step 3 of 5</div>
                        <div className={styles.progressButton}>
                            <button style={{ marginRight: '1rem' }} className={styles.previousButton} onClick={handlePrevious} disabled={step === 1}>
                                Previous
                            </button>
                            <button style={{ marginRight: '1rem' }} onClick={handleNext} disabled={selectedGames.length === 0}>
                                Next
                            </button>
                            <button onClick={handleLogout}>
                                Log Out
                            </button>
                        </div>
                    </div>
                </>
            )}

            {step === 4 && (
                <>
                    <div className={styles.header}>
                        <img className={styles.logo} src={orbitlogo} alt="Orbit Logo" />
                    </div>
                    <div className={styles.contentHeader}>
                        <h2>Select Your Platform</h2>
                    </div>
                    <div className={styles.contentCard}>
                        <div className={styles.selectionHolder}>
                            {['PC', 'Mobile', 'Xbox', 'Playstation', 'Switch', 'Wii'].map((platform) => (
                                <div
                                    key={platform}
                                    className={`${styles.genreBox} ${selectedPlatforms.includes(platform) ? styles.selected : ''}`}
                                    onClick={() => handlePlatformSelection(platform)}
                                >
                                    <span>{platform}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className={styles.footer}>
                        <div className={styles.progress}>Step 4 of 5</div>
                        <div className={styles.progressButton}>
                            <button style={{ marginRight: '1rem' }} className={styles.previousButton} onClick={handlePrevious} disabled={step === 1}>
                                Previous
                            </button>
                            {/* Disable the Next button if no platforms are selected */}
                            <button style={{ marginRight: '1rem' }} onClick={handleNext} disabled={selectedPlatforms.length === 0}>
                                Next
                            </button>
                            <button onClick={handleLogout}>
                                Log Out
                            </button>
                        </div>
                    </div>
                </>
            )}


            {step === 5 && (
                <>
                    <div className={styles.header}>
                        <img className={styles.logo} src={orbitlogo} alt="Orbit Logo" />
                    </div>
                    <div className={styles.contentHeader}>
                        <h2>Personal Info</h2>
                    </div>
                    <div className={styles.contentCardPersonal}>
                        <div className={styles.placeHolderGender}>
                            <span><i className="fa-solid fa-user"></i></span>
                            <span>Gender</span>
                        </div>
                        <div className={styles.inputAge}>
                            <div
                                className={`${styles.maleBox} ${selectedGender === 'Male' ? styles.selected : ''}`}
                                onClick={() => setSelectedGender('Male')}
                            >
                                <span style={{ marginBottom: '1rem' }}><i className="fa-solid fa-venus"></i></span>
                                <span>Male</span>
                            </div>
                            <div
                                className={`${styles.femaleBox} ${selectedGender === 'Female' ? styles.selected : ''}`}
                                onClick={() => setSelectedGender('Female')}
                            >
                                <span style={{ marginBottom: '1rem' }}><i className="fa-solid fa-mars"></i></span>
                                <span>Female</span>
                            </div>
                            <div
                                className={`${styles.neutralBox} ${selectedGender === 'Other' ? styles.selected : ''}`}
                                onClick={() => setSelectedGender('Other')}
                            >
                                <span style={{ marginBottom: '1rem' }}><i className="fa-solid fa-venus-mars"></i></span>
                                <span>Other</span>
                            </div>
                        </div>
                    </div>

                    <div className={styles.footer}>
                        <div className={styles.progress}>Step {step} of 5</div>
                        <div className={styles.progressButton}>
                            <button style={{ marginRight: '1rem' }} className={styles.previousButton} onClick={handlePrevious} disabled={step === 1}>
                                Previous
                            </button>

                            <button style={{ marginRight: '1rem' }} onClick={handleSubmitSurvey}>
                                Submit
                            </button>
                            <button onClick={handleLogout}>
                                Log Out
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export default Survey;
