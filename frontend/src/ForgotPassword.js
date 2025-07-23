import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import Swal from 'sweetalert2';
import teamLogo from './1ds.png';

function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [recaptchaSiteKey, setRecaptchaSiteKey] = useState('');
  const [recaptchaToken, setRecaptchaToken] = useState('');

    useEffect(() => {
      document.title = "Quên mật khẩu";
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
    const fetchRecaptchaSiteKey = async () => {
      try {
        const response = await fetch('http://localhost:5000/recaptcha-site-key');
        const data = await response.json();
        setRecaptchaSiteKey(data.siteKey);
      } catch (error) {
        console.error('Error fetching reCAPTCHA site key:', error);
      }
    };

    const loadRecaptchaScript = () => {
      const script = document.createElement('script');
      script.src = 'https://www.google.com/recaptcha/api.js';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (window.grecaptcha && recaptchaSiteKey) {
          window.grecaptcha.ready(() => {
            window.grecaptcha.render('recaptcha-container', {
              sitekey: recaptchaSiteKey,
              callback: (token) => setRecaptchaToken(token)
            });
          });
        }
      };
      document.body.appendChild(script);
    };

    fetchRecaptchaSiteKey().then(loadRecaptchaScript);
  }, [recaptchaSiteKey]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      Swal.fire({
        title: 'Chưa điền email!',
        text: 'Vui lòng điền email của bạn.',
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

    Swal.fire({
      title: 'Đang gửi email...',
      text: 'Vui lòng chờ trong giây lát.',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      const response = await fetch('http://localhost:5000/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, recaptchaToken })
      });

      if (response.ok) {
        Swal.fire({
          title: 'Email đã được gửi!',
          text: 'Vui lòng kiểm tra email của bạn.',
          icon: 'success',
          confirmButtonText: 'OK'
        }).then(() => {
          navigate('/login'); // Navigate to login page
        });
      } else {
        const errorData = await response.json();
        Swal.fire({
          title: 'Gửi email thất bại!',
          text: errorData.message || 'Có lỗi xảy ra, vui lòng thử lại.',
          icon: 'error',
          confirmButtonText: 'OK'
        });
      }
    } catch (error) {
      Swal.fire({
        title: 'Gửi email thất bại!',
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
          <span style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>Death Squad <span style={{ color: 'red' }}>Team</span></span>
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
        <div className="cardify recover_pass" style={{ width: '450px', backgroundColor: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' }}>
          <div className="login--header" style={{ textAlign: 'center', marginBottom: '20px' }}>
            <p>
              Nhập email mà bạn đã đăng ký trước đây và bấm khôi phục. Bạn sẽ nhận được 1 email bao gồm tên đăng nhập và 1 mật khẩu tạm thời
              để đặt mật khẩu mới cho tài khoản của bạn. Ai quên tên đăng nhập cũng có thể dùng chức năng này để lấy lại tên đăng nhập
            </p>
          </div>
          <div className="login--form">
            <form onSubmit={handleSubmit}>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label htmlFor="email">Email:</label>
                <input id="email" type="email" className="text_field" placeholder="Nhập email của bạn" value={email} onChange={(e) => setEmail(e.target.value)} style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc', width: 'calc(100% - 20px)' }} />
              </div>
              {recaptchaSiteKey && (
                <div id="recaptcha-container"></div>
              )}
              <button className="btn btn--xs register_btn" type="submit" style={{ marginTop: '30px', padding: '10px', borderRadius: '5px', border: 'none', backgroundColor: '#0674ec', color: '#fff', cursor: 'pointer', width: '100%' }}>Khôi phục</button>
            </form>
            <div className="login_assist" style={{ marginTop: '20px', textAlign: 'center' }}>
              <p>
                Bạn đã có tài khoản thành viên ?
                <a href="/login" style={{ textDecoration: 'none' }}>Đăng nhập</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default ForgotPassword;