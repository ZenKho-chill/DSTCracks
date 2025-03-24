import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import Swal from 'sweetalert2';
import teamLogo from './1ds.png';
import ReCAPTCHA from 'react-google-recaptcha';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';

function AccountRecovery() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [recaptchaToken, setRecaptchaToken] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
      document.title = "Khôi phục tài khoản";
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

  const resetRecaptcha = () => {
    setRecaptchaToken(null);
    window.grecaptcha.reset();
  };

  const handleRecaptchaChange = (token) => {
    setRecaptchaToken(token);
  };

  const handleRecaptchaExpired = () => {
    setRecaptchaToken(null);
    Swal.fire({
      title: 'reCAPTCHA đã hết hạn!',
      text: 'Vui lòng xác minh lại reCAPTCHA.',
      icon: 'error',
      confirmButtonText: 'OK'
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    resetRecaptcha(); // Reset reCAPTCHA token each time the submit button is clicked

    if (!recaptchaToken) {
      Swal.fire({
        title: 'Chưa xác minh reCAPTCHA!',
        text: 'Vui lòng xác minh rằng bạn không phải là robot.',
        icon: 'error',
        confirmButtonText: 'OK'
      });
      return;
    }

    if (!username || !email || !password) {
      Swal.fire({
        title: 'Thiếu thông tin!',
        text: 'Vui lòng điền đầy đủ thông tin.',
        icon: 'error',
        confirmButtonText: 'OK'
      });
      return;
    }

    try {
      const response = await fetch('https://backend.dstcracks.site/reset-recovered-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, email, password, recaptchaToken })
      });

      if (response.ok) {
        Swal.fire({
          title: 'Khôi phục tài khoản thành công!',
          text: 'Mật khẩu của bạn đã được thay đổi.',
          icon: 'success',
          confirmButtonText: 'OK'
        }).then(() => {
          navigate('/login');
        });
      } else {
        const errorData = await response.json();
        Swal.fire({
          title: 'Khôi phục tài khoản thất bại!',
          text: errorData.message || 'Có lỗi xảy ra, vui lòng thử lại.',
          icon: 'error',
          confirmButtonText: 'OK'
        });
      }
    } catch (error) {
      Swal.fire({
        title: 'Khôi phục tài khoản thất bại!',
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
        <img draggable="false" src={teamLogo} alt="Logo Đội" style={{ marginLeft: '50px', marginRight: '20px', width: '10%', height: '10%', cursor: 'pointer' }} onClick={() => navigate('/')} />
        <div style={{ flex: 1, textAlign: 'center' }}>
          <span style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>Đội <span style={{ color: 'red' }}>Death Squad</span></span>
        </div>
        <div style={{ width: '20%', height: '10%', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginRight: '50px' }}>
          <button style={{ width: '115px', height: '36px', background: '#7347c1', padding: '0', margin: '0', fontSize: '15px', fontWeight: '500', color: '#fff', display: 'inline-block', boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)', transition: '0.3s ease', border: '5px solid #7347c1', borderRadius: '34px', position: 'relative', marginRight: '10px', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.background = '#5a36a1'} onMouseLeave={(e) => e.currentTarget.style.background = '#7347c1'} onClick={() => navigate('/register')}>
            Đăng ký
          </button>
          <button style={{ width: '115px', height: '36px', background: '#0674ec', padding: '0', margin: '0', fontSize: '15px', fontWeight: '500', color: '#fff', display: 'inline-block', boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)', transition: '0.3s ease', border: '5px solid #0674ec', borderRadius: '34px', position: 'relative', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.background = '#045bb5'} onMouseLeave={(e) => e.currentTarget.style.background = '#0674ec'} onClick={() => navigate('/login')}>
            Đăng nhập
          </button>
        </div>
      </header>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#eef1f3' }}>
        <div className="cardify login" style={{ width: '450px', backgroundColor: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' }}>
          <div className="login--header" style={{ textAlign: 'center', marginBottom: '20px' }}>
            <h3>Khôi phục tài khoản</h3>
            <p>Nhập thông tin của bạn để khôi phục tài khoản</p>
          </div>
          <div id="recoveryform" className="login--form">
            <form onSubmit={handleSubmit}>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label htmlFor="username">Tên đăng nhập:</label>
                <input id="username" type="text" className="text_field" placeholder="Nhập tên đăng nhập của bạn" value={username} onChange={(e) => setUsername(e.target.value)} style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc', width: 'calc(100% - 20px)' }} />
              </div>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label htmlFor="email">Email:</label>
                <input id="email" type="email" className="text_field" placeholder="Nhập email của bạn" value={email} onChange={(e) => setEmail(e.target.value)} style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc', width: 'calc(100% - 20px)' }} />
              </div>
              <div className="form-group" style={{ marginBottom: '20px', position: 'relative' }}>
                <label htmlFor="password">Mật khẩu mới:</label>
                <input 
                  id="password" 
                  type={showPassword ? 'text' : 'password'} 
                  className="text_field" 
                  placeholder="Nhập mật khẩu mới của bạn" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc', width: 'calc(100% - 20px)' }} 
                />
                <FontAwesomeIcon 
                  icon={showPassword ? faEye : faEyeSlash } 
                  onClick={() => setShowPassword(!showPassword)} 
                  style={{ position: 'absolute', right: '10px', top: '68%', transform: 'translateY(-50%)', cursor: 'pointer' }} 
                />
              </div>
              <div className="form-group">
                <ReCAPTCHA
                  sitekey="6LcWM5EqAAAAALjZNid2ubwYteboafM8T6cD-mI9"
                  onChange={handleRecaptchaChange}
                  onExpired={handleRecaptchaExpired}
                />
              </div>
              <button className="btn btn--xs" type="submit" style={{ padding: '10px', borderRadius: '5px', border: 'none', backgroundColor: '#0674ec', color: '#fff', cursor: 'pointer', width: '100%' }}>Khôi phục</button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

export default AccountRecovery;
