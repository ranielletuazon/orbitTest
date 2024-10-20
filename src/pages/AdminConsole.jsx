import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { auth, db, storage } from '../firebase/firebase.jsx';
import { useNavigate } from 'react-router-dom';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

function AdminConsole() {
    const [games, setGames] = useState([]); // List of games from Firestore
    const [selectedGameId, setSelectedGameId] = useState(''); // The selected game ID
    const [selectedImage, setSelectedImage] = useState(null); // The selected image to upload
    const [uploading, setUploading] = useState(false); // State to handle uploading status
    const [searchTerm, setSearchTerm] = useState(''); // State for search input
    const navigate = useNavigate();

    const adminUID = '9uIKwsGZGbRzKo9SfMnWqD8Vbhu1'; // Admin UID

    // Ensure only the admin can access this page
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (!user || user.uid !== adminUID) {
                alert('You are not authorized to access this page.');
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

    // Filtered games based on search term (case-insensitive)
    const filteredGames = games.filter((game) =>
        game.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div style={{color: 'white'}}>
            <h1>Admin Console</h1>
            <h2>Manage Game Images</h2>

            {/* Search bar for filtering games */}
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

            {/* Game selection dropdown */}
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

            {/* Image file input */}
            <div>
                <label htmlFor="imageUpload">Upload Game Image:</label>
                <input
                    type="file"
                    id="imageUpload"
                    accept="image/*"
                    onChange={handleImageSelection}
                />
            </div>

            {/* Upload button */}
            <button onClick={handleUpload} disabled={uploading}>
                {uploading ? 'Uploading...' : 'Upload Image'}
            </button>

            {/* Logout button */}
            <button onClick={() => auth.signOut()}>Log Out</button>
        </div>
    );
}

export default AdminConsole;
