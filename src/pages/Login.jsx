import logo from './assets/logo.png';
import './login.css';
import { useNavigate } from 'react-router-dom'; 

function Login() {
  const navigate = useNavigate(); 

  const handleRegisterClick = () => {navigate('/register');  };

  return (
    <div>
      <header className="header">
        <div className="header-logo">
          <img src={logo} alt="Logo" />  
        </div>
      </header>
      <div className="center-container">
        <div className="card">
          <div className="card-header">
            <h4>WELCOME BACK!</h4>
            <h5>Best of luck to your games!</h5>
          </div>
          <div className="card-body">
            <p className="card-title">EMAIL ADDRESS</p>
            <input type="email" className="input-box" />

            <p className="card-title">PASSWORD</p>
            <input type="password" className="input-box" />

              <span 
                className="card-title-a" 
                onClick={handleRegisterClick} 
                style={{ cursor: 'pointer', color: '#2cc6ff', textDecoration: 'none', marginTop: 5 }}>
                FORGOT YOUR PASSWORD?
              </span>

            <a href="#" className="btn btn-primary">Login</a>

            <p className='card-title' style={{ marginTop: 5 }}>
              Need an account?
              <span 
                className="card-title-a" 
                onClick={handleRegisterClick} 
                style={{ cursor: 'pointer', color: '#2cc6ff', textDecoration: 'none', padding: 3}}>
                REGISTER
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
