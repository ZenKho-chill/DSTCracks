import React, { useEffect, useState } from 'react';
import { useNavigate, Routes, Route } from "react-router";
import Cookies from 'js-cookie';
import Swal from 'sweetalert2';
import teamLogo from './1ds.png'; // Import the local image
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'; // Import FontAwesomeIcon
import { faUsers, faGamepad, faFlag, faArrowLeft, faPen, faPlus, faSpinner } from '@fortawesome/free-solid-svg-icons'; // Import specific icons
import Switch from "react-switch"; // Import the Switch component

// Use an online placeholder image URL
const placeholderImage = 'https://placehold.co/500';

function getUsageColor(percentage) {
  if (percentage <= 69) {
    return '#2cff05'; // Green color for 0-50%
  } else if (percentage <= 89) {
    return '#FDFD49';
  } else {
    return 'red';
  }
}

const usageBarStyle = {
  transition: 'width 0.5s ease-in-out, background-color 0.5s ease-in-out', // Add transition for smooth animation and color change
  height: '10px',
  borderRadius: '5px'
};

const getRoleColor = (role) => {
  switch (role) {
    case 'owner':
      return '#e74c3c'; // Red for owner
    case 'admin':
      return '#f39c12'; // Orange for admin
    case 'user':
      return '#2ecc71'; // Green for user
    default:
      return 'black'; // Default color
  }
};

const getRoleDisplayOrder = (role) => {
  switch (role) {
    case 'owner':
      return 1;
    case 'admin':
      return 2;
    case 'user':
      return 3;
    default:
      return 4;
  }
};

const sortUsers = (a, b) => {
  const roleOrder = getRoleDisplayOrder(a.role) - getRoleDisplayOrder(b.role);
  if (roleOrder !== 0) {
    return roleOrder;
  }
  return a.id - b.id; // Sort by ID in ascending order within the same role
};

