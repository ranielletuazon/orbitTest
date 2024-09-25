import './header.css';  
import logo from './assets/logo.png'; 
import { useNavigate } from 'react-router-dom'; 

function Header() {
  const navigate = useNavigate(); 

  const handleLoginClick = () => {
    navigate('/login');  
  };

  return (
    <header className="header">
      <div className="header-logo">
        <img src={logo} alt="Logo" />  
      </div>
      <div className="header-login">
        <button className="login-btn" onClick={handleLoginClick}>Login</button>
      </div>
    </header>
  );
}

export default Header;
