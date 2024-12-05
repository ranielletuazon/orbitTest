import styles from './AdminButton.module.css';
import { useNavigate } from 'react-router-dom';

function AdminButton(){

    const navigate = useNavigate();

    return(
        <>

            <div className={styles.adminButton} onClick={() => navigate('/space/adminconsole')}>
                <i className="fa-solid fa-screwdriver-wrench"></i>
            </div>

        </>
    );
}

export default AdminButton