function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [cpuUsage, setCpuUsage] = useState(0);
  const [memoryUsage, setMemoryUsage] = useState(0);
  const [diskUsage, setDiskUsage] = useState(0);
  const [cpuInfo, setCpuInfo] = useState({ cores: 0, speed: 0 });
  const [memoryInfo, setMemoryInfo] = useState({ total: 0, used: 0 });
  const [diskInfo, setDiskInfo] = useState({ total: 0, used: 0 });
  const [selectedMenu, setSelectedMenu] = useState('users'); // Change to useState
  const [selectedRole, setSelectedRole] = useState('member'); // Default to 'member'
  const [searchTerm, setSearchTerm] = useState(''); // Add search term state
  const [games, setGames] = useState([]); // Add state for games
  const [selectedGame, setSelectedGame] = useState(null); // Add state for selected game
  const [gameDetails, setGameDetails] = useState({
    name: '',
    image_url: '',
    description: '',
    minimum_requirements: '',
    game_link: '',
    recommended_requirements: '',
    latest_download_links: [],
    update_links: [],
    old_download_links: [],
    vietnamese_link: [],
    notes: '',
    version: '', // Add version field
    release_date: '', // Add release_date field
    category: '', // Add category field
    update_links_enabled: false, // Add update_links_enabled field
    old_download_links_enabled: false, // Add old_download_links_enabled field
    vietnamese_link_enabled: false // Remove link_game field
  });
  const [initialGameName, setInitialGameName] = useState(''); // Add state for initial game name
  const [initialGameDescription, setInitialGameDescription] = useState(''); // Add state for initial game description
  const [isChanged, setIsChanged] = useState(false); // Add state to track changes
  const [searchGameTerm, setSearchGameTerm] = useState(''); // Add search term state for games
  const [selectedCategories, setSelectedCategories] = useState([]); // Add state for selected categories
  const [showCheckboxes, setShowCheckboxes] = useState(false); // Add state to show/hide checkboxes
  const [reports, setReports] = useState([]); // Add state for reports
  const [selectedReport, setSelectedReport] = useState(null); // Add state for selected report
  const [searchReportTerm, setSearchReportTerm] = useState(''); // Add search term state for reports
  const [selectedStatus, setSelectedStatus] = useState('pending'); // Add state for selected status
  const [loading, setLoading] = useState(false); // Add loading state
  const [saveLoading, setSaveLoading] = useState(false); // Add save loading state
  const navigate = useNavigate();

  const toggleCheckboxes = () => {
    setShowCheckboxes(!showCheckboxes);
  };

  useEffect(() => {
    document.title = "Admin Dashboard"; // Set the document title
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
    if (!token) {
      navigate('/login');
      return;
    }

    setLoading(true); // Set loading to true when fetching data
    fetch('https://backend.dstcracks.site/user-info', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => response.json())
    .then(data => {
      if (data.role !== 'admin' && data.role !== 'owner') {
        navigate('/');
        return;
      }
      Cookies.set('userId', data.id); // Store user ID in cookies
      Cookies.set('userRole', data.role); // Store user role in cookies
      fetch('https://backend.dstcracks.site/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(response => response.json())
      .then(data => {
        setUsers(data);
        setFilteredUsers(data);
        setLoading(false); // Set loading to false after data is fetched
      })
      .catch(error => {
        console.error('Error fetching users:', error);
        Swal.fire({
          icon: 'error',
          title: 'Lỗi',
          text: 'Không thể tải danh sách người dùng',
        });
        setLoading(false); // Set loading to false on error
      });
    })
    .catch(error => {
      console.error('Error fetching user info:', error);
      navigate('/');
      setLoading(false); // Set loading to false on error
    });

    const wss = new WebSocket('wss://backend.dstcracks.site');
    wss.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'systemUsage') {
        setCpuUsage(data.cpuUsage);
        setMemoryUsage(data.memoryUsage);
        setDiskUsage(data.diskUsage);
        setCpuInfo({ cores: data.cpuCores, speed: data.cpuSpeed });
        setMemoryInfo({ total: Math.round(data.totalMemory), used: Number(data.usedMemory).toFixed(2) });
        setDiskInfo({ total: Math.round(data.totalDisk), used: Number(data.usedDisk).toFixed(2) });
      } else if (data.type === 'userUpdate') {
        setUsers(data.users);
        setFilteredUsers(data.users);
      } else if (data.type === 'gameUpdate') {
        setGames(data.games);
      } else if (data.type === 'reportUpdate') {
        setReports(data.reports);
      }
    };

    return () => {
      wss.close();
    };
  }, [navigate]);

  useEffect(() => {
    document.body.style.overflow = 'hidden'; // Disable scrolling for the webpage
    return () => {
      document.body.style.overflow = 'auto'; // Restore scrollbar on component unmount
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = 'auto'; // Allow scrolling
    document.body.style.scrollbarWidth = 'none'; // Hide scrollbar for Firefox
    document.body.style.msOverflowsstyle = 'none'; // Hide scrollbar for IE and Edge

    const style = document.createElement('style');
    style.innerHTML = `
      ::-webkit-scrollbar {
        display: none; /* Hide scrollbar for Chrome, Safari, and Opera */
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.body.style.overflow = 'auto'; // Restore scrollbar on component unmount
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    let filtered = users;
    if (selectedRole !== 'all') {
      filtered = filtered.filter(user => user.role === selectedRole);
    }
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.id.toString().includes(searchTerm) ||
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setSelectedRole('all'); // Automatically switch to 'all' when a search term is entered
    }
    setFilteredUsers(filtered);
  }, [selectedRole, searchTerm, users]);

  useEffect(() => {
    // Fetch games when the selected menu is 'games'
    if (selectedMenu === 'games') {
      setLoading(true); // Set loading to true when fetching data
      fetch('https://backend.dstcracks.site/games')
        .then(response => response.json())
        .then(data => {
          const correctedData = data.map(game => {
            let imageUrl = game.image_url;
            if (imageUrl && imageUrl.startsWith('https://backend.dstcracks.site/https://backend.dstcracks.site/')) {
              imageUrl = imageUrl.replace('https://backend.dstcracks.site/https://backend.dstcracks.site/', 'https://backend.dstcracks.site/');
            }
            return { ...game, image_url: imageUrl };
          });
          setGames(correctedData);
          setLoading(false); // Set loading to false after data is fetched
        })
        .catch(error => {
          console.error('Error fetching games:', error);
          Swal.fire({
            icon: 'error',
            title: 'Lỗi',
            text: 'Không thể tải danh sách trò chơi',
          });
          setLoading(false); // Set loading to false on error
        });
    }
  }, [selectedMenu]);

  useEffect(() => {
    if (selectedGame && selectedGame !== 'new') {
      fetch(`https://backend.dstcracks.site/games/${selectedGame}`, {
        headers: {
          'Authorization': `Bearer ${Cookies.get('token')}`
        }
      })
      .then(response => response.json())
      .then(data => {
        let imageUrl = data.image_url;
        if (imageUrl && imageUrl.includes('https://backend.dstcracks.site/')) {
          const parts = imageUrl.split('https://backend.dstcracks.site/');
          imageUrl = 'https://backend.dstcracks.site/' + parts[parts.length - 1];
        }
        setGameDetails({
          ...data,
          image_url: imageUrl,
          update_links_enabled: data.update_links.length > 0,
          old_download_links_enabled: data.old_download_links.length > 0,
          vietnamese_link_enabled: data.vietnamese_link.length > 0 // Remove link_game field
        });
        setInitialGameName(data.name); // Set the initial game name
        setInitialGameDescription(data.description); // Set the initial game description
        setIsChanged(false); // Reset the change state
      })
      .catch(error => {
        console.error('Error fetching game details:', error);
        Swal.fire(
          'Lỗi!',
          'Không thể tải thông tin trò chơi.',
          'error'
        );
      });
    }
  }, [selectedGame]);

  useEffect(() => {
    if (selectedMenu === 'report') {
      const token = Cookies.get('token');
      setLoading(true); // Set loading to true when fetching data
      fetch('https://backend.dstcracks.site/reports', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(response => response.json())
      .then(data => {
        setReports(data);
        setLoading(false); // Set loading to false after data is fetched
      })
      .catch(error => {
        console.error('Error fetching reports:', error);
        setLoading(false); // Set loading to false on error
      });
    }
  }, [selectedMenu]);
 
  useEffect(() => {
    const hash = window.location.hash.substring(1);
    if (hash) {
      setSelectedMenu(hash);
    }
  }, []);

  const handleDeleteUser = (userId, userRole) => {
    const token = Cookies.get('token');
    const currentUserId = parseInt(Cookies.get('userId')); // Assuming userId is stored in cookies
    const currentUserRole = Cookies.get('userRole'); // Assuming userRole is stored in cookies
    if (userId === currentUserId || (currentUserRole === 'admin' && userRole !== 'member') || (currentUserRole === 'owner' && userRole === 'owner')) {
      Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: 'Bạn không thể xóa tài khoản này',
      });
      return;
    }
    Swal.fire({
      title: 'Bạn có chắc chắn?',
      text: "Bạn sẽ không thể hoàn tác hành động này!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Xóa'
    }).then((result) => {
      if (result.isConfirmed) {
        fetch(`https://backend.dstcracks.site/admin/users/${userId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        .then(response => {
          if (response.ok) {
            setUsers(users.filter(user => user.id !== userId));
            Swal.fire(
              'Đã xóa!',
              'Người dùng đã được xóa.',
              'success'
            );
          } else {
            Swal.fire(
              'Lỗi!',
              'Không thể xóa người dùng.',
              'error'
            );
          }
        })
        .catch(error => {
          console.error('Error deleting user:', error);
          Swal.fire(
            'Lỗi!',
            'Không thể xóa người dùng.',
            'error'
          );
        });
      }
    });
  };

  const handleBanUser = (userId, isBanned, userRole) => {
    const token = Cookies.get('token');
    const currentUserId = parseInt(Cookies.get('userId')); // Assuming userId is stored in cookies
    const currentUserRole = Cookies.get('userRole'); // Assuming userRole is stored in cookies

    if (userId === currentUserId || (currentUserRole === 'admin' && userRole !== 'member') || (currentUserRole === 'owner' && userRole === 'owner')) {
      Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: 'Bạn không thể cấm tài khoản này',
      });
      return;
    }
    const action = isBanned ? 'unban' : 'ban';
    const confirmText = isBanned ? 'Bạn muốn bỏ cấm người dùng này?' : 'Bạn muốn cấm người dùng này?';
    const successText = isBanned ? 'Người dùng đã được bỏ cấm.' : 'Người dùng đã bị cấm.';

    Swal.fire({
      title: 'Bạn có chắc chắn?',
      text: confirmText,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: isBanned ? 'Bỏ cấm' : 'Cấm'
    }).then((result) => {
      if (result.isConfirmed) {
        fetch(`https://backend.dstcracks.site/admin/users/${action}/${userId}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        .then(response => {
          if (response.ok) {
            setUsers(users.map(user => user.id === userId ? { ...user, banned: !isBanned } : user));
            Swal.fire(
              'Thành công!',
              successText,
              'success'
            );
          } else {
            Swal.fire(
              'Lỗi!',
              `Không thể ${isBanned ? 'bỏ cấm' : 'cấm'} người dùng.`,
              'error'
            );
          }
        })
        .catch(error => {
          console.error(`Error ${isBanned ? 'unbanning' : 'banning'} user:`, error);
          Swal.fire(
            'Lỗi!',
            `Không thể ${isBanned ? 'bỏ cấm' : 'cấm'} người dùng.`,
            'error'
          );
        });
      }
    });
  };

  const handleViewUserInfo = (userId) => {
    const token = Cookies.get('token');
    const currentUserId = Cookies.get('userId'); // Assuming userId is stored in cookies
    if (userId === currentUserId) {
      Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: 'Bạn không thể thay đổi thông tin của chính mình',
      });
      return;
    }
    fetch(`https://backend.dstcracks.site/admin/users/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => response.json())
    .then(data => {
      Swal.fire({
        title: 'Thông tin người dùng',
        html: `
          <div style="text-align: left;">
            <p><strong>ID:</strong> ${data.id}</p>
            <p><strong>Tên đăng nhập:</strong> ${data.username}</p>
            <p><strong>Email:</strong> ${data.email}</p>
            <p><strong>Vai trò:</strong> ${data.role}</p>
          </div>
        `,
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: 'Chỉnh sửa',
        cancelButtonText: 'Đóng'
      }).then((result) => {
        if (result.isConfirmed) {
          let timerInterval;
          Swal.fire({
            title: 'Cảnh báo',
            text: 'Bạn có chắc chắn muốn chỉnh sửa thông tin người dùng này? Hãy đợi 5 giây để tiếp tục.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Tiếp tục',
            cancelButtonText: 'Hủy',
            timer: 5000,
            timerProgressBar: true,
            didOpen: () => {
              Swal.showLoading();
              timerInterval = setInterval(() => {}, 100);
            },
            willClose: () => {
              clearInterval(timerInterval);
            }
          }).then((result) => {
            if (result.dismiss === Swal.DismissReason.timer) {
              Swal.fire({
                title: 'Chỉnh sửa thông tin người dùng',
                html: `
                  <input type="email" id="email" class="swal2-input" placeholder="${data.email}">
                  <input type="text" id="username" class="swal2-input" placeholder="${data.username}">
                  <input type="password" id="password" class="swal2-input" placeholder="Mật khẩu mới">
                `,
                showCancelButton: true,
                confirmButtonText: 'Lưu',
                cancelButtonText: 'Hủy',
                preConfirm: () => {
                  const email = Swal.getPopup().querySelector('#email').value;
                  const username = Swal.getPopup().querySelector('#username').value;
                  const password = Swal.getPopup().querySelector('#password').value;
                  return { email, username, password };
                }
              }).then((result) => {
                if (result.isConfirmed) {
                  const { email, username, password } = result.value;
                  fetch(`https://backend.dstcracks.site/admin/users/${userId}`, {
                    method: 'PUT',
                    headers: {
                      'Authorization': `Bearer ${token}`,
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, username, password })
                  })
                  .then(response => {
                    if (response.ok) {
                      Swal.fire('Thành công!', 'Thông tin người dùng đã được cập nhật.', 'success');
                      setUsers(users.map(user => user.id === userId ? { ...user, email, username } : user));
                    } else if (response.status === 400) {
                      response.json().then(data => {
                        Swal.fire('Lỗi!', data.message, 'error');
                      });
                    } else {
                      Swal.fire('Lỗi!', 'Không thể cập nhật thông tin người dùng.', 'error');
                    }
                  })
                  .catch(error => {
                    console.error('Error updating user info:', error);
                    Swal.fire('Lỗi!', 'Không thể cập nhật thông tin người dùng.', 'error');
                  });
                }
              });
            }
          });
        }
      });
    })
    .catch(error => {
      console.error('Error fetching user info:', error);
      Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: 'Không thể tải thông tin người dùng',
      });
    });
  };

  const handleEditUserRole = (userId, currentRole) => {
    const token = Cookies.get('token');
    const currentUserId = parseInt(Cookies.get('userId')); // Assuming userId is stored in cookies
    const currentUserRole = Cookies.get('userRole'); // Assuming userRole is stored in cookies

    if (userId === currentUserId || (currentUserRole === 'admin' && currentRole !== 'member') || (currentUserRole === 'owner' && currentRole === 'owner')) {
      Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: 'Bạn không thể thay đổi vai trò của tài khoản này',
      });
      return;
    }
    const roleOptions = {
      'member': 'Member',
      'admin': 'Admin',
      'owner': 'Owner'
    };

    // Remove the current role from the options
    delete roleOptions[currentRole];

    Swal.fire({
      title: 'Chỉnh sửa vai trò người dùng',
      input: 'select',
      inputOptions: roleOptions,
      inputPlaceholder: 'Chọn vai trò',
      showCancelButton: true,
      confirmButtonText: 'Lưu',
      cancelButtonText: 'Hủy'
    }).then((result) => {
      if (result.isConfirmed) {
        fetch(`https://backend.dstcracks.site/admin/users/role/${userId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ role: result.value })
        })
        .then(response => {
          if (response.ok) {
            setUsers(users.map(user => user.id === userId ? { ...user, role: result.value } : user));
            Swal.fire(
              'Thành công!',
              'Vai trò người dùng đã được cập nhật.',
              'success'
            );
          } else {
            Swal.fire(
              'Lỗi!',
              'Không thể cập nhật vai trò người dùng.',
              'error'
            );
          }
        })
        .catch(error => {
          console.error('Error updating user role:', error);
          Swal.fire(
            'Lỗi!',
            'Không thể cập nhật vai trò người dùng.',
            'error'
          );
        });
      }
    });
  };

  const handleDeleteGame = (gameId) => {
    Swal.fire({
      title: 'Bạn có chắc chắn?',
      text: "Bạn sẽ không thể hoàn tác hành động này!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Xóa'
    }).then((result) => {
      if (result.isConfirmed) {
        fetch(`https://backend.dstcracks.site/games/${gameId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${Cookies.get('token')}`
          }
        })
        .then(response => {
          if (response.ok) {
            setGames(games.filter(game => game.id !== gameId));
            Swal.fire(
              'Đã xóa!',
              'Trò chơi đã được xóa.',
              'success'
            );
          } else {
            Swal.fire(
              'Lỗi!',
              'Không thể xóa trò chơi.',
              'error'
            );
          }
        })
        .catch(error => {
          console.error('Error deleting game:', error);
          Swal.fire(
            'Lỗi!',
            'Không thể xóa trò chơi.',
            'error'
          );
        });
      }
    });
  };

  const handleEditGame = (gameId) => {
    fetch(`https://backend.dstcracks.site/games/${gameId}`, {
      headers: {
        'Authorization': `Bearer ${Cookies.get('token')}`
      }
    })
    .then(response => response.json())
    .then(data => {
      setSelectedGame(gameId);
      setGameDetails({
        name: data.name || '',
        image_url: data.image_url || placeholderImage,
        description: cleanHtmlTags(data.description) || '',
        minimum_requirements: cleanHtmlTags(data.minimum_requirements) || '',
        game_link: data.game_link || '',
        recommended_requirements: cleanHtmlTags(data.recommended_requirements) || '',
        latest_download_links: data.latest_download_links || [],
        update_links: data.update_links || [],
        old_download_links: data.old_download_links || [],
        vietnamese_link: data.vietnamese_link || [],
        notes: cleanHtmlTags(data.notes) || '',
        version: cleanHtmlTags(data.version) || '',
        release_date: data.release_date || '',
        category: data.category || '',
        update_links_enabled: data.update_links.length > 0,
        old_download_links_enabled: data.old_download_links.length > 0,
        vietnamese_link_enabled: data.vietnamese_link.length > 0 // Remove link_game field
      });
      setInitialGameName(data.name || '');
      setInitialGameDescription(cleanHtmlTags(data.description) || '');
      setIsChanged(false);
    })
    .catch(error => {
      console.error('Error fetching game details:', error);
    });
  };

