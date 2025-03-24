import React, { useEffect, useState } from 'react';
import axios from 'axios';
import teamLogo from './1ds.png'; // Import the local image
import { useNavigate } from "react-router";
import Cookies from 'js-cookie';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faSignOutAlt, faFlag } from '@fortawesome/free-solid-svg-icons';

function App() {
  const [games, setGames] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [userAvatar, setUserAvatar] = useState(null);
  const [username, setUsername] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCheckboxes, setShowCheckboxes] = useState(false); // Add state to show/hide checkboxes
  const [selectedCategories, setSelectedCategories] = useState([]); // Add state for selected categories
  const gamesPerPage = 16;
  const navigate = useNavigate();
  let dropdownTimeout;

  useEffect(() => {
    axios.get('https://backend.dstcracks.site/games')
      .then(response => {
        const sortedGames = response.data.sort((a, b) => b.id - a.id);
        setGames(sortedGames);
      })
      .catch(error => {
        console.error('Error fetching data:', error);
      });
  }, []);

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
    const params = new URLSearchParams();
    params.append('page', currentPage);
    if (searchTerm) {
      params.append('search', searchTerm);
    }
    navigate(`?${params.toString()}`);
  }, [currentPage, searchTerm, navigate]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const page = parseInt(params.get('page'), 10);
    const search = params.get('search') || '';
    if (page) {
      setCurrentPage(page);
    } else {
      const savedPage = sessionStorage.getItem('currentPage');
      if (savedPage) {
        setCurrentPage(parseInt(savedPage, 10));
      }
    }
    setSearchTerm(search);
  }, []);

  useEffect(() => {
    document.title = "DSTCracks";
  }, []);

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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showCheckboxes && !event.target.closest('.category-dropdown')) {
        setShowCheckboxes(false);
      }
    };
  
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCheckboxes]);

  const navigateToHome = () => {
    window.location.href = '/';
  };

  const navigateToRegister = () => {
    navigate('/register');
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1); // Reset to first page on new search
  };

  const categoryMapping = {
    'hành động': 'hành động',
    'chiến lược': 'chiến lược',
    'thể thao': 'thể thao',
    'phiêu lưu': 'phiêu lưu',
    'mô phỏng': 'mô phỏng',
    'nhiều người chơi': 'nhiều người chơi',
    'Việt hóa': 'vietnamese'
  };

  const handleCategoryChange = (e) => {
    const value = categoryMapping[e.target.value] || e.target.value;
    setSelectedCategories(prevCategories =>
      e.target.checked
        ? [...prevCategories, value]
        : prevCategories.filter(category => category !== value)
    );
  };

  const toggleCheckboxes = () => {
    setShowCheckboxes(!showCheckboxes);
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

  const handleImageUrl = (url) => {
    const baseUrl = 'https://backend.dstcracks.site/';
    while (url.includes(baseUrl + baseUrl)) {
      url = url.replace(baseUrl, '');
    }
    return url;
  };

  const filteredGames = games.filter(game => {
    const matchesSearchTerm = game.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategories.length === 0 || selectedCategories.every(category => 
      Array.isArray(game.category) && 
      game.category.map(cat => cat.trim().toLowerCase()).includes(category.toLowerCase())
    );
    return matchesSearchTerm && matchesCategory;
  });

  const indexOfLastGame = currentPage * gamesPerPage;
  const indexOfFirstGame = indexOfLastGame - gamesPerPage;
  const currentGames = filteredGames.slice(indexOfFirstGame, indexOfLastGame);

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to top with smooth behavior
  };

  const pageNumbers = [];
  for (let i = 1; i <= Math.ceil(filteredGames.length / gamesPerPage); i++) {
    pageNumbers.push(i);
  }

  const renderPageNumbers = () => {
    const totalPages = pageNumbers.length;
    const maxPagesToShow = Math.min(5, totalPages); // Ensure maxPagesToShow does not exceed totalPages
    const halfMaxPagesToShow = Math.floor(maxPagesToShow / 2);
    let startPage = Math.max(1, currentPage - halfMaxPagesToShow);
    let endPage = Math.min(totalPages, currentPage + halfMaxPagesToShow);

    if (currentPage <= halfMaxPagesToShow) {
      endPage = maxPagesToShow;
    } else if (currentPage + halfMaxPagesToShow >= totalPages) {
      startPage = totalPages - maxPagesToShow + 1;
    }

    const pages = [];
    if (startPage > 1) {
      pages.push(1);
      if (startPage > 2) {
        pages.push('...');
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push('...');
      }
      pages.push(totalPages);
    }

    return pages;
  };

  const handleGameClick = (gameId) => {
    sessionStorage.setItem('currentPage', currentPage);
    navigate(`/game/${gameId}`);
  };

  return (
    <>
    <style>
      {
        `
        @import url('https://fonts.googleapis.com/css2?family=Jacquard+12&display=swap');
        .jacquard-font {
          font-family: 'Jacquard 12', sans-serif;
        }
        body{
        user-select: none;
        }
        `
      }
    </style>
      <header style={{ backgroundColor: '#eef1f3', display: 'flex', alignItems: 'center', fontFamily: '"Playwrite Hrvatska Lijeva", Arial, sans-serif', fontSize: '30px', margin: '20px 0' }}> {/* Giảm kích thước font chữ */}
        <img draggable="false" src={teamLogo} alt="Logo Đội" style={{ marginLeft: '50px', marginRight: '20px', width: '10%', height: '10%', cursor: 'pointer' }} onClick={navigateToHome} />
        <div style={{ flex: 1, textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}> {/* Đảm bảo văn bản xuất hiện trên một dòng */}
          <span className='jacquard-font' style={{ cursor: 'pointer', fontSize: '50px' }} onClick={navigateToHome}>Death Squad <span className='jacquard-font' style={{ color: 'red', fontSize: '50px' }}>Team</span></span>
        </div>
        <div style={{ width: '20%', height: '10%', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginRight: '50px', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            {userAvatar ? (
              <>
                <img draggable="false" src={`https://backend.dstcracks.site/${userAvatar}`} alt="Avatar Người Dùng" style={{ width: '35px', height: '35px', borderRadius: '50%', cursor: 'pointer' }} onClick={handleAvatarClick} />
                <span style={{ marginLeft: '10px', fontSize: '14px', fontFamily: 'Quicksand, sans-serif', fontWeight: 'bold', cursor: 'pointer' }}>{username}</span> {/* Hiển thị tên người dùng */}
                {showDropdown && (
                  <div style={{ position: 'absolute', top: '50px', right: '0', backgroundColor: '#fff', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', borderRadius: '8px', padding: '10px', zIndex: 1, width: '150px' }}>
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
            -ms-overflow-style: none;  /* IE và Edge */
            scrollbar-width: none;  /* Firefox */
          }
        `}
      </style>
      <div style={{ padding: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
        <input
          type="text"
          placeholder="🔍 Tìm kiếm trò chơi..."
          value={searchTerm}
          onChange={handleSearchChange}
          style={{ width: '30%', padding: '10px', fontSize: '16px', borderRadius: '8px', border: '1px solid #ccc' }}
        />
        <div style={{ position: 'relative' }} className="category-dropdown">
          <button 
            onClick={toggleCheckboxes} 
            style={{ 
              padding: '10px', 
              fontSize: '16px', 
              borderRadius: '8px', 
              border: '1px solid #ccc', 
              backgroundColor: '#fff', 
              cursor: 'pointer' 
            }}
          >
            Chọn Thể Loại
          </button>
          {showCheckboxes && (
            <div style={{ 
              position: 'absolute', 
              top: '100%', 
              left: 0, 
              backgroundColor: '#fff', 
              border: '1px solid #ccc', 
              borderRadius: '8px', 
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)', 
              zIndex: 2, 
              padding: '10px',
              whiteSpace: 'nowrap',
              display: 'flex',
              flexWrap: 'wrap'
            }}>
              {['hành động', 'chiến lược', 'thể thao', 'phiêu lưu', 'mô phỏng', 'nhiều người chơi', 'Việt hóa'].map(category => (
                <label key={category} style={{ marginRight: '10px' }}>
                  <input
                    type="checkbox"
                    value={category}
                    checked={selectedCategories.includes(categoryMapping[category] || category)}
                    onChange={handleCategoryChange}
                  />
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="game-list" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
        {currentGames.map((game, index) => (
          <div key={index} className="game-item" style={{ border: '1px solid #ccc', padding: '10px', margin: '20px', borderRadius: '8px', backgroundColor: '#fff', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', width: '320px', height: '220px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'transform 0.3s' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'} onClick={() => handleGameClick(game.id)}>
            <img draggable="false" src={handleImageUrl(game.image_url.startsWith('data:image/') ? game.image_url : `https://backend.dstcracks.site/${game.image_url}`)} alt={game.name} style={{ width: '300px', height: '180px', objectFit: 'cover', borderRadius: '8px' }} />
            <h2 style={{ margin: '0', transition: 'color 0.3s', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '280px' }} onMouseEnter={(e) => { e.currentTarget.style.color = '#0674ec'; }} onMouseLeave={(e) => { e.currentTarget.style.color = 'black'; }}>{game.name}</h2>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
        <ul style={{ display: 'flex', listStyle: 'none', padding: '0' }}>
          {renderPageNumbers().map((number, index) => (
            <li key={index} style={{ margin: '0 5px' }}>
              {number === '...' ? (
                <span style={{ padding: '10px 20px' }}>...</span>
              ) : (
                <button onClick={() => paginate(number)} style={{ padding: '10px 20px', cursor: 'pointer', backgroundColor: currentPage === number ? '#0674ec' : '#fff', color: currentPage === number ? '#fff' : '#0674ec', border: '1px solid #0674ec', borderRadius: '5px' }}>
                  {number}
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

export default App;
