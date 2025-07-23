import React, { useEffect, useState } from 'react';
import { useNavigate,  useSearchParams } from 'react-router';
import Swal from 'sweetalert2';
import teamLogo from './1ds.png';
import Cookies from 'js-cookie';
import ReCAPTCHA from 'react-google-recaptcha';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';

function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [recaptchaToken, setRecaptchaToken] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    document.title = "Đăng nhập"; // Cập nhật tiêu đề
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
    if (searchParams.get('verified') === 'true') {
      Swal.fire({
        title: 'Xác nhận thành công!',
        text: 'Tài khoản của bạn đã được xác nhận.',
        icon: 'success',
        confirmButtonText: 'OK'
      });
    }
  }, [searchParams]);

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
    resetRecaptcha(); // Đặt lại mã reCAPTCHA mỗi khi nút đăng nhập được nhấn

    if (!recaptchaToken) {
      Swal.fire({
        title: 'Chưa xác minh reCAPTCHA!',
        text: 'Vui lòng xác minh rằng bạn không phải là robot.',
        icon: 'error',
        confirmButtonText: 'OK'
      });
      return;
    }

    if (!email) {
      Swal.fire({
        title: 'Chưa điền email!',
        text: 'Vui lòng điền email hoặc tên đăng nhập của bạn.',
        icon: 'error',
        confirmButtonText: 'OK'
      });
      return;
    }

    if (!password) {
      Swal.fire({
        title: 'Chưa điền mật khẩu!',
        text: 'Vui lòng điền mật khẩu của bạn.',
        icon: 'error',
        confirmButtonText: 'OK'
      });
      return;
    }

    Swal.fire({
      title: 'Đang đăng nhập...',
      text: 'Vui lòng chờ trong giây lát.',
      icon: 'info',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      const response = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password, recaptchaToken })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.reset_password) {
          Cookies.set('token', data.token); // Đặt token trong cookies
          Swal.fire({
            title: 'Đặt lại mật khẩu!',
            text: 'Vui lòng đặt lại mật khẩu của bạn.',
            icon: 'info',
            confirmButtonText: 'OK'
          }).then(() => {
            navigate('/reset-password'); // Chuyển đến trang đặt lại mật khẩu
          });
          return;
        }
        if (rememberMe) {
          Cookies.set('token', data.token, { expires: 7 });
        } else {
          Cookies.set('token', data.token);
        }
        Swal.fire({
          title: 'Đăng nhập thành công!',
          text: 'Bạn đã đăng nhập thành công.',
          icon: 'success',
          confirmButtonText: 'OK'
        }).then(() => {
          navigate('/'); // Chuyển đến trang chủ
        });
      } else {
        const errorData = await response.json();
        if (errorData.message.includes('reCAPTCHA verification failed: timeout')) {
          resetRecaptcha(); // Đặt lại mã reCAPTCHA mà không cần tải lại trang
          Swal.fire({
            title: 'reCAPTCHA hết hạn!',
            text: 'Vui lòng xác minh lại reCAPTCHA.',
            icon: 'error',
            confirmButtonText: 'OK'
          });
        } else if (errorData.message.includes('Tài khoản chưa được kích hoạt')) {
          Swal.fire({
            title: 'Đang gửi lại email kích hoạt...',
            text: 'Vui lòng chờ trong giây lát.',
            icon: 'info',
            allowOutsideClick: false,
            didOpen: () => {
              Swal.showLoading();
              handleResendVerification().then(() => {
                Swal.fire({
                  title: 'Email đã được gửi lại!',
                  text: 'Vui lòng kiểm tra email của bạn để kích hoạt tài khoản.',
                  icon: 'success',
                  confirmButtonText: 'OK'
                });

                // Bắt đầu kiểm tra trạng thái xác minh mỗi 5 giây
                const intervalId = setInterval(async () => {
                  try {
                    const checkResponse = await fetch(`http://localhost:5000/check-verification/${email}`);
                    const data = await checkResponse.json();
                    if (data.verified) {
                      clearInterval(intervalId);
                      Swal.fire({
                        title: 'Xác nhận thành công!',
                        text: 'Tài khoản của bạn đã được xác nhận.',
                        icon: 'success',
                        confirmButtonText: 'OK'
                      }).then(() => {
                        navigate('/login'); // Chuyển đến trang đăng nhập
                      });
                    }
                  } catch (error) {
                    console.error('Error checking verification status:', error);
                  }
                }, 5000);

                // Dừng kiểm tra sau 5 phút
                setTimeout(() => clearInterval(intervalId), 300000);
              }).catch((error) => {
                Swal.fire({
                  title: 'Gửi lại email thất bại!',
                  text: error.message || 'Có lỗi xảy ra, vui lòng thử lại.',
                  icon: 'error',
                  confirmButtonText: 'OK'
                });
              });
            }
          });
        } else {
          Swal.fire({
            title: 'Đăng nhập thất bại!',
            text: errorData.message || 'Email hoặc mật khẩu không đúng.',
            icon: 'error',
            confirmButtonText: 'OK'
          });
        }
      }
    } catch (error) {
      Swal.fire({
        title: 'Đăng nhập thất bại!',
        text: error.message || 'Có lỗi xảy ra, vui lòng thử lại.',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    }
  };

  const handleResendVerification = async () => {
    try {
      const response = await fetch('http://localhost:5000/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Có lỗi xảy ra, vui lòng thử lại.');
      }
    } catch (error) {
      throw error;
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
        <div className="cardify login" style={{ width: '450px', backgroundColor: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' }}>
          <div className="login--header" style={{ textAlign: 'center', marginBottom: '20px' }}>
            <h3>Xin chào</h3>
            <p>Đăng nhập vào tài khoản của bạn</p>
          </div>
          <div id="loginform" className="login--form">
            <form onSubmit={handleSubmit}>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label htmlFor="email">Email hoặc Tên đăng nhập:</label>
                <input id="email" type="text" className="text_field" placeholder="Nhập email hoặc tên đăng nhập của bạn" value={email} onChange={(e) => setEmail(e.target.value)} style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc', width: 'calc(100% - 20px)' }} />
              </div>
              <div className="form-group" style={{ marginBottom: '20px', position: 'relative' }}>
                <label htmlFor="password">Mật khẩu:</label>
                <input 
                  id="password" 
                  type={showPassword ? 'text' : 'password'} 
                  className="text_field" 
                  placeholder="Nhập mật khẩu của bạn" 
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
                <div className="custom_checkbox">
                  <input type="checkbox" id="ch2" name="rememberme" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                  <label htmlFor="ch2">
                    <span className="shadow_checkbox"></span>
                    <span className="label_text">Ghi nhớ đăng nhập</span>
                  </label>
                </div>
              </div>
              <div className="form-group">
                <ReCAPTCHA
                  sitekey="6LdVAo0rAAAAAL1YQ5gO8rCLtxVjCgcF6hp2tZiv"
                  onChange={handleRecaptchaChange}
                  onExpired={handleRecaptchaExpired}
                />
              </div>
              <button className="btn btn--xs" type="submit" style={{ padding: '10px', borderRadius: '5px', border: 'none', backgroundColor: '#0674ec', color: '#fff', cursor: 'pointer', width: '100%' }}>Đăng nhập</button>
            </form>
            <br />
            <br />
            <div className="login_assist" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div className="recover">
                <p><a href="/forgot-password" style={{ textDecoration: 'none' }}>Bạn quên mật khẩu ?</a></p>
              </div>
              <div className="create-account">
                <p><a href="/register" style={{ textDecoration: 'none' }}>Tạo tài khoản mới</a></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Login;