const handleImageChange = (e) => {
  const file = e.target.files[0];
  if (file && file.type.startsWith('image/')) {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = reader.result;
      setGameDetails({ ...gameDetails, image_url: base64Data });
    };
    reader.readAsDataURL(file);
  }
};

const handleSaveGame = () => {
  // Validation
  if (!gameDetails.image_url || gameDetails.image_url === placeholderImage) {
    Swal.fire('Lỗi', 'Vui lòng chọn hình ảnh cho trò chơi.', 'error');
    return;
  }
  if (!gameDetails.name.trim()) {
    Swal.fire('Lỗi', 'Vui lòng nhập tên trò chơi.', 'error');
    return;
  }
  if (!gameDetails.latest_download_links.length || !gameDetails.latest_download_links[0].url.trim()) {
    Swal.fire('Lỗi', 'Vui lòng nhập ít nhất một liên kết tải xuống.', 'error');
    return;
  }
  if (!gameDetails.category.length) {
    Swal.fire('Lỗi', 'Vui lòng chọn ít nhất một thể loại.', 'error');
    return;
  }

  const updatedGameDetails = {
    ...gameDetails,
    update_date: new Date().toISOString().slice(0, 19).replace('T', ' '),
    description: cleanHtmlTags(gameDetails.description),
    minimum_requirements: cleanHtmlTags(gameDetails.minimum_requirements),
    game_link: gameDetails.game_link,
    recommended_requirements: cleanHtmlTags(gameDetails.recommended_requirements),
    notes: cleanHtmlTags(gameDetails.notes),
    version: cleanHtmlTags(gameDetails.version),
    release_date: gameDetails.release_date // Ensure release_date is included
  };

  const url = selectedGame === 'new' ? 'https://backend.dstcracks.site/games/new' : `https://backend.dstcracks.site/games/${selectedGame}`;
  const method = selectedGame === 'new' ? 'POST' : 'PUT';

  setSaveLoading(true); // Set save loading to true when saving data
  fetch(url, {
    method: method,
    headers: {
      'Authorization': `Bearer ${Cookies.get('token')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updatedGameDetails)
  })
  .then(response => {
    setSaveLoading(false); // Set save loading to false after data is saved
    if (response.ok) {
      Swal.fire('Thành công', 'Trò chơi đã được lưu thành công.', 'success');
      setSelectedGame(null);
    } else {
      Swal.fire('Lỗi', 'Không thể lưu trò chơi.', 'error');
    }
  })
  .catch(error => {
    console.error('Error saving game:', error);
    Swal.fire('Lỗi', 'Không thể lưu trò chơi.', 'error');
    setSaveLoading(false); // Set save loading to false on error
  });
};


  // Function to handle input changes and set isChanged to true
  const adjustTextareaHeight = (textarea) => {
    if (textarea.tagName !== 'TEXTAREA') return; // Ensure the element is a textarea
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
    const maxHeight = 500; // Set a maximum height if needed
    if (textarea.scrollHeight > maxHeight) {
      textarea.style.height = `${maxHeight}px`;
      textarea.style.overflowY = 'auto';
    } else {
      textarea.style.overflowY = 'hidden';
    }
  };

  const cleanHtmlTags = (text) => {
    if (typeof text !== 'string') {
      return text;
    }
    return text.replace(/<br\s*\/?>/g, '\n').replace(/<\/?strong>/g, '');
  };

  const handleInputChange = (e, field) => {
    let value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    if (field === 'category') {
      const options = Array.from(e.target.options);
      value = options.filter(option => option.selected).map(option => option.value);
    }
    if (field === 'vietnamese_link_enabled') {
      if (value) {
        if (!gameDetails.category.includes('vietnamese')) {
          setGameDetails({ ...gameDetails, category: [...gameDetails.category, 'vietnamese'], [field]: value });
        } else {
          setGameDetails({ ...gameDetails, [field]: value });
        }
      } else {
        setGameDetails({ ...gameDetails, category: gameDetails.category.filter(cat => cat !== 'vietnamese'), [field]: value });
      }
    } else {
      setGameDetails({ ...gameDetails, [field]: value });
    }
    setIsChanged(true);
    if (field === 'name' && value === '') {
      e.target.placeholder = initialGameName; // Reset placeholder to initial game name
    }
    if (field === 'description' && value === '') {
      e.target.placeholder = initialGameDescription; // Reset placeholder to initial game description
    }
    adjustTextareaHeight(e.target); // Adjust height on input change
  };


  useEffect(() => {
    const textareas = document.querySelectorAll('textarea');
    textareas.forEach(textarea => {
      textarea.value = cleanHtmlTags(textarea.value); // Clean HTML tags
      adjustTextareaHeight(textarea);
    });
  }, [selectedGame]);

  const handleCancelEdit = () => {
    if (isChanged) {
      Swal.fire({
        title: 'Bạn có chắc chắn?',
        text: "Bạn có thay đổi chưa lưu, bạn có chắc chắn muốn quay lại?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Quay lại',
        cancelButtonText: 'Hủy'
      }).then((result) => {
        if (result.isConfirmed) {
          setSelectedGame(null); // Hide the editing interface
          setIsChanged(false); // Reset the change state
        }
      });
    } else {
      setSelectedGame(null); // Hide the editing interface
    }
  };

  const handleMenuClick = (menu) => {
    setSelectedMenu(menu);
    window.location.hash = menu;
  };

  const handleAddDownloadLink = (type) => {
    try {
      const newLink = { name: '', url: '' };
      setGameDetails((prevDetails) => {
        const updatedLinks = [...prevDetails[type], newLink];
        return { ...prevDetails, [type]: updatedLinks };
      });
      setIsChanged(true);
    } catch (error) {
      console.error(`Error adding new link to ${type}:`, error); // Log any errors
    }
  };

  const handleDeleteDownloadLink = (type, index) => {
    try {
      setGameDetails((prevDetails) => {
        const updatedLinks = prevDetails[type].filter((_, i) => i !== index);
        return { ...prevDetails, [type]: updatedLinks };
      });
      setIsChanged(true);
    } catch (error) {
      console.error(`Error deleting link from ${type}:`, error); // Log any errors
    }
  };


  const handleAddGame = () => {
    setSelectedGame('new');
    setGameDetails({
      name: '',
      image_url: placeholderImage, // Set placeholder image
      description: '',
      minimum_requirements: '',
      game_link: '',
      recommended_requirements: '',
      latest_download_links: [],
      update_links: [],
      old_download_links: [],
      vietnamese_link: [],
      notes: '',
      version: '',
      release_date: '', // Add release_date field
      category: '', // Add category field
      update_links_enabled: false,
      old_download_links_enabled: false,
      vietnamese_link_enabled: false // Remove link_game field
    });
    setInitialGameName('');
    setInitialGameDescription('');
    setIsChanged(false);
  };

  const handleSearchGame = (e) => {
    setSearchGameTerm(e.target.value);
  };

  const categoryMapping = {
    'hành động': 'hành động',
    'chiến lược': 'chiến lược',
    'thể thao': 'thể thao',
    'phiêu lưu': 'phiêu lưu',
    'mô phỏng': 'mô phỏng',
    'nhiều người chơi': 'nhiều người chơi',
    'tiếng việt': 'vietnamese'
  };

  const handleCategoryChange = (e) => {
    const value = categoryMapping[e.target.value] || e.target.value;
    setSelectedCategories(prevCategories =>
      prevCategories.includes(value)
        ? prevCategories.filter(category => category !== value)
        : [...prevCategories, value]
    );
  };

  const filteredGames = games.filter(game => {
    const matchesSearchTerm = game.name.toLowerCase().includes(searchGameTerm.toLowerCase()) ||
                              game.updated_by.toLowerCase().includes(searchGameTerm.toLowerCase());
    const matchesCategory = selectedCategories.length === 0 || selectedCategories.every(category => 
      Array.isArray(game.category) && 
      game.category.map(cat => cat.trim().toLowerCase()).includes(category.toLowerCase())
    );
    return matchesSearchTerm && matchesCategory;
  });

  const handleViewDetails = (reportId) => {
    const token = Cookies.get('token');
    fetch(`https://backend.dstcracks.site/reports/${reportId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => response.json())
    .then(data => {
      setSelectedReport(data); // Set the selected report data
    })
    .catch(error => {
      console.error('Error fetching report details:', error);
      Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: 'Không thể tải thông tin báo cáo',
      });
    });
  };

  const handleBackToReports = () => {
    setSelectedReport(null); // Clear the selected report data
  };

  const handleCompleteReport = (reportId) => {
    const token = Cookies.get('token');
    setSaveLoading(true); // Set save loading to true when saving data
    fetch(`https://backend.dstcracks.site/reports/complete/${reportId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => {
      setSaveLoading(false); // Set save loading to false after data is saved
      if (response.ok) {
        Swal.fire('Thành công!', 'Báo cáo đã được hoàn thành.', 'success');
        setReports(reports.map(report => report.ID === reportId ? { ...report, status: 'completed' } : report)); // Update the report status
        setSelectedReport(null); // Clear the selected report data
      } else {
        Swal.fire('Lỗi!', 'Không thể hoàn thành báo cáo.', 'error');
      }
    })
    .catch(error => {
      console.error('Error completing report:', error);
      Swal.fire('Lỗi!', 'Không thể hoàn thành báo cáo.', 'error');
      setSaveLoading(false); // Set save loading to false on error
    });
  };

  const filteredReports = reports
    .filter(report => report.username.toLowerCase().includes(searchReportTerm.toLowerCase()))
    .filter(report => selectedStatus === 'all' || report.status === selectedStatus)
    .sort((a, b) => a.status === 'completed' ? 1 : -1);

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
      <header style={{ backgroundColor: '#eef1f3', display: 'flex', alignItems: 'center', fontFamily: '"Playwrite Hrvatska Lijeva", Arial, sans-serif', fontSize: '40px', margin: '20px 0', justifyContent: 'center' }}>
        <img draggable="false" src={teamLogo} alt="Team Logo" style={{ marginRight: '20px', width: '10%', height: '10%', cursor: 'pointer' }} onClick={() => navigate('/')} />
        <div style={{ textAlign: 'center', display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => navigate('/')}>
          <span>Admin Dashboard</span>
        </div>
        <img draggable="false" src={teamLogo} alt="Team Logo" style={{ marginLeft: '20px', width: '10%', height: '10%', cursor: 'pointer' }} onClick={() => navigate('/')} />
      </header>
      <div style={{ display: 'flex', height: 'calc(100vh - 80px)', overflow: 'hidden' }}>
        <nav style={{ width: '200px', backgroundColor: '#f8f9fa', padding: '1px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', overflowY: 'auto' }}>
          <ul style={{ listStyleType: 'none', padding: 0,marginTop: '0px',marginBottom: '0px', flex: 1, width: '220px', fontSize: '18px' }}>
            <li style={{ marginBottom: '10px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
              <a href="#users" style={{ textDecoration: 'none', color: selectedMenu === 'users' ? 'white' : 'black', backgroundColor: selectedMenu === 'users' ? '#1f52db' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '10px', transition: 'background-color 0.3s, color 0.3s', borderRadius: '5px' }} onClick={() => handleMenuClick('users')} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1f52db'; e.currentTarget.style.color = 'white'; e.currentTarget.querySelector('svg').style.color = 'white'; }} onMouseLeave={(e) => { if (selectedMenu !== 'users') { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'black'; e.currentTarget.querySelector('svg').style.color = 'black'; } }}>
                <FontAwesomeIcon icon={faUsers} style={{ marginRight: '10px', color: selectedMenu === 'users' ? 'white' : 'black' }} />Users
              </a>
            </li>
            <li style={{ marginBottom: '10px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
              <a href="#games" style={{ textDecoration: 'none', color: selectedMenu === 'games' ? 'white' : 'black', backgroundColor: selectedMenu === 'games' ? '#1f52db' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '10px', transition: 'background-color 0.3s, color 0.3s', borderRadius: '5px' }} onClick={() => handleMenuClick('games')} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1f52db'; e.currentTarget.style.color = 'white'; e.currentTarget.querySelector('svg').style.color = 'white'; }} onMouseLeave={(e) => { if (selectedMenu !== 'games') { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'black'; e.currentTarget.querySelector('svg').style.color = 'black'; } }}>
                <FontAwesomeIcon icon={faGamepad} style={{ marginRight: '10px', color: selectedMenu === 'games' ? 'white' : 'black' }} />Games
              </a>
            </li>
            <li style={{ marginBottom: '10px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
              <a href="#report" style={{ textDecoration: 'none', color: selectedMenu === 'report' ? 'white' : 'black', backgroundColor: selectedMenu === 'report' ? '#1f52db' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '10px', transition: 'background-color 0.3s, color 0.3s', borderRadius: '5px' }} onClick={() => handleMenuClick('report')} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1f52db'; e.currentTarget.style.color = 'white'; e.currentTarget.querySelector('svg').style.color = 'white'; }} onMouseLeave={(e) => { if (selectedMenu !== 'report') { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'black'; e.currentTarget.querySelector('svg').style.color = 'black'; } }}>
                <FontAwesomeIcon icon={faFlag} style={{ marginRight: '10px', color: selectedMenu === 'report' ? 'white' : 'black' }} />Report
              </a>
            </li>
          </ul>
          <div style={{ width: '100%', textAlign: 'center', backgroundColor: '#e9ecef', borderRadius: '5px', padding: '10px' }}>
            <div style={{ marginBottom: '5px' }}>
              <p style={{ marginBottom: '1px', marginTop: '1px' }}>CPU Usage</p>
              <div style={{ width: '100%', backgroundColor: '#ddd', borderRadius: '5px' }}>
                <div style={{ ...usageBarStyle, width: `${cpuUsage}%`, backgroundColor: getUsageColor(cpuUsage) }}></div>
              </div>
              <p style={{ marginTop: '1px' }}>{cpuUsage}% of {cpuInfo.cores} cores {cpuInfo.speed} MHz</p>
            </div>
            <div style={{ marginBottom: '5px' }}>
              <p style={{ marginBottom: '1px' }}>Memory Usage</p>
              <div style={{ width: '100%', backgroundColor: '#ddd', borderRadius: '5px' }}>
                <div style={{ ...usageBarStyle, width: `${memoryUsage}%`, backgroundColor: getUsageColor(memoryUsage) }}></div>
              </div>
              <p style={{ marginTop: '1px' }}>{memoryUsage}% ({memoryInfo.used}/{memoryInfo.total} GB)</p>
            </div>
            <div>
              <p style={{ marginBottom: '1px' }}>Disk Usage</p>
              <div style={{ width: '100%', backgroundColor: '#ddd', borderRadius: '5px' }}>
                <div style={{ ...usageBarStyle, width: `${diskUsage}%`, backgroundColor: getUsageColor(diskUsage) }}></div>
              </div>
              <p style={{ marginTop: '1px' }}>{diskUsage}% ({diskInfo.used}/{diskInfo.total} GB)</p>
            </div>
          </div>
        </nav>
        <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <FontAwesomeIcon icon={faSpinner} spin size="3x" />
            </div>
          ) : (
            <>
              {selectedMenu === 'users' && (
                <div style={{ overflowY: 'auto', height: '100%' }}>
                  <div style={{ justifyContent: 'space-between', marginBottom: '10px' }}>
                    <input
                      type="text"
                      placeholder="Tìm kiếm theo ID, tên đăng nhập hoặc email"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{ padding: '8px', width: '300px', borderRadius: '4px', border: '1px solid #ddd', marginRight: '10px' }} // Add marginRight to create space between input and select
                    />
                    <select id="roleFilter" value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}>
                      <option value="all">All</option>
                      <option value="owner">Owner</option>
                      <option value="admin">Admin</option>
                      <option value="member">Member</option>
                    </select>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'auto' }}>
                    <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f2f2f2', zIndex: 1 }}>
                      <tr>
                        <th style={{ border: '1px solid #ddd', padding: '8px', width: 'auto', whiteSpace: 'nowrap' }}>ID</th>
                        <th style={{ border: '1px solid #ddd', padding: '8px', width: 'auto', whiteSpace: 'nowrap' }}>Tên đăng nhập</th>
                        <th style={{ border: '1px solid #ddd', padding: '8px', width: 'auto', whiteSpace: 'nowrap' }}>Email</th>
                        <th style={{ border: '1px solid #ddd', padding: '8px', width: 'auto', whiteSpace: 'nowrap' }}>
                          Vai trò
                          <select id="roleFilter" value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} style={{ marginLeft: '10px' }}>
                            <option value="all">All</option>
                            <option value="owner">Owner</option>
                            <option value="admin">Admin</option>
                            <option value="member">Member</option>
                          </select>
                        </th>
                        <th style={{ border: '1px solid #ddd', padding: '8px', width: 'auto', whiteSpace: 'nowrap' }}>Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers
                        .sort(sortUsers)
                        .map(user => (
                        <tr key={user.id}>
                          <td style={{ border: '1px solid #ddd', padding: '8px', width: 'auto', whiteSpace: 'nowrap' }}>{user.id}</td>
                          <td style={{ border: '1px solid #ddd', padding: '8px', width: 'auto', whiteSpace: 'nowrap' }}>{user.username}</td>
                          <td style={{ border: '1px solid #ddd', padding: '8px', width: 'auto', whiteSpace: 'nowrap' }}>{user.email}</td>
                          <td style={{ border: '1px solid #ddd', padding: '8px', width: 'auto', whiteSpace: 'nowrap', color: getRoleColor(user.role) }}>{user.role}</td>
                          <td style={{ border: '1px solid #ddd', padding: '8px', width: 'auto', whiteSpace: 'nowrap', display: 'flex', justifyContent: 'space-between' }}>
                            {user.id !== parseInt(Cookies.get('userId')) && 
                            !((Cookies.get('userRole') === 'admin' && user.role !== 'member') || 
                              (Cookies.get('userRole') === 'owner' && user.role === 'owner')) ? (
                              <>
                                <button onClick={() => handleViewUserInfo(user.id)} style={{ backgroundColor: '#3498db', color: 'white', border: 'none', padding: '5px 20px', borderRadius: '3px', cursor: 'pointer' }}>Xem thông tin</button>
                                <button onClick={() => handleEditUserRole(user.id, user.role)} style={{ backgroundColor: '#2ecc71', color: 'white', border: 'none', padding: '5px 20px', borderRadius: '3px', cursor: 'pointer' }}>Chỉnh sửa quyền</button>
                                <button onClick={() => handleBanUser(user.id, user.banned, user.role)} style={{ backgroundColor: '#f39c12', color: 'white', border: 'none', padding: '5px 20px', borderRadius: '3px', cursor: 'pointer' }}>{user.banned ? 'Unban' : 'Ban'}</button>
                                <button onClick={() => handleDeleteUser(user.id, user.role)} style={{ backgroundColor: '#d33', color: 'white', border: 'none', padding: '5px 20px', borderRadius: '3px', cursor: 'pointer' }}>Xóa</button>
                              </>
                            ) : null}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {selectedMenu === 'games' && (
                <div style={{ overflowY: 'auto', height: '100%' }}>
                  {selectedGame ? (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                        <button 
                          onClick={handleCancelEdit} 
                          style={{ 
                            backgroundColor: '#3498db', 
                            color: 'white', 
                            border: 'none', 
                            padding: '10px 20px', 
                            borderRadius: '5px', 
                            cursor: 'pointer', 
                            display: 'flex', 
                            alignItems: 'center',
                            marginRight: '10px'
                          }}
                        >
                          <FontAwesomeIcon icon={faArrowLeft} style={{ marginRight: '10px' }} />
                          Quay lại
                        </button>
                        <h2 style={{ margin: 0, flex: 1 }}>{selectedGame === 'new' ? 'Thêm game' : `Chỉnh sửa game ${initialGameName}`}</h2>
                        <button onClick={handleSaveGame} style={{ backgroundColor: '#2ecc71', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer', marginRight: '10px' }}>
                          {saveLoading ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Lưu'}
                        </button>
                        <button onClick={handleCancelEdit} style={{ backgroundColor: '#d33', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer' }}>Hủy</button>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '10px' }}>
                        <div style={{ flex: 1, marginRight: '20px', position: 'relative' }}> {/* Adjust flex to 1 */}
                          <div className="image-container" style={{ position: 'relative' }} onClick={() => document.getElementById('imageInput').click()}>
                            <img 
                              src={gameDetails.image_url} 
                              alt="Game" 
                              style={{ 
                                width: '100%', 
                                height: 'auto', 
                                borderRadius: '10px', 
                                transition: 'opacity 0.3s ease' ,
                                cursor: 'pointer'
                              }} 
                              className="game-image"
                              draggable="false"
                            />
                            <FontAwesomeIcon 
                              icon={faPen} 
                              className="edit-icon"
                              style={{ 
                                position: 'absolute', 
                                top: '50%', 
                                left: '50%', 
                                transform: 'translate(-50%, -50%)', 
                                fontSize: '24px', 
                                color: 'black', 
                                cursor: 'pointer', 
                                zIndex: 1, 
                                opacity: 0, 
                                transition: 'opacity 0.3s ease' 
                              }}
                            />
                            <input 
                              type="file" 
                              id="imageInput" 
                              style={{ display: 'none' }} 
                              accept="image/*" 
                              onChange={handleImageChange}
                            />
                          </div>
                          <div style={{ marginTop: '10px', width: '97%' }}>
                            <label style={{ display: 'block', marginBottom: '5px' }}>Tên trò chơi:</label>
                            <input
                              type="text"
                              value={gameDetails.name || ''} // Ensure controlled input
                              onChange={(e) => handleInputChange(e, 'name')}
                              placeholder={initialGameName} // Use initialGameName as placeholder
                              style={{ padding: '8px', width: '100%', borderRadius: '4px', border: '1px solid #ddd', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' }} // Extend width to 100% and add box shadow
                            />
                          </div>
                          <div style={{ marginTop: '10px', width: '97%' }}>
                            <label>Ghi chú:</label>
                            <textarea
                              value={gameDetails.notes || ''} // Ensure controlled input
                              onChange={(e) => handleInputChange(e, 'notes')}
                              placeholder={cleanHtmlTags(gameDetails.notes)} // Clean HTML tags from placeholder
                              style={{ padding: '8px', width: '100%', height: 'auto', borderRadius: '4px', border: '1px solid #ddd', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)', resize: 'none' }} // Extend width to 100%, add box shadow, and disable resize
                              spellCheck="false" // Disable spellcheck
                            />
                          </div>
                          <div style={{ marginTop: '10px', width: '97%' }}>
                            <label>Version:</label>
                            <textarea
                              value={gameDetails.version || ''} // Ensure controlled input
                              onChange={(e) => handleInputChange(e, 'version')}
                              placeholder={cleanHtmlTags(gameDetails.version)} // Clean HTML tags from placeholder
                              style={{ padding: '8px', width: '100%', height: 'auto', borderRadius: '4px', border: '1px solid #ddd', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)', resize: 'none' }} // Extend width to 100%, add box shadow, and disable resize
                              spellCheck="false" // Disable spellcheck
                            />
                          </div>
                          {selectedGame === 'new' && (
                            <div style={{ marginTop: '10px', width: '97%' }}>
                              <label>Ngày phát hành:</label>
                              <input
                                type="date"
                                value={gameDetails.release_date || ''} // Ensure controlled input
                                onChange={(e) => handleInputChange(e, 'release_date')}
                                style={{ padding: '8px', width: '100%', borderRadius: '4px', border: '1px solid #ddd', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' }} // Extend width to 100% and add box shadow
                              />
                            </div>
                          )}
                          <div style={{ marginTop: '10px', width: '97%', display: 'flex', alignItems: 'center' }}>
                            <label>Liên kết cập nhật:</label>
                            <Switch
                              onChange={(checked) => handleInputChange({ target: { type: 'checkbox', checked } }, 'update_links_enabled')}
                              checked={gameDetails.update_links_enabled} // Use update_links_enabled state
                              onColor="#2ecc71"
                              offColor="#d33"
                              uncheckedIcon={false}
                              checkedIcon={false}
                              height={20}
                              width={40}
                              handleDiameter={20}
                              style={{ marginLeft: '10px', display: 'none' }}
                            />
                          </div>
                          <div style={{ marginTop: '10px', width: '97%', display: 'flex', alignItems: 'center' }}>
                            <label>Liên kết tải xuống cũ:</label>
                            <Switch
                              onChange={(checked) => handleInputChange({ target: { type: 'checkbox', checked } }, 'old_download_links_enabled')}
                              checked={gameDetails.old_download_links_enabled} // Use old_download_links_enabled state
                              onColor="#2ecc71"
                              offColor="#d33"
                              uncheckedIcon={false}
                              checkedIcon={false}
                              height={20}
                              width={40}
                              handleDiameter={20}
                              style={{ marginLeft: '10px', display: 'none' }}
                            />
                          </div>
                          <div style={{ marginTop: '10px', width: '97%', display: 'flex', alignItems: 'center' }}>
                            <label>Liên kết tiếng Việt:</label>
                            <Switch
                              onChange={(checked) => handleInputChange({ target: { type: 'checkbox', checked } }, 'vietnamese_link_enabled')}
                              checked={gameDetails.vietnamese_link_enabled} // Use vietnamese_link_enabled state
                              onColor="#2ecc71"
                              offColor="#d33"
                              uncheckedIcon={false}
                              checkedIcon={false}
                              height={20}
                              width={40}
                              handleDiameter={20}
                              style={{ marginLeft: '10px', display: 'none' }}
                            />
                          </div>
                          <div style={{ marginTop: '10px', width: '97%' }}>
                            <label>Thể loại:</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                              {['hành động', 'chiến lược', 'thể thao', 'phiêu lưu', 'mô phỏng', 'nhiều người chơi'].map(category => (
                                <label key={category} style={{ marginRight: '10px' }}>
                                  <input
                                    type="checkbox"
                                    value={category}
                                    checked={gameDetails.category.includes(category)}
                                    onChange={(e) => {
                                      const selectedCategories = [...gameDetails.category];
                                      if (e.target.checked) {
                                        selectedCategories.push(category);
                                      } else {
                                        const index = selectedCategories.indexOf(category);
                                        if (index > -1) {
                                          selectedCategories.splice(index, 1);
                                        }
                                      }
                                      setGameDetails({ ...gameDetails, category: selectedCategories });
                                      setIsChanged(true);
                                    }}
                                  />
                                  {category.charAt(0).toUpperCase() + category.slice(1)}
                                </label>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div style={{ flex: 2 }}> {/* Adjust flex to 2 */}
                          <div style={{ width: '97%' }}>
                            <label>Mô tả:</label>
                            <textarea
                              value={gameDetails.description || ''} // Ensure controlled input
                              onChange={(e) => handleInputChange(e, 'description')}
                              placeholder={cleanHtmlTags(initialGameDescription)} // Clean HTML tags from placeholder
                              style={{ padding: '8px', width: '100%', height: 'auto', borderRadius: '4px', border: '1px solid #ddd', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)', resize: 'none' }} // Extend width to 100%, add box shadow, and disable resize
                              spellCheck="false" // Disable spellcheck
                            />
                          </div>
                          <div style={{ width: '97%' }}>
                            <label>Yêu cầu tối thiểu:</label>
                            <textarea
                              value={gameDetails.minimum_requirements || ''} // Ensure controlled input
                              onChange={(e) => handleInputChange(e, 'minimum_requirements')}
                              placeholder={cleanHtmlTags(gameDetails.minimum_requirements)} // Clean HTML tags from placeholder
                              style={{ padding: '8px', width: '100%', height: 'auto', borderRadius: '4px', border: '1px solid #ddd', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)', resize: 'none' }} // Extend width to 100%, add box shadow, and disable resize
                              spellCheck="false" // Disable spellcheck
                            />
                          </div>
                          <div style={{ width: '97%' }}>
                            <label>Yêu cầu đề nghị:</label>
                            <textarea
                              value={gameDetails.recommended_requirements || ''} // Ensure controlled input
                              onChange={(e) => handleInputChange(e, 'recommended_requirements')}
                              placeholder={cleanHtmlTags(gameDetails.recommended_requirements)} // Clean HTML tags from placeholder
                              style={{ padding: '8px', width: '100%', height: 'auto', borderRadius: '4px', border: '1px solid #ddd', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)', resize: 'none' }} // Extend width to 100%, add box shadow, and disable resize
                              spellCheck="false" // Disable spellcheck
                            />
                          </div>
                          <div style={{ width: '97%', display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <div style={{ flex: 1 }}>
                              <label>Link tải bản mới:</label>
                              <button 
                                onClick={() => handleAddDownloadLink('latest_download_links')} 
                                style={{ backgroundColor: '#2ecc71', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '3px', cursor: 'pointer', marginLeft: '10px' }}
                              >
                                Add
                              </button>
                              {gameDetails.latest_download_links.map((link, index) => (
                                <div key={index} style={{ display: 'flex', gap: '10px', marginTop: '10px', alignItems: 'center' }}>
                                  <input
                                    type="text"
                                    placeholder={link.name || "Name"}
                                    value={link.name || ''} // Ensure controlled input
                                    onChange={(e) => {
                                      const updatedLinks = [...gameDetails.latest_download_links];
                                      updatedLinks[index].name = e.target.value;
                                      setGameDetails({ ...gameDetails, latest_download_links: updatedLinks });
                                      setIsChanged(true);
                                    }}
                                    onBlur={(e) => {
                                      if (e.target.value === '') {
                                        e.target.placeholder = link.name || "Name";
                                      }
                                    }}
                                    style={{ padding: '8px', flex: 1, borderRadius: '4px', border: '1px solid #ddd' }}
                                  />
                                  <input
                                    type="text"
                                    placeholder={link.url || "URL"}
                                    value={link.url || ''} // Ensure controlled input
                                    onChange={(e) => {
                                      const updatedLinks = [...gameDetails.latest_download_links];
                                      updatedLinks[index].url = e.target.value;
                                      setGameDetails({ ...gameDetails, latest_download_links: updatedLinks });
                                      setIsChanged(true);
                                    }}
                                    onBlur={(e) => {
                                      if (e.target.value === '') {
                                        e.target.placeholder = link.url || "URL";
                                      }
                                    }}
                                    style={{ padding: '8px', flex: 1, borderRadius: '4px', border: '1px solid #ddd' }}
                                  />
                                  <button 
                                    onClick={() => handleDeleteDownloadLink('latest_download_links', index)} 
                                    style={{ backgroundColor: '#d33', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '3px', cursor: 'pointer' }}
                                  >
                                    Delete
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          {gameDetails.update_links_enabled && (
                            <div style={{ marginTop: '10px', width: '97%' }}>
                              <label>Liên kết cập nhật (Tên):</label>
                              <button 
                                onClick={() => handleAddDownloadLink('update_links')} 
                                style={{ backgroundColor: '#2ecc71', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '3px', cursor: 'pointer', marginLeft: '10px' }}
                              >
                                Add
                              </button>
                              {gameDetails.update_links.map((link, index) => (
                                <div key={index} style={{ display: 'flex', gap: '10px', marginTop: '10px', alignItems: 'center' }}>
                                  <input
                                    type="text"
                                    placeholder={link.name || "Name"}
                                    value={link.name || ''} // Ensure controlled input
                                    onChange={(e) => {
                                      const updatedLinks = [...gameDetails.update_links];
                                      updatedLinks[index].name = e.target.value;
                                      setGameDetails({ ...gameDetails, update_links: updatedLinks });
                                      setIsChanged(true);
                                    }}
                                    onBlur={(e) => {
                                      if (e.target.value === '') {
                                        e.target.placeholder = link.name || "Name";
                                      }
                                    }}
                                    style={{ padding: '8px', flex: 1, borderRadius: '4px', border: '1px solid #ddd' }}
                                  />
                                  <input
                                    type="text"
                                    placeholder={link.url || "URL"}
                                    value={link.url || ''} // Ensure controlled input
                                    onChange={(e) => {
                                      const updatedLinks = [...gameDetails.update_links];
                                      updatedLinks[index].url = e.target.value;
                                      setGameDetails({ ...gameDetails, update_links: updatedLinks });
                                      setIsChanged(true);
                                    }}
                                    onBlur={(e) => {
                                      if (e.target.value === '') {
                                        e.target.placeholder = link.url || "URL";
                                      }
                                    }}
                                    style={{ padding: '8px', flex: 1, borderRadius: '4px', border: '1px solid #ddd' }}
                                  />
                                  <button 
                                    onClick={() => handleDeleteDownloadLink('update_links', index)} 
                                    style={{ backgroundColor: '#d33', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '3px', cursor: 'pointer' }}
                                  >
                                    Delete
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}                      <div style={{ width: '97%', display: 'flex', gap: '10px', alignItems: 'center' }}>
                          {gameDetails.old_download_links_enabled && (
                            <div style={{ width: '97%', display: 'flex', gap: '10px', alignItems: 'center' }}>
                              <div style={{ flex: 1 }}>
                                <label>Liên kết tải xuống cũ (Tên):</label>
                                <button 
                                  onClick={() => handleAddDownloadLink('old_download_links')} 
                                  style={{ backgroundColor: '#2ecc71', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '3px', cursor: 'pointer', marginLeft: '10px' }}
                                >
                                  Add
                                </button>
                                {gameDetails.old_download_links.map((link, index) => (
                                  <div key={index} style={{ display: 'flex', gap: '10px', marginTop: '10px', alignItems: 'center' }}>
                                    <input
                                      type="text"
                                      placeholder={link.name || "Name"}
                                      value={link.name || ''} // Ensure controlled input
                                      onChange={(e) => {
                                        const updatedLinks = [...gameDetails.old_download_links];
                                        updatedLinks[index].name = e.target.value;
                                        setGameDetails({ ...gameDetails, old_download_links: updatedLinks });
                                        setIsChanged(true);
                                      }}
                                      onBlur={(e) => {
                                        if (e.target.value === '') {
                                          e.target.placeholder = link.name || "Name";
                                        }
                                      }}
                                      style={{ padding: '8px', flex: 1, borderRadius: '4px', border: '1px solid #ddd' }}
                                    />
                                    <input
                                      type="text"
                                      placeholder={link.url || "URL"}
                                      value={link.url || ''} // Ensure controlled input
                                      onChange={(e) => {
                                        const updatedLinks = [...gameDetails.old_download_links];
                                        updatedLinks[index].url = e.target.value;
                                        setGameDetails({ ...gameDetails, old_download_links: updatedLinks });
                                        setIsChanged(true);
                                      }}
                                      onBlur={(e) => {
                                        if (e.target.value === '') {
                                          e.target.placeholder = link.url || "URL";
                                        }
                                      }}
                                      style={{ padding: '8px', flex: 1, borderRadius: '4px', border: '1px solid #ddd' }}
                                    />
                                    <button 
                                      onClick={() => handleDeleteDownloadLink('old_download_links', index)} 
                                      style={{ backgroundColor: '#d33', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '3px', cursor: 'pointer' }}
                                    >
                                      Delete
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          </div>
                          {gameDetails.vietnamese_link_enabled && (
                            <div style={{ width: '97%', display: 'flex', gap: '10px', alignItems: 'center' }}>
                              <div style={{ flex: 1 }}>
                                <label>Liên kết tiếng Việt (Tên):</label>
                                <button 
                                  onClick={() => handleAddDownloadLink('vietnamese_link')} 
                                  style={{ backgroundColor: '#2ecc71', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '3px', cursor: 'pointer', marginLeft: '10px' }}
                                >
                                  Add
                                </button>
                                {gameDetails.vietnamese_link.map((link, index) => (
                                  <div key={index} style={{ display: 'flex', gap: '10px', marginTop: '10px', alignItems: 'center' }}>
                                    <input
                                      type="text"
                                      placeholder={link.name || "Name"}
                                      value={link.name || ''} // Ensure controlled input
                                      onChange={(e) => {
                                        const updatedLinks = [...gameDetails.vietnamese_link];
                                        updatedLinks[index].name = e.target.value;
                                        setGameDetails({ ...gameDetails, vietnamese_link: updatedLinks });
                                        setIsChanged(true);
                                      }}
                                      onBlur={(e) => {
                                        if (e.target.value === '') {
                                          e.target.placeholder = link.name || "Name";
                                        }
                                      }}
                                      style={{ padding: '8px', flex: 1, borderRadius: '4px', border: '1px solid #ddd' }}
                                    />
                                    <input
                                      type="text"
                                      placeholder={link.url || "URL"}
                                      value={link.url || ''} // Ensure controlled input
                                      onChange={(e) => {
                                        const updatedLinks = [...gameDetails.vietnamese_link];
                                        updatedLinks[index].url = e.target.value;
                                        setGameDetails({ ...gameDetails, vietnamese_link: updatedLinks });
                                        setIsChanged(true);
                                      }}
                                      onBlur={(e) => {
                                        if (e.target.value === '') {
                                          e.target.placeholder = link.url || "URL";
                                        }
                                      }}
                                      style={{ padding: '8px', flex: 1, borderRadius: '4px', border: '1px solid #ddd' }}
                                    />
                                    <button 
                                      onClick={() => handleDeleteDownloadLink('vietnamese_link', index)} 
                                      style={{ backgroundColor: '#d33', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '3px', cursor: 'pointer' }}
                                    >
                                      Delete
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                        <input
                          type="text"
                          placeholder="Tìm kiếm trò chơi, người cập nhật"
                          value={searchGameTerm}
                          onChange={handleSearchGame}
                          style={{ padding: '8px', width: '300px', borderRadius: '4px', border: '1px solid #ddd', marginRight: '10px' }}
                        />
                        <div style={{ position: 'relative' }} className="category-dropdown">
                          <button 
                            onClick={toggleCheckboxes} 
                            style={{ 
                              padding: '8px', 
                              borderRadius: '4px', 
                              border: '1px solid #ddd', 
                              backgroundColor: '#fff', 
                              cursor: 'pointer' 
                            }}
                          >
                            Chọn thể loại
                          </button>
                          {showCheckboxes && (
                            <div style={{ 
                              position: 'absolute', 
                              top: '100%', 
                              left: 0, 
                              backgroundColor: '#fff', 
                              borderRadius: '4px', 
                              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)', 
                              zIndex: 2, 
                              padding: '10px',
                              whiteSpace: 'nowrap'
                            }}>
                              {['hành động', 'chiến lược', 'thể thao', 'phiêu lưu', 'mô phỏng', 'nhiều người chơi', 'tiếng việt'].map(category => (
                                <label key={category} style={{ display: 'block', marginBottom: '5px' }}>
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
                        <button 
                          onClick={handleAddGame} 
                          style={{ 
                            backgroundColor: '#2ecc71', 
                            color: 'white', 
                            border: 'none', 
                            padding: '10px 20px', 
                            borderRadius: '5px', 
                            cursor: 'pointer', 
                            display: 'flex', 
                            alignItems: 'center',
                            marginRight: '10px'
                          }}
                        >
                          <FontAwesomeIcon icon={faPlus} style={{ marginRight: '10px' }} />
                          Thêm trò chơi mới
                        </button>
                      </div>
                      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'auto' }}>
                        <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f2f2f2', zIndex: 1 }}>
                          <tr>
                            <th style={{ border: '1px solid #ddd', padding: '8px', width: 'auto', whiteSpace: 'nowrap' }}>ID</th>
                            <th style={{ border: '1px solid #ddd', padding: '8px', width: 'auto', whiteSpace: 'nowrap' }}>Tên trò chơi</th>
                            <th style={{ border: '1px solid #ddd', padding: '8px', width: 'auto', whiteSpace: 'nowrap' }}>Người cập nhật</th>
                            <th style={{ border: '1px solid #ddd', padding: '8px', width: 'auto', whiteSpace: 'nowrap' }}>Hành động</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredGames.map(game => (
                            <tr key={game.id}>
                              <td style={{ border: '1px solid #ddd', padding: '8px', width: 'auto', whiteSpace: 'nowrap' }}>{game.id}</td>
                              <td style={{ border: '1px solid #ddd', padding: '8px', width: 'auto', whiteSpace: 'nowrap' }}>{game.name}</td>
                              <td style={{ border: '1px solid #ddd', padding: '8px', width: 'auto', whiteSpace: 'nowrap' }}>{game.updated_by}</td>
                              <td style={{ border: '1px solid #ddd', padding: '8px', width: 'auto', whiteSpace: 'nowrap', display: 'flex', justifyContent: 'space-between' }}>
                                <button onClick={() => handleEditGame(game.id)} style={{ backgroundColor: '#3498db', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '3px', cursor: 'pointer', flex: 3 }}>Chỉnh sửa</button>
                                <button onClick={() => handleDeleteGame(game.id)} style={{ backgroundColor: '#d33', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '3px', cursor: 'pointer', flex: 1 }}>Xóa</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
              {selectedMenu === 'report' && (
                <div style={{ overflowY: 'auto', height: '100%' }}>
                  {selectedReport ? (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                        <button 
                          onClick={handleBackToReports} 
                          style={{ 
                            backgroundColor: '#3498db', 
                            color: 'white', 
                            border: 'none', 
                            padding: '10px 20px', 
                            borderRadius: '5px', 
                            cursor: 'pointer', 
                            display: 'flex', 
                            alignItems: 'center',
                            marginRight: '10px'
                          }}
                        >
                          <FontAwesomeIcon icon={faArrowLeft} style={{ marginRight: '10px' }} />
                          Quay lại
                        </button>
                        <button 
                          onClick={() => handleCompleteReport(selectedReport.ID)} 
                          style={{ 
                            backgroundColor: '#2ecc71', 
                            color: 'white', 
                            border: 'none', 
                            padding: '10px 20px', 
                            borderRadius: '5px', 
                            cursor: 'pointer', 
                            display: 'flex', 
                            alignItems: 'center'
                          }}
                        >
                          Hoàn thành
                        </button>
                      </div>
                      <div>
                        <h2>Chi tiết báo cáo</h2>
                        <p><strong>ID:</strong> {selectedReport.ID}</p>
                        <p><strong>Tên đăng nhập:</strong> {selectedReport.username}</p>
                        <p><strong>Loại báo cáo:</strong> {selectedReport.report_type}</p>
                        <p><strong>Ngày tạo:</strong> {new Date(selectedReport.created_at).toLocaleString()}</p>
                        <p><strong>Chi tiết:</strong> {selectedReport.detail}</p>
                        {selectedReport.image_videos && (
                          <div>
                            <p><strong>Hình ảnh/Video:</strong></p>
                            <img draggable="false" src={`https://backend.dstcracks.site/${selectedReport.image_videos}`} alt="Report" style={{ maxWidth: '100%' }} />
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ justifyContent: 'space-between', marginBottom: '10px' }}>
                        <input
                          type="text"
                          placeholder="Tìm kiếm theo tên đăng nhập"
                          value={searchReportTerm}
                          onChange={(e) => setSearchReportTerm(e.target.value)}
                          style={{ padding: '8px', width: '300px', borderRadius: '4px', border: '1px solid #ddd', marginRight: '10px' }}
                        />
                        <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}>
                          <option value="all">Tất cả</option>
                          <option value="pending">Đang chờ xử lý</option>
                          <option value="completed">Hoàn thành</option>
                        </select>
                      </div>
                      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'auto' }}>
                        <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f2f2f2', zIndex: 1 }}>
                          <tr>
                            <th style={{ border: '1px solid #ddd', padding: '8px', width: 'auto', whiteSpace: 'nowrap' }}>ID</th>
                            <th style={{ border: '1px solid #ddd', padding: '8px', width: 'auto', whiteSpace: 'nowrap' }}>Tên đăng nhập</th>
                            <th style={{ border: '1px solid #ddd', padding: '8px', width: 'auto', whiteSpace: 'nowrap' }}>Loại báo cáo</th>
                            <th style={{ border: '1px solid #ddd', padding: '8px', width: 'auto', whiteSpace: 'nowrap' }}>Ngày tạo</th>
                            <th style={{ border: '1px solid #ddd', padding: '8px', width: 'auto', whiteSpace: 'nowrap' }}>Trạng thái</th>
                            <th style={{ border: '1px solid #ddd', padding: '8px', width: 'auto', whiteSpace: 'nowrap' }}>Chi tiết</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredReports.map(report => (
                            <tr key={report.ID}>
                              <td style={{ border: '1px solid #ddd', padding: '8px', width: 'auto', whiteSpace: 'nowrap' }}>{report.ID}</td>
                              <td style={{ border: '1px solid #ddd', padding: '8px', width: 'auto', whiteSpace: 'nowrap' }}>{report.username}</td>
                              <td style={{ border: '1px solid #ddd', padding: '8px', width: 'auto', whiteSpace: 'nowrap' }}>{report.report_type}</td>
                              <td style={{ border: '1px solid #ddd', padding: '8px', width: 'auto', whiteSpace: 'nowrap' }}>{new Date(report.created_at).toLocaleString()}</td>
                              <td style={{ border: '1px solid #ddd', padding: '8px', width: 'auto', whiteSpace: 'nowrap' }}>{report.status}</td>
                              <td style={{ border: '1px solid #ddd', padding: '8px', width: 'auto', whiteSpace: 'nowrap' }}>
                                <button onClick={() => handleViewDetails(report.ID)} style={{ backgroundColor: '#3498db', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '3px', cursor: 'pointer' }}>Xem chi tiết</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
    </>
  );
}

// Add CSS styles
const styles = `
  .image-container:hover .game-image {
    opacity: 0.5;
  }
  .image-container:hover .edit-icon {
    opacity: 1; !important;
    display: block;
  }
  .image-container.hoverable:hover .edit-icon {
     opacity: 1 !important;
   }
`;

// Inject styles into the document
const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by Error Boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>;
    }

    return this.props.children; 
  }
}

// Wrap AdminDashboard with ErrorBoundary
export default function AdminDashboardComponent() { // Rename the function to avoid duplicate declaration
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/*" element={<AdminDashboard />} /> {/* Update the path to include a trailing /* */}
      </Routes>
    </ErrorBoundary>
  );
}
