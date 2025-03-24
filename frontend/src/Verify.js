import { useParams } from 'react-router';
import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import teamLogo from './1ds.png';
import { useNavigate } from "react-router";

function Verify() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [verified, setVerified] = useState(false); // Add state for verification status

  useEffect(() => {
    document.title = "Kích hoạt tài khoản"; // Cập nhật tiêu đề
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
    const verifyAccount = async () => {
      try {
        const response = await fetch(`https://backend.dstcracks.site/verify/${token}`);
        const data = await response.json();
        if (response.ok && data.verified) {
          setVerified(true); // Set verified to true on success
          Swal.fire({
            title: 'Xác nhận thành công!',
            text: 'Tài khoản của bạn đã được xác nhận.',
            icon: 'success',
            confirmButtonText: 'OK'
          }).then(() => {
            navigate('/login'); // Điều hướng đến trang đăng nhập
          });
        } else {
          Swal.fire({
            title: 'Xác nhận thất bại!',
            text: data.message || 'Token không hợp lệ hoặc đã hết hạn.',
            icon: 'error',
            confirmButtonText: 'OK'
          });
        }
      } catch (error) {
        Swal.fire({
          title: 'Xác nhận thất bại!',
          text: 'Có lỗi xảy ra, vui lòng thử lại.',
          icon: 'error',
          confirmButtonText: 'OK'
        });
      }
    };

    verifyAccount();
  }, [token, navigate]); // Thêm navigate vào mảng phụ thuộc

  const navigateToHome = () => {
    window.location.href = '/';
  };

  const navigateToRegister = () => {
    navigate('/register', { state: { verified } }); // Truyền trạng thái verified đến Register
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
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#eef1f3' }}>
        <h2>Đang xác nhận tài khoản...</h2>
      </div>
    </>
  );
}

export default Verify;