import React, { useState, useEffect } from "react";
import { Menu, X, ChevronDown } from "lucide-react";
import logo from "../assets/Avanos logo.png";
import { navItems } from "../constants";
import axios from 'axios';

const Navbar = ({ onDashboardClick, onClockInOutClick }) => {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [userSelectOpen, setUserSelectOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setSelectedUser(savedUser);
    }

    // Fetch users from the backend
    const fetchUsers = async () => {
      try {
        const response = await axios.get('http://localhost:4000/users');
        const usersList = response.data.map(user => user.name);
        setUsers(usersList);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching users:', error);
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const toggleNavbar = () => {
    setMobileDrawerOpen(!mobileDrawerOpen);
  };

  const toggleUserSelect = () => {
    setUserSelectOpen(!userSelectOpen);
  };

  const selectUser = (user) => {
    setSelectedUser(user);
    localStorage.setItem('user', user);
    setUserSelectOpen(false);
  };

  const handleNavItemClick = (item) => {
    if (item.label === "Dashboard") {
      onDashboardClick();
    } else if (item.label === "Clock In/Out" || item.label === "Add Time") {
      onClockInOutClick();
    }
    setMobileDrawerOpen(false);
  };

  return (
    <nav className="bg-white border-b-2 fixed w-full top-0 z-50">
      <div className="container px-4 mx-auto relative lg:text-base">
        <div className="flex justify-between items-center py-3">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0">
            <img className="h-12 w-auto mr-3" src={logo} alt="Logo" />
            <span className="text-2xl font-semibold tracking-tight text-black">Time Sheet</span>
          </div>
  
          {/* Centered Navigation Items */}
          <div className="hidden lg:flex absolute left-1/2 transform -translate-x-1/2">
            <ul className="flex space-x-12">
              {navItems.map((item, index) => (
                <li key={index}>
                  <button
                    className="text-black hover:text-gray-600 text-lg"
                    onClick={() => handleNavItemClick(item)}
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
  
          {/* User Select and Mobile Menu */}
          <div className="flex items-center">
            <div className="hidden lg:block relative">
              <button
                onClick={toggleUserSelect}
                className="bg-black text-white py-3 px-5 rounded-md hover:bg-gray-800 text-lg font-medium flex items-center"
              >
                {selectedUser || "Select User"}
                <ChevronDown className="ml-2 h-5 w-5" />
              </button>
              {userSelectOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-300 rounded-md shadow-lg z-10">
                  {loading ? (
                    <div className="px-4 py-2 text-sm text-gray-500">Loading...</div>
                  ) : (
                    users.map((user, index) => (
                      <button
                        key={index}
                        onClick={() => selectUser(user)}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        {user}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
            <div className="lg:hidden ml-4">
              <button onClick={toggleNavbar} aria-label={mobileDrawerOpen ? "Close menu" : "Open menu"}>
                <Menu className="text-black w-8 h-8" />
              </button>
            </div>
          </div>
        </div>
  
        {/* Mobile Menu */}
        {mobileDrawerOpen && (
          <div className="fixed right-0 top-0 z-20 bg-white w-full h-full p-12 flex flex-col lg:hidden">
            <button
              onClick={toggleNavbar}
              className="absolute top-4 right-4"
              aria-label="Close menu"
            >
              <X className="text-black w-8 h-8" />
            </button>
            <ul className="text-center mt-16">
              {navItems.map((item, index) => (
                <li key={index} className="py-4">
                  <button
                    className="text-black hover:text-gray-600 text-xl"
                    onClick={() => handleNavItemClick(item)}
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-8 text-center">
              <button
                onClick={toggleUserSelect}
                className="py-3 px-5 rounded-md bg-black text-white hover:bg-gray-800 text-center text-lg font-medium inline-flex items-center"
              >
                {selectedUser || "Select User"}
                <ChevronDown className="ml-2 h-5 w-5" />
              </button>
              {userSelectOpen && (
                <div className="mt-2 bg-white border border-gray-300 rounded-md shadow-lg">
                  {loading ? (
                    <div className="px-4 py-2 text-sm text-gray-500">Loading...</div>
                  ) : (
                    users.map((user, index) => (
                      <button
                        key={index}
                        onClick={() => selectUser(user)}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        {user}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );  
};

export default Navbar;


// const Navbar = ({ onDashboardClick, onClockInOutClick }) => {
//   const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
//   const [userSelectOpen, setUserSelectOpen] = useState(false);
//   const [selectedUser, setSelectedUser] = useState(null);

//   useEffect(() => {
//     const savedUser = localStorage.getItem('user');
//     if (savedUser) {
//       setSelectedUser(savedUser);
//     }
//   }, []);

//   const toggleNavbar = () => {
//     setMobileDrawerOpen(!mobileDrawerOpen);
//   };

//   const toggleUserSelect = () => {
//     setUserSelectOpen(!userSelectOpen);
//   };

//   const userList = ["A", "B", "C", "D"];

//   const selectUser = (user) => {
//     setSelectedUser(user);
//     localStorage.setItem('user', user);
//     setUserSelectOpen(false);
//   };

//   const handleNavItemClick = (item) => {
//     if (item.label === "Dashboard") {
//       onDashboardClick();
//     } else if (item.label === "Clock In/Out" || item.label === "Add Time") {
//       onClockInOutClick();
//     }
//     setMobileDrawerOpen(false);
//   };

//   return (
//     <nav className="bg-white border-b-2 fixed w-full top-0 z-50">
//       <div className="container px-4 mx-auto relative lg:text-base">
//         <div className="flex justify-between items-center py-3">
//           {/* Logo */}
//           <div className="flex items-center flex-shrink-0">
//             <img className="h-12 w-auto mr-3" src={logo} alt="Logo" />
//             <span className="text-2xl font-semibold tracking-tight text-black">Time Sheet</span>
//           </div>
          
//           {/* Centered Navigation Items */}
//           <div className="hidden lg:flex absolute left-1/2 transform -translate-x-1/2">
//             <ul className="flex space-x-12">
//               {navItems.map((item, index) => (
//                 <li key={index}>
//                   <button 
//                     className="text-black hover:text-gray-600 text-lg"
//                     onClick={() => handleNavItemClick(item)}
//                   >
//                     {item.label}
//                   </button>
//                 </li>
//               ))}
//             </ul>
//           </div>
          
//           {/* User Select and Mobile Menu */}
//           <div className="flex items-center">
//             <div className="hidden lg:block relative">
//               <button
//                 onClick={toggleUserSelect}
//                 className="bg-black text-white py-3 px-5 rounded-md hover:bg-gray-800 text-lg font-medium flex items-center"
//               >
//                 {selectedUser || "Select User"}
//                 <ChevronDown className="ml-2 h-5 w-5" />
//               </button>
//               {userSelectOpen && (
//                 <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-300 rounded-md shadow-lg z-10">
//                   {userList.map((user, index) => (
//                     <button
//                       key={index}
//                       onClick={() => selectUser(user)}
//                       className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
//                     >
//                       {user}
//                     </button>
//                   ))}
//                 </div>
//               )}
//             </div>
//             <div className="lg:hidden ml-4">
//               <button onClick={toggleNavbar} aria-label={mobileDrawerOpen ? "Close menu" : "Open menu"}>
//                 <Menu className="text-black w-8 h-8" />
//               </button>
//             </div>
//           </div>
//         </div>
        
//         {/* Mobile Menu */}
//         {mobileDrawerOpen && (
//           <div className="fixed right-0 top-0 z-20 bg-white w-full h-full p-12 flex flex-col lg:hidden">
//             <button
//               onClick={toggleNavbar}
//               className="absolute top-4 right-4"
//               aria-label="Close menu"
//             >
//               <X className="text-black w-8 h-8" />
//             </button>
//             <ul className="text-center mt-16">
//               {navItems.map((item, index) => (
//                 <li key={index} className="py-4">
//                   <button 
//                     className="text-black hover:text-gray-600 text-xl"
//                     onClick={() => handleNavItemClick(item)}
//                   >
//                     {item.label}
//                   </button>
//                 </li>
//               ))}
//             </ul>
//             <div className="mt-8 text-center">
//               <button
//                 onClick={toggleUserSelect}
//                 className="py-3 px-5 rounded-md bg-black text-white hover:bg-gray-800 text-center text-lg font-medium inline-flex items-center"
//               >
//                 {selectedUser || "Select User"}
//                 <ChevronDown className="ml-2 h-5 w-5" />
//               </button>
//               {userSelectOpen && (
//                 <div className="mt-2 bg-white border border-gray-300 rounded-md shadow-lg">
//                   {userList.map((user, index) => (
//                     <button
//                       key={index}
//                       onClick={() => selectUser(user)}
//                       className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
//                     >
//                       {user}
//                     </button>
//                   ))}
//                 </div>
//               )}
//             </div>
//           </div>
//         )}
//       </div>
//     </nav>
//   );
// };

// export default Navbar;