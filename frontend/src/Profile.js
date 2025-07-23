import React, { useEffect, useState, useRef } from 'react';
import teamLogo from './1ds.png'; // Import the local image
import { useNavigate } from "react-router";
import Cookies from 'js-cookie';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faSignOutAlt, faEdit, faPen, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons'; // Import faPen, faEye, and faEyeSlash icons
import Swal from 'sweetalert2'; // Import SweetAlert2
import ReCAPTCHA from 'react-google-recaptcha'; // Import ReCAPTCHA

function Profile() {
  const [userAvatar, setUserAvatar] = useState(null);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState(''); // Add state for email
  const [createdAt, setCreatedAt] = useState(''); // Add state for created_at
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null); // Add state for selected image
  const [showEditForm, setShowEditForm] = useState(false); // Add state for showing edit form
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState(''); // Add state for current password
  const [confirmNewPassword, setConfirmNewPassword] = useState(''); // Add state for confirm new password
  const [showPassword, setShowPassword] = useState(false); // Add state for toggling password visibility
  const [showNewPassword, setShowNewPassword] = useState(false); // Add state for toggling new password visibility
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); // Add state for toggling confirm password visibility
  const [isButtonDisabled, setIsButtonDisabled] = useState(false); // Add state for button disable
  const [recaptchaToken, setRecaptchaToken] = useState(''); // Add state for reCAPTCHA token
  const [role, setRole] = useState(''); // Add state for user role
  const recaptchaRef = useRef(null); // Add ref for reCAPTCHA
  const navigate = useNavigate();
  let dropdownTimeout;

    useEffect(() => {
      document.title = "Thông tin tài khoản";
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
      fetch('http://localhost:5000/user-info', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(response => response.json())
      .then(data => {
        setUserAvatar(data.avatar_url);
        setUsername(data.username); // Set the username
        setEmail(data.email); // Set the email
        setCreatedAt(data.created_at); // Set the created_at
        setRole(data.role); // Set the user role
      })
      .catch(error => console.error('Lỗi khi lấy thông tin người dùng:', error));
    }

    const urlParams = new URLSearchParams(window.location.search);
    const verificationToken = urlParams.get('token');
    if (verificationToken) {
      fetch(`http://localhost:5000/verify/${verificationToken}`)
        .then(response => response.json())
        .then(data => {
          if (data.verified && data.newEmail) {
            setEmail(data.newEmail);
            Swal.fire({
              position: 'top-end',
              icon: 'success',
              title: 'Email đã được xác nhận thành công',
              showConfirmButton: false,
              timer: 1500
            });
          }
        })
        .catch(error => console.error('Lỗi khi xác nhận email:', error));
    }

    const wss = new WebSocket('wss://backend.dstcracks.site');
    wss.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'emailUpdate') {
        window.location.reload(); // Reload the page
      }
    };

    return () => {
      wss.close();
    };
  }, []);

  const navigateToHome = () => {
    window.location.href = '/';
  };

  const handleMouseEnter = () => {
    clearTimeout(dropdownTimeout);
    setShowDropdown(true);
  };

  const handleMouseLeave = () => {
    dropdownTimeout = setTimeout(() => {
      setShowDropdown(false);
    }, 300); // Delay of 300ms
  };

  const handleDropdownMouseEnter = () => {
    clearTimeout(dropdownTimeout);
    setShowDropdown(true);
  };

  const handleDropdownMouseLeave = () => {
    setShowDropdown(false);
  };

  const handleAvatarClick = () => {
    document.getElementById('fileInput').click(); // Trigger file input click
  };

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirm = async () => {
    const token = Cookies.get('token');
    try {
      const response = await fetch('http://localhost:5000/update-avatar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ image: selectedImage })
      });

      if (response.ok) {
        const data = await response.json();
        setUserAvatar(data.avatar_url);
        setSelectedImage(null);
        Swal.fire({
          icon: 'success',
          title: 'Đổi avatar thành công',
          showConfirmButton: false,
          timer: 1500
        });
      } else {
        console.error('Lỗi khi đổi avatar:', response.statusText);
      }
    } catch (error) {
      console.error('Lỗi khi đổi avatar:', error);
    }
  };

  const handleCancel = () => {
    setSelectedImage(null);
  };

  const handleLogout = () => {
    Cookies.remove('token');
    navigateToHome(); // Redirect to home page
  };

  const formatDate = (dateString) => {
    const options = { day: '2-digit', month: 'long', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('vi-VN', options).replace(' tháng ', ' Tháng ');
  };

  const handleEditInfoClick = () => {
    if (showEditForm) {
      setNewUsername('');
      setNewEmail('');
      setNewPassword('');
      setCurrentPassword('');
      setConfirmNewPassword('');
    }
    setShowEditForm(!showEditForm);
  };

  const handleCancelEdit = () => {
    setNewUsername('');
    setNewEmail('');
    setNewPassword('');
    setCurrentPassword('');
    setConfirmNewPassword('');
    setShowEditForm(false);
  };

  const handleUpdateInfo = async () => {
    if (!recaptchaToken) {
      Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: 'Vui lòng xác nhận reCAPTCHA',
      });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: 'Mật khẩu mới và xác nhận mật khẩu không khớp',
      });
      return;
    }

    const token = Cookies.get('token');
    try {
      Swal.fire({
        title: 'Đang xử lý...',
        text: 'Vui lòng chờ trong giây lát',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      let lastResponse;
      let emailChanged = false;

      if (newUsername) {
        lastResponse = await fetch('http://localhost:5000/change-username', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'recaptcha-token': recaptchaToken // Include reCAPTCHA token in headers
          },
          body: JSON.stringify({ newUsername })
        });

        if (lastResponse.ok) {
          setUsername(newUsername);
        } else {
          const data = await lastResponse.json();
          Swal.fire({
            icon: 'error',
            title: 'Lỗi',
            text: data.message,
          });
          return;
        }
      }

      if (newEmail) {
        lastResponse = await fetch('http://localhost:5000/change-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'recaptcha-token': recaptchaToken // Include reCAPTCHA token in headers
          },
          body: JSON.stringify({ newEmail })
        });

        if (lastResponse.ok) {
          setEmail(newEmail);
          emailChanged = true;
        } else {
          const data = await lastResponse.json();
          Swal.fire({
            icon: 'error',
            title: 'Lỗi',
            text: data.message,
          });
          return;
        }
      }

      if (newPassword && currentPassword) {
        lastResponse = await fetch('http://localhost:5000/change-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'recaptcha-token': recaptchaToken // Include reCAPTCHA token in headers
          },
          body: JSON.stringify({ currentPassword, newPassword, confirmNewPassword })
        });

        if (!lastResponse.ok) {
          const data = await lastResponse.json();
          Swal.fire({
            icon: 'error',
            title: 'Lỗi',
            text: data.message,
          });
          return;
        }
      }

      setShowEditForm(false);
      Swal.fire({
        icon: 'success',
        title: emailChanged ? 'Email đã được thay đổi. Vui lòng kiểm tra email mới để xác nhận.' : 'Cập nhật thông tin thành công',
        showConfirmButton: false,
        timer: 1500
      }).then(() => {
        window.location.reload(); // Reload the page after success message
      });
    } catch (error) {
      console.error('Lỗi khi cập nhật thông tin:', error);
    } finally {
      recaptchaRef.current.reset(); // Reset reCAPTCHA
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleNewPasswordVisibility = () => {
    setShowNewPassword(!showNewPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleButtonClick = (callback) => {
    if (!isButtonDisabled) {
      callback();
      setIsButtonDisabled(true);
      setTimeout(() => setIsButtonDisabled(false), 2000); // 2-second delay
    }
  };

  const onRecaptchaChange = (token) => {
    setRecaptchaToken(token);
  };

  const navigateToAdminDashboard = () => {
    navigate('/admin-dashboard');
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
        `
      }
    </style>
      <header style={{ backgroundColor: '#eff1f5', display: 'flex', alignItems: 'center', fontFamily: '"Playwrite Hrvatska Lijeva", Arial, sans-serif', fontSize: '40px', margin: '20px 0' }}>
        <img draggable="false" src={teamLogo} alt="Team Logo" style={{ marginLeft: '50px', marginRight: '20px', width: '10%', height: '10%', cursor: 'pointer' }} onClick={navigateToHome} />
        <div style={{ flex: 1, textAlign: 'center' }}>
          <span className='jacquard-font' style={{ cursor: 'pointer', fontSize: '50px' }} onClick={navigateToHome}>Death Squad <span className='jacquard-font' style={{ color: 'red', fontSize: '50px' }}>Team</span></span>
        </div>
        <div style={{ width: '20%', height: '10%', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginRight: '50px', position: 'relative' }} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
          {userAvatar ? (
            <>
              <img draggable="false" src={`http://localhost:5000/${userAvatar}`} alt="User Avatar" style={{ width: '35px', height: '35px', borderRadius: '50%', cursor: 'pointer' }} onClick={handleAvatarClick} />
              <span style={{ marginLeft: '10px', fontSize: '14px', fontFamily: 'Quicksand, sans-serif', fontWeight: 'bold' }}>{username}</span> {/* Display the username */}
              {showDropdown && (
                <div style={{ position: 'absolute', top: '50px', right: '0', backgroundColor: '#fff', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', borderRadius: '8px', padding: '10px', zIndex: 1 }} onMouseEnter={handleDropdownMouseEnter} onMouseLeave={handleDropdownMouseLeave}>
                  <button onClick={() => navigate('/profile')} style={{ display: 'block', width: '100%', padding: '10px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', transition: 'background 0.3s, color 0.3s', borderRadius: '8px', whiteSpace: 'nowrap' }} onMouseEnter={(e) => { e.currentTarget.style.background = '#0674ec'; e.currentTarget.style.color = '#f7ffff'; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'inherit'; }}>
                    <FontAwesomeIcon icon={faUser} style={{ marginRight: '8px' }} /> Hồ sơ
                  </button>
                  <button onClick={handleLogout} style={{ display: 'block', width: '100%', padding: '10px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', transition: 'background 0.3s, color 0.3s', borderRadius: '8px', whiteSpace: 'nowrap' }} onMouseEnter={(e) => { e.currentTarget.style.background = '#0674ec'; e.currentTarget.style.color = '#f7ffff'; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'inherit'; }}>
                    <FontAwesomeIcon icon={faSignOutAlt} style={{ marginRight: '8px' }} /> Đăng xuất
                  </button>
                </div>
              )}
            </>
          ) : (
            <>
              <button style={{ width: '115px', height: '36px', background: '#7347c1', padding: '0', margin: '0', fontSize: '15px', fontWeight: '500', color: '#fff', display: 'inline-block', boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)', transition: '0.3s ease', border: '5px solid #7347c1', borderRadius: '34px', position: 'relative', marginRight: '10px', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.background = '#5a36a1'} onMouseLeave={(e) => e.currentTarget.style.background = '#7347c1'} onClick={() => navigate('/register')}>
                Đăng ký
              </button>
              <button style={{ width: '115px', height: '36px', background: '#0674ec', padding: '0', margin: '0', fontSize: '15px', fontWeight: '500', color: '#fff', display: 'inline-block', boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)', transition: '0.3s ease', border: '5px solid #0674ec', borderRadius: '34px', position: 'relative', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.background = '#045bb5'} onMouseLeave={(e) => e.currentTarget.style.background = '#0674ec'} onClick={() => navigate('/login')}>
                Đăng nhập
              </button>
            </>
          )}
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
            background-color: #eff1f5; /* Set background color */
          }
          body {
          user-select: none;
          }
          .author_avatar {
            position: relative;
          }
          .author_avatar img {
            transition: opacity 0.3s ease;
          }
          .author_avatar:hover img {
            opacity: 0.5;
            cursor: pointer;
          }
          .author_avatar:hover .edit-icon {
            display: block;
          }
          .edit-icon {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 24px;
            color: black;
            cursor: pointer;
            z-index: 1;
            display: none;
          }
          .swal2-button {
            background-color: #3085d6;
            color: white;
            border: none;
            border-radius: 5px;
            padding: 10px 20px;
            font-size: 16px;
            cursor: pointer;
            margin: 5px;
            transition: background-color 0.3s;
          }
          .swal2-button:hover {
            background-color: #2874a6;
          }
          .swal2-cancel {
            background-color: #aaa;
          }
          .swal2-cancel:hover {
            background-color: #888;
          }
          .edit-info {
            position: absolute;
            top: 10px;
            right: 10px;
            cursor: pointer;
            border: 1px solid #ccc;
            padding: 5px 10px;
            border-radius: 5px;
            background-color: #f9f9f9;
            display: flex;
            align-items: center;
          }
          .edit-info:hover {
            background-color: #e9e9e9;
          }
          .edit-form {
            margin-top: 20px;
            display: flex;
            flex-direction: column;
            gap: 10px;
            align-items: flex-start;
          }
          .edit-form p {
            margin-bottom: 5px; /* Reduce the space below the labels */
          }
          .edit-form input {
            margin-bottom: 10px; /* Reduce the space below the input fields */
            padding: 10px;
            border: 1px solid #ccc;
            border-radius: 5px;
            width: 450px; /* Adjust width to account for 38px margin on both sides */
            margin-right: 38px; /* Add right margin */
            padding-right: 40px; /* Add padding to the right for the icon */
          }
          .password-icon {
            position: absolute;
            right: 50px;
            top: 40%;
            transform: translateY(-50%);
            cursor: pointer;
          }
          .button-group {
            display: flex;
            gap: 10px;
            width: 500px; /* Match the width of the input form */
            margin-left: 2px; /* Align with the input form */
            margin-right: 2px; /* Adjust for the right margin of the input form */
          }
          .cancel-button {
            flex: 1;
            background-color: #aaa;
            color: white;
            border: none;
            border-radius: 5px;
            padding: 10px 20px;
            font-size: 16px;
            cursor: pointer;
            transition: background-color 0.3s;
          }
          .cancel-button:hover {
            background-color: #888;
          }
          .update-button {
            flex: 3;
            background-color: #3085d6;
            color: white;
            border: none;
            border-radius: 5px;
            padding: 10px 20px;
            font-size: 16px;
            cursor: pointer;
            transition: background-color 0.3s;
          }
          .update-button:hover {
            background-color: #2874a6;
          }
        `}
      </style>
      <section className="author-profile-area">
        <div className="container">
          <div className="row" style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
            <aside className="sidebar sidebar_author" style={{ flex: '0 0 auto', marginBottom: '0' }}>
              <div className="author-card sidebar-card">
                <div className="author-infos" style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '8px', width: '360px', height: '300px', textAlign: 'center', marginBottom: '0' }}>
                  <div className="author_avatar" onClick={handleAvatarClick} >
                    <img draggable="false" src={selectedImage || (userAvatar && `http://localhost:5000/${userAvatar}`)} alt="User Avatar" style={{ width: '160px', height: '160px', borderRadius: '50%' }} />
                    <FontAwesomeIcon icon={faEdit} className="edit-icon" />
                  </div>
                  <input type="file" id="fileInput" style={{ display: 'none' }} accept="image/*" onChange={handleImageChange} />
                  {selectedImage && (
                    <div style={{ marginTop: '20px', textAlign: 'center' }}>
                      <button onClick={handleConfirm} className="swal2-button">Xác nhận</button>
                      <button onClick={handleCancel} className="swal2-button swal2-cancel">Hủy</button>
                    </div>
                  )}
                  <div className="author">
                    <h4>{username}</h4>
                    <p>Tham gia: {formatDate(createdAt)}</p> {/* Format the created_at date */}
                    {role === 'admin' || role === 'owner' ? (
                      <button onClick={navigateToAdminDashboard} className="swal2-button">Trang quản trị</button>
                    ) : null}
                  </div>
                </div>
              </div>
            </aside>
            <div className="about_author" style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '8px', width: '500px', height: 'auto', marginLeft: '20px', marginBottom: '0', position: 'relative' }}>
              <div className="edit-info" onClick={() => handleButtonClick(handleEditInfoClick)}>
                Thay đổi thông tin <FontAwesomeIcon icon={faPen} style={{ marginLeft: '5px' }} />
              </div>
              <h2>
                Thông tin tài khoản <span> {username}</span>
              </h2>
              {!showEditForm && (
                <>
                  <p><span style={{ fontWeight: 'bold' }}>Tên đăng nhập:</span> {username}</p>
                  <p><span style={{ fontWeight: 'bold' }}>Email:</span> {email}</p>
                </>
              )}
              {showEditForm && (
                <div className="edit-form">
                  <p>Tên người dùng</p>
                  <input type="text" placeholder={username} value={newUsername} onChange={(e) => setNewUsername(e.target.value)} />
                  <p>Email</p>
                  <input type="email" placeholder={email} value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
                  <p>Mật khẩu</p>
                  <div style={{ position: 'relative' }}>
                    <input type={showPassword ? "text" : "password"} placeholder="Mật khẩu hiện tại" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                    <FontAwesomeIcon icon={showPassword ? faEye : faEyeSlash} onClick={togglePasswordVisibility} className="password-icon" />
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input type={showNewPassword ? "text" : "password"} placeholder="Mật khẩu mới" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                    <FontAwesomeIcon icon={showNewPassword ? faEye : faEyeSlash} onClick={toggleNewPasswordVisibility} className="password-icon" />
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input type={showConfirmPassword ? "text" : "password"} placeholder="Xác nhận mật khẩu mới" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} />
                    <FontAwesomeIcon icon={showConfirmPassword ? faEye : faEyeSlash} onClick={toggleConfirmPasswordVisibility} className="password-icon" />
                  </div>
                  <ReCAPTCHA
                    ref={recaptchaRef}
                    sitekey="6LdVAo0rAAAAAL1YQ5gO8rCLtxVjCgcF6hp2tZiv" // Replace with your reCAPTCHA site key
                    onChange={onRecaptchaChange}
                  />
                  <div className="button-group">
                    <button onClick={handleUpdateInfo} className="update-button">Cập nhật</button>
                    <button onClick={handleCancelEdit} className="cancel-button">Hủy</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default Profile;