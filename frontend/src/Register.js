/* global grecaptcha */
import { useNavigate, useLocation } from "react-router";
import { useEffect, useState } from "react";
import Swal from 'sweetalert2';
import teamLogo from './1ds.png'; // Import the local image
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import bcrypt from 'bcryptjs';

function Register() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [showRePassword, setShowRePassword] = useState(false);

  useEffect(() => {
    document.title = "Đăng ký";
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
    if (location.state?.verified) {
      Swal.fire({
        title: 'Xác nhận thành công!',
        text: 'Tài khoản của bạn đã được xác nhận.',
        icon: 'success',
        confirmButtonText: 'OK'
      }).then(() => {
        navigate('/login'); // Navigate to login page
      });
    }
  }, [location.state, navigate]); // Add navigate to dependency array

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://www.google.com/recaptcha/api.js";
    script.async = true;
    script.defer = true;

    script.onload = () => {
      if (window.grecaptcha) {
        window.grecaptcha.ready(() => {
          const recaptchaElement = document.getElementById('recaptcha');
          if (recaptchaElement && !recaptchaElement.hasChildNodes()) {
            window.grecaptcha.render('recaptcha', {
              sitekey: '6LcWM5EqAAAAALjZNid2ubwYteboafM8T6cD-mI9'
            });
          }
        });
      }
    };

    script.onerror = () => {
      Swal.fire({
        title: 'Lỗi tải reCAPTCHA!',
        text: 'Không thể tải reCAPTCHA. Vui lòng kiểm tra kết nối mạng của bạn và thử lại.',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    };

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    document.title = "Đăng ký"; // Cập nhật tiêu đề
  }, []);

  const navigateToHome = () => {
    window.location.href = '/';
  };

  const navigateToRegister = () => {
    navigate('/register');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const email = document.getElementById('emailtxt').value;
    const username = document.getElementById('usernametxt').value;
    const password = document.getElementById('passtxt').value;
    const repassword = document.getElementById('repasstxt').value;
    const recaptchaResponse = grecaptcha.getResponse();

    if (!email) {
      Swal.fire({
        title: 'Chưa điền email!',
        text: 'Vui lòng điền email của bạn.',
        icon: 'error',
        confirmButtonText: 'OK'
      });
      return;
    }
    if (!email.endsWith('@gmail.com')) {
      Swal.fire({
        title: 'Email không hợp lệ!',
        text: 'Vui lòng nhập email có đuôi @gmail.com.',
        icon: 'error',
        confirmButtonText: 'OK'
      });
      return;
    }
    if (!username) {
      Swal.fire({
        title: 'Chưa điền username!',
        text: 'Vui lòng điền username của bạn.',
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
    if (!repassword) {
      Swal.fire({
        title: 'Chưa điền mật khẩu xác nhận!',
        text: 'Vui lòng xác nhận mật khẩu của bạn.',
        icon: 'error',
        confirmButtonText: 'OK'
      });
      return;
    }
    if (password !== repassword) {
      Swal.fire({
        title: 'Mật khẩu không khớp!',
        text: 'Mật khẩu và mật khẩu xác nhận không khớp.',
        icon: 'error',
        confirmButtonText: 'OK'
      });
      return;
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    if (!recaptchaResponse) {
      Swal.fire({
        title: 'Chưa xác nhận reCAPTCHA!',
        text: 'Vui lòng xác nhận bạn không phải là robot.',
        icon: 'error',
        confirmButtonText: 'OK'
      });
      return;
    }

    Swal.fire({
      title: 'Đang gửi email xác nhận...',
      text: 'Vui lòng chờ trong giây lát.',
      icon: 'info',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      const response = await fetch('https://backend.dstcracks.site/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, username, password: hashedPassword })
      });

      if (response.ok) {
        Swal.fire({
          title: 'Đăng ký thành công!',
          text: 'Bạn đã đăng ký tài khoản thành công. Vui lòng kiểm tra email để xác nhận tài khoản.',
          icon: 'success',
          confirmButtonText: 'OK'
        });

        // Start checking verification status every 5 seconds
        const intervalId = setInterval(async () => {
          try {
            const checkResponse = await fetch(`https://backend.dstcracks.site/check-verification/${email}`);
            const data = await checkResponse.json();
            if (data.verified) {
              clearInterval(intervalId);
              Swal.fire({
                title: 'Xác nhận thành công!',
                text: 'Tài khoản của bạn đã được xác nhận.',
                icon: 'success',
                confirmButtonText: 'OK'
              }).then(() => {
                navigate('/login'); // Navigate to login page
              });
            }
          } catch (error) {
            console.error('Error checking verification status:', error);
          }
        }, 5000);

        // Stop checking after 5 minutes
        setTimeout(() => clearInterval(intervalId), 300000);
      } else {
        const errorData = await response.json();
        Swal.fire({
          title: 'Đăng ký thất bại!',
          text: errorData.message || 'Có lỗi xảy ra, vui lòng thử lại.',
          icon: 'error',
          confirmButtonText: 'OK'
        });
      }
    } catch (error) {
      Swal.fire({
        title: 'Đăng ký thất bại!',
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
        <img draggable="false" src={teamLogo} alt="Logo Đội" style={{ marginLeft: '50px', marginRight: '20px', width: '10%', height: '10%', cursor: 'pointer' }} onClick={navigateToHome} />
        <div style={{ flex: 1, textAlign: 'center' }}>
          <span style={{ cursor: 'pointer' }} onClick={navigateToHome}>Death Squad <span style={{ color: 'red' }}>Team</span></span>
        </div>
        <div style={{ width: '20%', height: '10%', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginRight: '50px' }}>
          <button style={{ width: '115px', height: '36px', background: '#7347c1', padding: '0', margin: '0', fontSize: '15px', fontWeight: '500', color: '#fff', display: 'inline-block', boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)', transition: '0.3s ease', border: '5px solid #7347c1', borderRadius: '34px', position: 'relative', marginRight: '10px', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.background = '#5a36a1'} onMouseLeave={(e) => e.currentTarget.style.background = '#7347c1'} onClick={navigateToRegister}>
            Đăng ký
          </button>
          <button style={{ width: '115px', height: '36px', background: '#0674ec', padding: '0', margin: '0', fontSize: '15px', fontWeight: '500', color: '#fff', display: 'inline-block', boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)', transition: '0.3s ease', border: '5px solid #0674ec', borderRadius: '34px', position: 'relative', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.background = '#045bb5'} onMouseLeave={(e) => e.currentTarget.style.background = '#0674ec'} onClick={() => navigate('/login')}>
            Đăng nhập
          </button>
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
        `}
      </style>
      <div className="cardify signup_form" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#eef1f3', overflow: 'hidden' }}>
        <div style={{ width: '450px', backgroundColor: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' }}>
          <div className="login--header" style={{ textAlign: 'center', marginBottom: '20px' }}>
            <h3>Tạo tài khoản</h3>
            <p>Hãy điền đầy đủ thông tin bên dưới để đăng ký tài khoản thành viên Death Squad Team</p>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="login--form" style={{ width: '100%' }}>
              <div className="form-group" style={{ marginBottom: '20px', position: 'relative' }}>
                <label htmlFor="emailtxt">Email:</label>
                <input id="emailtxt" type="text" className="text_field" placeholder="Nhập email của bạn" name="email" autoComplete="off" style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc', width: 'calc(100% - 20px)' }} />
                <span id="emailerrortxt" className="text-danger" style={{ color: 'red', float: 'right', marginBottom: '20px', display: 'none' }}></span>
              </div>
              <div className="form-group" style={{ marginBottom: '20px', position: 'relative' }}>
                <label htmlFor="usernametxt">Tên đăng nhập:</label>
                <input id="usernametxt" type="text" className="text_field" placeholder="Nhập tên đăng nhập" name="username" autoComplete="off" style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc', width: 'calc(100% - 20px)' }} />
                <span id="usernameerrortxt" className="text-danger" style={{ color: 'red', float: 'right', marginBottom: '20px', display: 'none' }}></span>
              </div>
              <div className="form-group" style={{ marginBottom: '20px', position: 'relative' }}>
                <label htmlFor="passtxt">Mật khẩu:</label>
                <input id="passtxt" type={showPassword ? 'text' : 'password'} className="text_field" placeholder="Nhập mật khẩu" name="pass" style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc', width: 'calc(100% - 20px)' }} />
                <span id="passerrortxt" className="text-danger" style={{ color: 'red', float: 'right', marginBottom: '20px' }}></span>
                <FontAwesomeIcon icon={showPassword ? faEye : faEyeSlash} onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '10px', top: '35px', cursor: 'pointer' }} />
              </div>
              <div className="form-group" style={{ marginBottom: '20px', position: 'relative' }}>
                <label htmlFor="repasstxt">Nhập lại mật khẩu</label>
                <input id="repasstxt" type={showRePassword ? 'text' : 'password'} className="text_field" placeholder="Nhập lại mật khẩu" name="repass" style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc', width: 'calc(100% - 20px)' }} />
                <span id="repasserrortxt" className="text-danger" style={{ color: 'red', float: 'right', marginBottom: '20px', display: 'none' }}></span>
                <FontAwesomeIcon icon={showRePassword ? faEye : faEyeSlash } onClick={() => setShowRePassword(!showRePassword)} style={{ position: 'absolute', right: '10px', top: '35px', cursor: 'pointer' }} />
              </div>
              <div className="g-recaptcha" id="recaptcha" data-sitekey="6LcWM5EqAAAAALjZNid2ubwYteboafM8T6cD-mI9" style={{ marginBottom: '20px' }}></div>
              <button className="btn btn--xs register_btn" type="submit" style={{ padding: '10px', borderRadius: '5px', border: 'none', backgroundColor: '#0674ec', color: '#fff', cursor: 'pointer', width: '100%' }}>Đăng ký</button>
              <div className="login_assist" style={{ textAlign: 'center', marginTop: '20px' }}>
                <p>Bạn đã có tài khoản thành viên ? <a href="/signin" onClick={(e) => { e.preventDefault(); navigate('/login'); }} style={{ textDecoration: 'none' }}>Đăng nhập</a></p>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default Register;