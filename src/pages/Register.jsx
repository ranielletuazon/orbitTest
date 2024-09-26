import logo from './assets/logo.png';
import { useNavigate } from 'react-router-dom';

function Register() {
    let navigate = useNavigate();

    const handleLoginClick = () => {
        navigate('/login');
    };

    return (
        <div>
            <header className='header'>
                <div className="header-logo">
                    <img src={logo} alt="Logo" />
                </div>
            </header>
            <div className="center-container" style={{ margin: 0 }}>
                <div className="card">
                    <div className="card-header">
                        <h4>CREATE AN ACCOUNT</h4>
                    </div>
                    <div className="card-body">
                        <p className="card-title">EMAIL ADDRESS</p>
                        <input type="email" className="input-box" placeholder="" />

                        <p className="card-title">USERNAME</p>
                        <input type="text" className="input-box" placeholder="" />

                        <p className="card-title">PASSWORD</p>
                        <input type="password" className="input-box" placeholder="" />

                        <p className="card-title">DATE OF BIRTH</p>
                        <input type="date" className="input-box-birth" />

                        <span className="btn btn-primary" style={{ marginTop: 27 }}>Continue</span>

                        <span 
                            className="card-title-a" 
                            onClick={handleLoginClick} 
                            style={{ cursor: 'pointer', color: '#2cc6ff', textDecoration: 'none', padding: 3 }}>
                            ALREADY HAVE AN ACCOUNT?
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Register;
