import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { auth, db, storage } from '../firebase/firebase.jsx';
import { useNavigate } from 'react-router-dom';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import styles from  './AdminConsole.module.css';

function AdminConsole() {
    const [games, setGames] = useState([]); // List of games from Firestore
    const [selectedGameId, setSelectedGameId] = useState(''); // The selected game ID
    const [selectedImage, setSelectedImage] = useState(null); // The selected image to upload
    const [uploading, setUploading] = useState(false); // State to handle uploading status
    const [searchTerm, setSearchTerm] = useState(''); // State for search input
    const [totalUsers, setTotalUsers] = useState(0);
    const [users, setUsers] = useState([]);
    const [currentPage, setCurrentPage] = useState(1); // Current page
    const [reviews, setReviews] = useState([]);
    const usersPerPage = 5; // Number of users to display per page
    const navigate = useNavigate();

    const indexOfLastUser = currentPage * usersPerPage;
    const indexOfFirstUser = indexOfLastUser - usersPerPage;
    const currentUsers = users.slice(indexOfFirstUser, indexOfLastUser);

    const totalPages = Math.ceil(users.length / usersPerPage);

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };


    //Ensure only the admin can access this page
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (!user) {
                navigate('/login');
                return;
            }

            try {
                const userDocRef = doc(db, 'users', user.uid); 
                const userDocSnap = await getDoc(userDocRef); 
                if (!userDocSnap.exists() || !userDocSnap.data().isAdmin) {
                    navigate('/login'); 
                }
            } catch (error) {
                console.error('Error checking admin status:', error);
                navigate('/login');
            }
        });

        return () => unsubscribe();
    }, [navigate]);

    // Fetch all games from Firestore
    
    useEffect(() => {
        const fetchGames = async () => {
            try {
                const gamesCollection = collection(db, 'onlineGames');
                const gamesSnapshot = await getDocs(gamesCollection);
                const gamesList = gamesSnapshot.docs.map((doc) => ({
                    id: doc.id, // Document ID
                    title: doc.data().gameTitle, // Field for game title
                    image: doc.data().gameImage, // Field for game image
                }));
                setGames(gamesList); // Set the games in state
            } catch (error) {
                console.error('Error fetching games:', error);
            }
        };

        fetchGames();
    }, []); // Empty dependency array to run this effect only once on component mount

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const usersCollection = collection(db, 'users');
                const usersSnapshot = await getDocs(usersCollection);
                const usersList = usersSnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                setUsers(usersList);
                setTotalUsers(usersList.length);
            } catch (error) {
                console.error('Error fetching users:', error);
            }
        };

        fetchUsers();
    }, []);

    // Handle game selection from dropdown
    const handleGameSelection = (event) => {
        setSelectedGameId(event.target.value);
    };

    // Handle image file selection
    const handleImageSelection = (event) => {
        setSelectedImage(event.target.files[0]);
    };

    // Handle image upload and update the selected game's gameImage field
    const handleUpload = async () => {
        if (!selectedGameId || !selectedImage) {
            alert('Please select a game and an image to upload.');
            return;
        }

        setUploading(true);
        try {
            // Create a storage reference for the image
            const storageRef = ref(storage, `gamesImages/${selectedImage.name}`);

            // Upload the image to Firebase Storage
            const snapshot = await uploadBytes(storageRef, selectedImage);
            const downloadURL = await getDownloadURL(snapshot.ref);

            // Update the gameImage field in Firestore
            const gameDocRef = doc(db, 'onlineGames', selectedGameId);
            await updateDoc(gameDocRef, {
                gameImage: downloadURL,
            });

            alert('Image uploaded and game updated successfully!');
            setSelectedImage(null);
        } catch (error) {
            console.error('Error uploading image:', error);
        } finally {
            setUploading(false);
        }
    };

    // Handle search input change
    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
    };

    const filteredGames = games.filter((game) =>
        game.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => {
        const fetchTotalUsers = async () => {
            try {
                const usersCollection = collection(db, 'users');
                const usersSnapshot = await getDocs(usersCollection);
                setTotalUsers(usersSnapshot.docs.length); // Set the total user count
            } catch (error) {
                console.error('Error fetching total users:', error);
            }
        };

        fetchTotalUsers();
    }, []);

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const reviewsCollection = collection(db, 'reviews');
                const reviewsSnapshot = await getDocs(reviewsCollection);
                const reviewsList = reviewsSnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));

                setReviews(reviewsList);
            } catch (error) {
                console.error('Error fetching users:', error);
            }
        };

        fetchReviews();
    }, []);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <span className={styles.headerText}>Admin Console</span>
                <span className={styles.buttonBack} onClick={() => navigate('/space')}>Go Back</span>
            </div>

            <div className={styles.adminBody}>
                <div className={styles.userDashboard}>
                    <span style={{fontWeight: "bold", fontSize: "20px"}}>Dashboard</span>
                    <div className={styles.userHolder}>
                        <div className={styles.totalUserBox}>
                            <span>Total Users</span>
                            <span style={{"font-weight": "bold", color: "white"}}>{totalUsers}</span>
                        </div>
                    </div>
                    <div className={styles.userList}>
                        <div className={styles.listText}>
                            <span>Users</span>
                        </div>
                        <table>
                            <tr>
                                <th>Username</th>
                                <th>Account Updated</th>
                                <th>Gender</th>
                                <th>User ID</th>
                                <th>Options</th>
                            </tr>
                            <tbody>
                                {currentUsers.map((user) => (
                                    <tr key={user.id}>
                                        <td>{user.username}</td>
                                        <td>{user.emailConsent ? 'Yes' : 'No'}</td>
                                        <td>{user.gender}</td>
                                        <td>{user.id}</td>
                                        <td>
                                            <div className={styles.deleteButton}>Delete Account</div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className={styles.pagination}>
                            {Array.from({ length: totalPages }, (_, index) => (
                                <button
                                    key={index + 1}
                                    className={currentPage === index + 1 ? styles.activePage : ''}
                                    onClick={() => handlePageChange(index + 1)}
                                >
                                    {index + 1}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                <div className={styles.gamesDashboard}>
                    <span style={{fontWeight: "bold", fontSize: "20px"}}>Games Dashboard</span>
                    <div className={styles.dashboardHolder}>
                        <div className={styles.addGamesBox}>
                            <span style={{fontSize: "1.2rem", }}>Add a Game</span>
                            {/* <span style={{"font-weight": "bold", color: "white"}}>{games.length}</span> */}
                        </div>
                        <div className={styles.manageGames}>
                            <span style={{fontSize: "1.2rem", }}>Manage a Game</span>
                            <div>
                                <label htmlFor="searchBar">Search Games:</label>
                                <input
                                    type="text"
                                    id="searchBar"
                                    value={searchTerm}
                                    onChange={handleSearchChange}
                                    placeholder="Search by game title..."
                                />
                            </div>

                            <label htmlFor="gameDropdown">Select Game:</label>
                            <select id="gameDropdown" value={selectedGameId} onChange={handleGameSelection}>
                                <option value="">-- Select a game --</option>
                                {filteredGames.length > 0 ? (
                                    filteredGames.slice(0, 10).map((game) => (
                                        <option key={game.id} value={game.id}>
                                            {game.title}
                                        </option>
                                    ))
                                ) : (
                                    <option disabled>No games found</option>
                                )}
                            </select>

                            <div>
                                <label htmlFor="imageUpload">Upload Game Image:</label>
                                <input
                                    type="file"
                                    id="imageUpload"
                                    accept="image/*"
                                    onChange={handleImageSelection}
                                />
                            </div>

                            <button onClick={handleUpload} disabled={uploading}>
                                {uploading ? 'Uploading...' : 'Upload Image'}
                            </button>

                            <button onClick={() => auth.signOut()}>Log Out</button>
                        </div>
                    </div>
                    <div className={styles.reviewSection}>
                        <span style={{fontWeight: "bold", fontSize: "20px"}}>Reviews Section</span>
                        <table>
                            <tr>
                                <th>Username</th>
                                <th>Rating</th>
                                <th>Review</th>
                                <th>Date</th>
                            </tr>
                            <tbody>
                                {reviews.map((review) => (
                                    <tr key={review.id}>
                                        <td>{review.username}</td>
                                        <td>{review.rating}</td>
                                        <td>{review.review}</td>
                                        <td>{review.date}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminConsole;
