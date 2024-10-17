import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebase/firebase.jsx'; 
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import styles from './Space.module.css'; 

import HeaderPage from './HeaderPage.jsx';
import SidebarPage from './SidebarPage.jsx';

function Space({ user }) {
    const navigate = useNavigate();
    const [userData, setUserData] = useState(null);

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

    return (
        <>
            <div className={styles.spacePage}> 
                <HeaderPage user={user} /> {/* Pass user prop to HeaderPage */}
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
                    {/* Add the two boxes here */}
                    <div style={{ display: 'flex', marginBottom: '2rem'}}>
                        <div className={styles.chooseMultiplayerGame}></div>
                        <div className={styles.gameButton}>
                            <span>Search</span>
                        </div>
                    </div>

                    <div className={styles.popularGameTab } style={{ color: 'white', fontSize: '1.5rem', marginBottom:'2rem'}}>
                        <span>Popular Games</span>
                        <div className={styles.popularGamesHolder}>
                            <div className={styles.popularGamesBox} style={{marginRight: '1rem'}}></div>
                            <div className={styles.popularGamesBox}></div>
                        </div>
                    </div>

                    <div className={styles.recentMatchesTab } style={{ color: 'white', fontSize: '1.5rem'}}>
                        <span>Recent Match</span>
                    </div>
                </div>
                <SidebarPage/>
            </div>
        </>
    );
}

export default Space;
