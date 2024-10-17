import React from 'react';
import styles from './SidebarPage.module.css';

function SidebarPage() {
    return (
        <div className={styles.sidebarPage}>
            <div className={styles.matchesTitle}>
                <div style={{ marginBottom: '10px' }}>Matches</div>
                <div className={styles.matchedUsersHolder}>
                    {/* <div className={styles.usersHolder}>
                        <img 
                            src={profileImageUrl} 
                            alt="Profile" 
                            className={styles.profileImage} 
                        />
                        <div className={styles.userName}>rainrain</div>
                    </div> */}
                </div>
            </div>
        </div>
    );
}

export default SidebarPage;
