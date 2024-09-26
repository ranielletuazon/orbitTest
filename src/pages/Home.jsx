import './home.css';
import Header from './Header.jsx';  
import { useNavigate } from 'react-router-dom'; 

function Home() {
  return (
    <div>
        <Header />
        <div className="home-container">
          <div className="home-content">
            <h1>EXPLORE AND FIND YOUR IDEAL TEAM</h1>
            <h3>Orbit will help you find your preferred team-mate, friend, and community to achieve your best expectation in your game. Comes with own space to chat, chill and hang-out. </h3>
          </div>
        </div>
    </div>
  );
}

export default Home;
