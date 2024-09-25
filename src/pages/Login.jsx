import logo from './assets/logo.png';
import './login.css';

function Login() {
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

            <a href="#"><p className="card-title-a">FORGOT YOUR PASSWORD?</p></a>

            <a href="#" className="btn btn-primary">Login</a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
