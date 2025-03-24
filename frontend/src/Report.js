import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from "react-router";
import Cookies from 'js-cookie';
import Swal from 'sweetalert2';
import teamLogo from './1ds.png'; // Import the local image
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faSignOutAlt, faFlag } from '@fortawesome/free-solid-svg-icons';

function Report() {
  const [reportType, setReportType] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userAvatar, setUserAvatar] = useState(null);
  const [username, setUsername] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [file, setFile] = useState(null); // Add state for file
  const navigate = useNavigate();
  let dropdownTimeout;

  useEffect(() => {
    document.title = "Báo cáo";
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

  const handleReportTypeChange = (e) => {
    setReportType(e.target.value);
  };

  const handleDescriptionChange = (e) => {
    setDescription(e.target.value);
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const token = Cookies.get('token');
    if (!token) {
      Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: 'Bạn cần đăng nhập để gửi báo cáo',
      });
      navigate('/login');
      return;
    }

    const formData = new FormData();
    formData.append('reportType', reportType);
    formData.append('description', description);
    if (file) {
      formData.append('file', file);
    }

    axios.post('https://backend.dstcracks.site/report', formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    })
    .then(response => {
      Swal.fire({
        icon: 'success',
        title: 'Thành công',
        text: 'Báo cáo của bạn đã được gửi',
      });
      setReportType('');
      setDescription('');
      setFile(null); // Reset file input
    })
    .catch(error => {
      console.error('Error submitting report:', error);
      Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: 'Không thể gửi báo cáo của bạn',
      });
    })
    .finally(() => {
      setIsSubmitting(false);
    });
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

  const navigateToHome = () => {
    window.location.href = '/';
  };

  const navigateToRegister = () => {
    navigate('/register');
  };

  return (
    <>
    <style>
      {
        `
        body {
        user-select: none;
        }
        `
      }
    </style>
    <div style={{ height: '100vh', overflow: 'hidden' }}>
      <header style={{ backgroundColor: '#eef1f3', display: 'flex', alignItems: 'center', fontFamily: '"Playwrite Hrvatska Lijeva", Arial, sans-serif', fontSize: '40px', margin: '20px 0' }}>
        <img draggable="false" src={teamLogo} alt="Team Logo" style={{ marginLeft: '50px', marginRight: '20px', width: '10%', height: '10%', cursor: 'pointer' }} onClick={navigateToHome} />
        <div style={{ flex: 1, textAlign: 'center' }}>
          <span style={{ cursor: 'pointer' }} onClick={navigateToHome}>Death Squad <span style={{ color: 'red' }}>Team</span></span>
        </div>
        <div style={{ width: '20%', height: '10%', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginRight: '50px', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            {userAvatar ? (
              <>
                <img draggable="false" src={`https://backend.dstcracks.site/${userAvatar}`} alt="User Avatar" style={{ width: '35px', height: '35px', borderRadius: '50%', cursor: 'pointer' }} onClick={handleAvatarClick} />
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
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 80px)' }}>
        <form onSubmit={handleSubmit} style={{ width: '50%', backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Báo cáo sự cố</h2>
          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="reportType" style={{ display: 'block', marginBottom: '5px' }}>Loại báo cáo:</label>
            <select id="reportType" value={reportType} onChange={handleReportTypeChange} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}>
              <option value="">Chọn loại</option>
              <option value="bug">Lỗi</option>
              <option value="feedback">Phản hồi</option>
              <option value="request">Yêu cầu</option> {/* New option added */}
            </select>
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="description" style={{ display: 'block', marginBottom: '5px' }}>Mô tả:</label>
            <textarea id="description" value={description} onChange={handleDescriptionChange} style={{ width: '96%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd', resize: 'none', height: '150px' }} spellCheck='false' />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="file" style={{ display: 'block', marginBottom: '5px' }}>Tải lên Hình ảnh/Video:</label>
            <input type="file" id="file" accept='image/*, video/*' onChange={handleFileChange} style={{ width: '96%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <button type="submit" style={{ backgroundColor: '#3498db', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer' }} disabled={isSubmitting}>
              {isSubmitting ? 'Đang gửi...' : 'Gửi'}
            </button>
          </div>
        </form>
      </div>
    </div>
    </>
  );
}

export default Report;
