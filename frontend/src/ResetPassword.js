import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import Swal from 'sweetalert2';
import Cookies from 'js-cookie';
import teamLogo from './1ds.png';
import ReCAPTCHA from 'react-google-recaptcha';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';

function ResetPassword() {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [recaptchaToken, setRecaptchaToken] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    document.title = "Đặt lại mật khẩu";
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!newPassword) {
      Swal.fire({
        title: 'Chưa nhập mật khẩu mới!',
        text: 'Vui lòng nhập mật khẩu mới của bạn.',
        icon: 'error',
        confirmButtonText: 'OK'
      });
      return;
    }

    if (!confirmPassword) {
      Swal.fire({
        title: 'Chưa nhập mật khẩu xác nhận!',
        text: 'Vui lòng nhập mật khẩu xác nhận của bạn.',
        icon: 'error',
        confirmButtonText: 'OK'
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      Swal.fire({
        title: 'Mật khẩu không khớp!',
        text: 'Vui lòng xác nhận lại mật khẩu của bạn.',
        icon: 'error',
        confirmButtonText: 'OK'
      });
      return;
    }

    if (!recaptchaToken) {
        Swal.fire({
          title: 'Chưa xác minh reCAPTCHA!',
          text: 'Vui lòng xác minh rằng bạn không phải là robot.',
          icon: 'error',
          confirmButtonText: 'OK'
        });
        return;
      }

    try {
      const token = Cookies.get('token');
      if (!token) {
        Swal.fire({
          title: 'Unauthorized!',
          text: 'No token found. Please log in again.',
          icon: 'error',
          confirmButtonText: 'OK'
        });
        return;
      }

      const response = await fetch('http://localhost:5000/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ newPassword, recaptchaToken })
      });

      if (response.ok) {
        Swal.fire({
          title: 'Đặt lại mật khẩu thành công!',
          text: 'Mật khẩu của bạn đã được đặt lại thành công.',
          icon: 'success',
          confirmButtonText: 'OK'
        }).then(() => {
          navigate('/login'); // Navigate to login page
        });
      } else {
        const errorData = await response.json();
        Swal.fire({
          title: 'Đặt lại mật khẩu thất bại!',
          text: errorData.message || 'Có lỗi xảy ra, vui lòng thử lại.',
          icon: 'error',
          confirmButtonText: 'OK'
        });
      }
    } catch (error) {
      Swal.fire({
        title: 'Đặt lại mật khẩu thất bại!',
        text: error.message || 'Có lỗi xảy ra, vui lòng thử lại.',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    }
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
      <header style={{ backgroundColor: '#eef1f3', display: 'flex', alignItems: 'center', fontFamily: '"Playwrite Hrvatska Lijeva", Arial, sans-serif', fontSize: '40px', margin: '20px 0' }}>
        <img draggable="false" src={teamLogo} alt="Team Logo" style={{ marginLeft: '50px', marginRight: '20px', width: '10%', height: '10%', cursor: 'pointer' }} onClick={() => navigate('/')} />
        <div style={{ flex: 1, textAlign: 'center' }}>
          <span style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>Death Squad <span style={{ color: 'red' }}>Team</span></span>
        </div>
        <div style={{ width: '20%', height: '10%', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginRight: '50px' }}>
          <button style={{ width: '115px', height: '36px', background: '#7347c1', padding: '0', margin: '0', fontSize: '15px', fontWeight: '500', color: '#fff', display: 'inline-block', boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)', transition: '0.3s ease', border: '5px solid #7347c1', borderRadius: '34px', position: 'relative', marginRight: '10px', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.background = '#5a36a1'} onMouseLeave={(e) => e.currentTarget.style.background = '#7347c1'} onClick={() => navigate('/register')}>
            Register
          </button>
          <button style={{ width: '115px', height: '36px', background: '#0674ec', padding: '0', margin: '0', fontSize: '15px', fontWeight: '500', color: '#fff', display: 'inline-block', boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)', transition: '0.3s ease', border: '5px solid #0674ec', borderRadius: '34px', position: 'relative', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.background = '#045bb5'} onMouseLeave={(e) => e.currentTarget.style.background = '#0674ec'} onClick={() => navigate('/login')}>
            Login
          </button>
        </div>
      </header>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#eef1f3' }}>
        <div className="cardify reset-password" style={{ width: '450px', backgroundColor: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' }}>
          <div className="reset-password--header" style={{ textAlign: 'center', marginBottom: '20px' }}>
            <h3>Đặt lại mật khẩu</h3>
            <p>Vui lòng nhập mật khẩu mới của bạn</p>
          </div>
          <div id="resetpasswordform" className="reset-password--form">
            <form onSubmit={handleSubmit}>
              <div className="form-group" style={{ marginBottom: '20px', position: 'relative' }}>
                <label htmlFor="newPassword">Mật khẩu mới:</label>
                <input id="newPassword" type={showPassword ? 'text' : 'password'} className="text_field" placeholder="Nhập mật khẩu mới của bạn" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc', width: 'calc(100% - 20px)' }} />
                <FontAwesomeIcon icon={showPassword ? faEye : faEyeSlash} onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '10px', top: '35px', cursor: 'pointer' }} />
              </div>
              <div className="form-group" style={{ marginBottom: '20px', position: 'relative' }}>
                <label htmlFor="confirmPassword">Xác nhận mật khẩu:</label>
                <input id="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} className="text_field" placeholder="Xác nhận mật khẩu mới của bạn" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc', width: 'calc(100% - 20px)' }} />
                <FontAwesomeIcon icon={showConfirmPassword ? faEye : faEyeSlash} onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={{ position: 'absolute', right: '10px', top: '35px', cursor: 'pointer' }} />
              </div>
              <div className="form-group">
                <ReCAPTCHA
                  sitekey="6LdVAo0rAAAAAL1YQ5gO8rCLtxVjCgcF6hp2tZiv"
                  onChange={(token) => setRecaptchaToken(token)}
                />
              </div>
              <button className="btn btn--xs" type="submit" style={{ padding: '10px', borderRadius: '5px', border: 'none', backgroundColor: '#0674ec', color: '#fff', cursor: 'pointer', width: '100%' }}>Đặt lại mật khẩu</button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

export default ResetPassword;