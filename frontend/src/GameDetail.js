import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import './GameDetail.css'; // Import the CSS file
import teamLogo from './1ds.png'; // Import the local image
import Cookies from 'js-cookie';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faSignOutAlt, faFlag, faCopy } from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2';

function GameDetail() {
  const { gameId } = useParams();
  const [game, setGame] = useState(null);
  const [userAvatar, setUserAvatar] = useState(null);
  const [username, setUsername] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();
  let dropdownTimeout;

  useEffect(() => {
    axios.get(`https://backend.dstcracks.site/games/${gameId}`)
      .then(response => {
        setGame(response.data);
      })
      .catch(error => {
        console.error('Error fetching game details:', error);
      });
  }, [gameId]);

  useEffect(() => {
    const token = Cookies.get('token');
    if (token) {
      fetch('https://backend.dstcracks.site/user-info', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(response => response.json())
      .then(data => {
        setUserAvatar(data.avatar_url);
        setUsername(data.username); // Set the username
      })
      .catch(error => console.error('Error fetching user info:', error));
    }
  }, []);

  useEffect(() => {
    if (game) {
      document.title = game.name;
    }
  }, [game]);

  document.addEventListener('keydown', (event) => {
    if (
        event.key === 'F12' || 
        (event.ctrlKey && event.shiftKey && (event.key === 'I' || event.key === 'J')) || 
        (event.ctrlKey && event.key === 'U')
    ) {
        event.preventDefault();
    }
});

document.addEventListener('contextmenu', (event) => {
  event.preventDefault();
});

  const navigateToHome = () => {
    const currentPage = sessionStorage.getItem('currentPage');
    if (currentPage) {
      navigate(`/?page=${currentPage}`);
    } else {
      navigate('/');
    }
  };

  const navigateToRegister = () => {
    navigate('/register');
  };

  const handleMouseEnter = () => {
    clearTimeout(dropdownTimeout);
    setShowDropdown(true);
  };

  const handleMouseLeave = () => {
    dropdownTimeout = setTimeout(() => {
      setShowDropdown(false);
    }, 500); // Delay of 500ms
  };

  const handleAvatarClick = () => {
    setShowDropdown(!showDropdown);
  };

  const handleLogout = () => {
    Cookies.remove('token');
    window.location.reload(); // Reload the page
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
      Swal.fire({
        // position: "top-end",
        icon: "success",
        title: "Sao chép mật khẩu thành công",
        showConfirmButton: false,
        timer: 1000
      });
    }).catch(err => {
      console.error('Failed to copy: ', err);
    });
  }

  const handleImageUrl = (url) => {
    const baseUrl = 'https://backend.dstcracks.site/';
    while (url.includes(baseUrl + baseUrl)) {
      url = url.replace(baseUrl, '');
    }
    return url;
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const page = params.get('page');
    if (page) {
      sessionStorage.setItem('previousPage', page);
    }
  }, []);

  if (!game) {
    return <div>Đang tải...</div>;
  }

  const isLoggedIn = !!Cookies.get('token');

  return (
    <>
    <style>
      {
        `
        @import url('https://fonts.googleapis.com/css2?family=Jacquard+12&display=swap');
        .jacquard-font {
          font-family: 'Jacquard 12', sans-serif;
        }
        `
      }
    </style>
      <header style={{ backgroundColor: '#eef1f3', display: 'flex', alignItems: 'center', fontFamily: '"Playwrite Hrvatska Lijeva", Arial, sans-serif', fontSize: '40px', margin: '20px 0' }}>
        <img draggable="false" src={teamLogo} alt="Logo Đội" style={{ marginLeft: '50px', marginRight: '20px', width: '10%', height: '10%', cursor: 'pointer' }} onClick={navigateToHome} />
        <div style={{ flex: 1, textAlign: 'center' }}>
          <span className='jacquard-font' style={{ cursor: 'pointer', fontSize: '50px' }} onClick={navigateToHome}>Death Squad <span className='jacquard-font' style={{ color: 'red', fontSize: '50px' }}>Team</span></span>
        </div>
        <div style={{ width: '20%', height: '10%', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginRight: '50px', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            {userAvatar ? (
              <>
                <img draggable="false" src={`https://backend.dstcracks.site/${userAvatar}`} alt="Ảnh đại diện người dùng" style={{ width: '35px', height: '35px', borderRadius: '50%', cursor: 'pointer' }} onClick={handleAvatarClick} />
                <span style={{ marginLeft: '10px', fontSize: '14px', fontFamily: 'Quicksand, sans-serif', fontWeight: 'bold', cursor: 'pointer' }}>{username}</span> {/* Display the username */}
                {showDropdown && (
                  <div style={{ position: 'absolute', top: '50px', right: '0', backgroundColor: '#fff', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', borderRadius: '8px', padding: '10px', zIndex: 1, width: '100px' }}>
                    <button onClick={() => navigate('/profile')} style={{ display: 'block', width: '100%', padding: '10px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', transition: 'background 0.3s, color 0.3s', borderRadius: '8px', whiteSpace: 'nowrap' }} onMouseEnter={(e) => { e.currentTarget.style.background = '#0674ec'; e.currentTarget.style.color = '#f7ffff'; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'inherit'; }}>
                      <FontAwesomeIcon icon={faUser} style={{ marginRight: '8px' }} /> Hồ sơ
                    </button>
                    <button onClick={() => navigate('/report')} style={{ display: 'block', width: '100%', padding: '10px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', transition: 'background 0.3s, color 0.3s', borderRadius: '8px', whiteSpace: 'nowrap' }} onMouseEnter={(e) => { e.currentTarget.style.background = '#0674ec'; e.currentTarget.style.color = '#f7ffff'; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'inherit'; }}>
                      <FontAwesomeIcon icon={faFlag} style={{ marginRight: '8px' }} /> Báo cáo
                    </button>
                    <button onClick={handleLogout} style={{ display: 'block', width: '100%', padding: '10px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', transition: 'background 0.3s, color 0.3s', borderRadius: '8px', whiteSpace: 'nowrap' }} onMouseEnter={(e) => { e.currentTarget.style.background = '#0674ec'; e.currentTarget.style.color = '#f7ffff'; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'inherit'; }}>
                      <FontAwesomeIcon icon={faSignOutAlt} style={{ marginRight: '8px' }} /> Đăng xuất
                    </button>
                  </div>
                )}
              </>
            ) : (
              <>
                <button style={{ width: '115px', height: '36px', background: '#7347c1', padding: '0', margin: '0', fontSize: '15px', fontWeight: '500', color: '#fff', display: 'inline-block', boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)', transition: '0.3s ease', border: '5px solid #7347c1', borderRadius: '34px', position: 'relative', marginRight: '10px', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.background = '#5a36a1'} onMouseLeave={(e) => e.currentTarget.style.background = '#7347c1'} onClick={navigateToRegister}>
                  Đăng ký
                </button>
                <button style={{ width: '115px', height: '36px', background: '#0674ec', padding: '0', margin: '0', fontSize: '15px', fontWeight: '500', color: '#fff', display: 'inline-block', boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)', transition: '0.3s ease', border: '5px solid #0674ec', borderRadius: '34px', position: 'relative', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.background = '#045bb5'} onMouseLeave={(e) => e.currentTarget.style.background = '#0674ec'} onClick={() => navigate('/login')}>
                  Đăng nhập
                </button>
              </>
            )}
          </div>
        </div>
      </header>
      <style>
        {`
          ::-webkit-scrollbar {
            display: none;
          }
          html {
            -ms-overflow-style: none;  /* IE and Edge */
            scrollbar-width: none;  /* Firefox */
          }
          body{
          user-select: none;
          }
        `}
      </style>
      <div className="game-detail-container">
        <img 
          src={handleImageUrl(`${game.image_url}`)} 
          alt={game.name} 
          className="game-image" // Add a class for the image
          draggable="false"
        />
        <div className="game-info gray-text" style={{ textAlign: 'center', margin: '0 auto' }}>
          <span>Phát hành: {formatDate(game.release_date)}</span>
          <span>Bởi: {game.updated_by}</span>
          <span>Cập nhật: {formatDate(game.update_date)}</span>
        </div>
        <h1 className="game-title">{game.name}</h1> {/* Center the game name */}
        <p style={{ textAlign: 'justify', maxWidth: '90%', margin: '0 auto' }} dangerouslySetInnerHTML={{ __html: game.description }}></p> {/* Render multi-line description with justified text */}
        <div className="game-requirements" style={{ maxWidth: '90%', margin: '0 auto' }}>
          <div style={{ width: '45%' }}>
            <h3>Tối thiểu:</h3>
            <p dangerouslySetInnerHTML={{ __html: game.minimum_requirements }}></p>
          </div>
          <div style={{ width: '45%' }}>
            <h3>Khuyến nghị:</h3>
            <p dangerouslySetInnerHTML={{ __html: game.recommended_requirements }}></p>
          </div>
        </div>
        <p style={{ maxWidth: '90%', textAlign: 'justify', margin: '0 auto' }}><strong>Thể loại:</strong> {game.category.join(', ')}</p>
        {isLoggedIn ? (
          <>
            <div style={{ textAlign: 'center', margin: '20px 0' }}>
              <p><strong>Mật khẩu giải nén:</strong> linkneverdie.com <FontAwesomeIcon icon={faCopy} style={{ cursor: 'pointer' }} onClick={() => copyToClipboard('linkneverdie.com')} /> hoặc LND <FontAwesomeIcon icon={faCopy} style={{ cursor: 'pointer' }} onClick={() => copyToClipboard('LND')} /></p>
            </div>
            <h3 style={{ textAlign: 'center', width: '90%', margin: '0 auto' }}>Link tải {game.name}</h3> {/* Change the text */}
            <p style={{ textAlign: 'center', maxWidth: '90%', fontWeight: 'bold', color: 'red', margin: '0 auto' }} dangerouslySetInnerHTML={{ __html: game.notes }}></p> {/* Render notes with justified text */}
            <ul style={{ listStyleType: 'none', paddingLeft: 0, textAlign: 'center', maxWidth: '90%', margin: '0 auto' }}> {/* Remove bullet points and center the links */}
              {Array.isArray(game.latest_download_links) ? game.latest_download_links.map((link, index) => (
                <li key={index}><a href={link.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', fontWeight: 'bold', fontSize: '16px' }}>{link.name}</a></li>
              )) : <li>Không có link nào</li>}
            </ul>
            <br></br>
            {game.update_links.length > 0 && (
              <>
                <h3 style={{ textAlign: 'center', maxWidth: '90%', margin: '0 auto' }}>Link cập nhật</h3>
                <ul style={{ listStyleType: 'none', paddingLeft: 0, textAlign: 'center', maxWidth: '90%', margin: '0 auto' }}> {/* Remove bullet points and center the links */}
                  {game.update_links.map((link, index) => (
                    <li key={index}><a href={link.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', fontWeight: 'bold', fontSize: '16px' }}>{link.name}</a></li>
                  ))}
                </ul>
                <br></br>
              </>
            )}
            {game.old_download_links.length > 0 && (
              <>
                <h3 style={{ textAlign: 'center', maxWidth: '90%', margin: '0 auto' }}>Link tải bản cũ</h3>
                <ul style={{ listStyleType: 'none', paddingLeft: 0, textAlign: 'center', maxWidth: '90%', margin: '0 auto' }}> {/* Remove bullet points and center the links */}
                  {game.old_download_links.map((link, index) => (
                    <li key={index}><a href={link.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', fontWeight: 'bold', fontSize: '16px' }}>{link.name}</a></li>
                  ))}
                </ul>
                <br></br>
              </>
            )}
            {game.vietnamese_link.length > 0 && (
              <>
                <h3 style={{ textAlign: 'center', maxWidth: '90%', margin: '0 auto' }}>Link việt hóa</h3>
                <ul style={{ listStyleType: 'none', paddingLeft: 0, textAlign: 'center', maxWidth: '90%', margin: '0 auto' }}> {/* Remove bullet points and center the links */}
                  {game.vietnamese_link.map((link, index) => (
                    <li key={index}><a href={link.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', fontWeight: 'bold', fontSize: '16px' }}>{link.name}</a></li>
                  ))}
                </ul>
                <br></br>
              </>
            )}
          </>
        ) : (
          <div style={{ textAlign: 'center', margin: '20px 0' }}>
            <p style={{ fontWeight: 'bold', color: 'red' }}>Vui lòng đăng nhập để xem các link tải game.</p>
            <button style={{ width: '115px', height: '36px', background: '#0674ec', padding: '0', margin: '0', fontSize: '15px', fontWeight: '500', color: '#fff', display: 'inline-block', boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)', transition: '0.3s ease', border: '5px solid #0674ec', borderRadius: '34px', position: 'relative', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.background = '#045bb5'} onMouseLeave={(e) => e.currentTarget.style.background = '#0674ec'} onClick={() => navigate('/login')}>
              Đăng nhập
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export default GameDetail;
