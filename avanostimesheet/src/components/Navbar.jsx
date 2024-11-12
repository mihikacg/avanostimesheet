// import React, { useState, useEffect } from "react";
// import { Menu, X, ChevronDown } from "lucide-react";
// import { useNavigate, useLocation } from "react-router-dom";
// import logo from "../assets/Avanos logo.png";
// import axios from 'axios';
// import { useUser } from '../UserContext';

// import { useIsAuthenticated } from '@azure/msal-react';
// import { SignInButton } from './SignInButton';
// import { SignOutButton } from './SignOutButton';

// const Navbar = () => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
//   const [userSelectOpen, setUserSelectOpen] = useState(false);
//   const { selectedUser, userRole, setUser, clearUser, loading } = useUser();
//   const [users, setUsers] = useState([]);

//   const isAuthenticated = useIsAuthenticated();


//   useEffect(() => {
//     const fetchUsers = async () => {
//       try {
//         const response = await axios.get('http://localhost:4000/users');
//         const usersList = response.data.map(user => ({
//           name: `${user.Last_name}, ${user.First_name}`,
//           id: user.Employee_id,
//           role: user.User_Role
//         }));
//         setUsers(usersList);
//       } catch (error) {
//         console.error('Error fetching users:', error);
//       }
//     };

//     fetchUsers();
//   }, []);

//   const toggleNavbar = () => setMobileDrawerOpen(!mobileDrawerOpen);
//   const toggleUserSelect = () => setUserSelectOpen(!userSelectOpen);

//   const selectUser = (user) => {
//     console.log(user);
//     setUser(user.name, user.id, user.role);
//     setUserSelectOpen(false);
//   };

//   const handleClearUser = () => {
//     clearUser();
//     setUserSelectOpen(false);
//     navigate('/');
//   };

//   const handleNavigation = (path) => {
//     navigate(path);
//     setMobileDrawerOpen(false);
//   };

//   const navItems = [
//     { 
//       label: "Dashboard", 
//       path: "/dashboard", 
//       role: "UA" 
//     },
//     { 
//       label: "Add Time", 
//       path: "/clock-in-out", 
//       role: "UA" 
//     },
//     { 
//       label: "Approve", 
//       path: "/approve", 
//       role: "A" 
//     }
//   ];

//   const renderNavItems = () => {
//     return navItems
//       .filter(item => userRole && item.role.includes(userRole))
//       .map((item, index) => (
//         <li key={index}>
//           <button
//             className={`text-lg transition-colors ${
//               location.pathname === item.path
//                 ? 'text-black font-semibold'
//                 : 'text-gray-600 hover:text-black'
//             }`}
//             onClick={() => handleNavigation(item.path)}
//           >
//             {item.label}
//           </button>
//         </li>
//       ));
//   };

//   return (
//     <nav className="bg-white border-b-2 fixed w-full top-0 z-50">
//       <div className="container px-4 mx-auto relative lg:text-base">
//         <div className="flex justify-between items-center py-3">
//           <div className="flex items-center flex-shrink-0">
//             <img className="h-12 w-auto mr-3" src={logo} alt="Logo" />
//             <span className="text-2xl font-semibold tracking-tight text-black">Time Sheet</span>
//           </div>
  
//           <div className="hidden lg:flex absolute left-1/2 transform -translate-x-1/2">
//             <ul className="flex space-x-12">
//               {renderNavItems()}
//             </ul>
//           </div>
  
//           <div className="flex items-center">
//             <div className="hidden lg:block relative">
//               <button
//                 onClick={toggleUserSelect}
//                 className="bg-black text-white py-3 px-5 rounded-md hover:bg-gray-800 text-lg font-medium flex items-center"
//               >
//                 {selectedUser ? `${selectedUser} ` : "Select User"}
//                 <ChevronDown className="ml-2 h-5 w-5" />
//               </button>
//               {userSelectOpen && (
//                 <div 
//                   className="absolute right-0 mt-2 w-48 bg-white border border-gray-300 rounded-md shadow-lg z-10"
//                   onMouseLeave={() => setUserSelectOpen(false)}
//                 >
//                   {loading ? (
//                     <div className="px-4 py-2 text-sm text-gray-500">Loading...</div>
//                   ) : (
//                     <>
//                       {users.map((user, index) => (
//                         <button
//                           key={index}
//                           onClick={() => selectUser(user)}
//                           className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
//                         >
//                           {user.name} 
//                         </button>
//                       ))}
//                       {selectedUser && (
//                         <button
//                           onClick={handleClearUser}
//                           className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
//                         >
//                           Clear Selection
//                         </button>
//                       )}
//                     </>
//                   )}
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
//               {renderNavItems()}
//             </ul>
//             {/* Mobile user selection */}
//             <div className="mt-8 text-center">
//               <button
//                 onClick={toggleUserSelect}
//                 className="bg-black text-white py-3 px-5 rounded-md hover:bg-gray-800 text-lg font-medium inline-flex items-center"
//               >
//                 {selectedUser ? `${selectedUser} ` : "Select User"}
//                 <ChevronDown className="ml-2 h-5 w-5" />
//               </button>
//               {userSelectOpen && (
//                 <div className="mt-2 bg-white border border-gray-300 rounded-md shadow-lg">
//                   {users.map((user, index) => (
//                     <button
//                       key={index}
//                       onClick={() => selectUser(user)}
//                       className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
//                     >
//                       {user.name}
//                     </button>
//                   ))}
//                   {selectedUser && (
//                     <button
//                       onClick={handleClearUser}
//                       className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
//                     >
//                       Clear Selection
//                     </button>
//                   )}
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

import React, { useState, useEffect } from "react";
import { Menu, X, ChevronDown } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import logo from "../assets/Avanos logo.png";
import axios from 'axios';
import { useUser } from '../UserContext';

import { useIsAuthenticated } from '@azure/msal-react';
import { SignInButton } from './SignInButton';
import { SignOutButton } from './SignOutButton';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [userSelectOpen, setUserSelectOpen] = useState(false);
  const { selectedUser, userRole, setUser, clearUser, loading } = useUser();
  const [users, setUsers] = useState([]);

  // const isAuthenticated = useIsAuthenticated();
  const isAuthenticated = true;

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get('http://localhost:4000/users');
        const usersList = response.data.map(user => ({
          name: `${user.Last_name}, ${user.First_name}`,
          id: user.Employee_id,
          role: user.User_Role
        }));
        setUsers(usersList);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, []);

  const toggleNavbar = () => setMobileDrawerOpen(!mobileDrawerOpen);
  const toggleUserSelect = () => setUserSelectOpen(!userSelectOpen);

  const selectUser = (user) => {
    setUser(user.name, user.id, user.role);
    setUserSelectOpen(false);
  };

  const handleClearUser = () => {
    clearUser();
    setUserSelectOpen(false);
    navigate('/');
  };

  const handleNavigation = (path) => {
    navigate(path);
    setMobileDrawerOpen(false);
  };

  const navItems = [
    { label: "Dashboard", path: "/dashboard", role: "UA" },
    { label: "Add Time", path: "/clock-in-out", role: "UA" },
    { label: "Approve", path: "/approve", role: "A" }
  ];

  const renderNavItems = () => {
    return navItems
      .filter(item => userRole && item.role.includes(userRole))
      .map((item, index) => (
        <li key={index}>
          <button
            className={`text-lg transition-colors ${
              location.pathname === item.path
                ? 'text-black font-semibold'
                : 'text-gray-600 hover:text-black'
            }`}
            onClick={() => handleNavigation(item.path)}
          >
            {item.label}
          </button>
        </li>
      ));
  };

  return (
    <nav className="bg-white border-b-2 fixed w-full top-0 z-50">
      <div className="container px-4 mx-auto relative lg:text-base">
        <div className="flex justify-between items-center py-3">
          <div className="flex items-center flex-shrink-0">
            <img className="h-12 w-auto mr-3" src={logo} alt="Logo" />
            <span className="text-2xl font-semibold tracking-tight text-black">Time Sheet</span>
          </div>
  
          {/* Conditionally render navigation items */}
          {isAuthenticated && (
            <div className="flex ml-16">
              <ul className="flex space-x-8">
                {renderNavItems()}
              </ul>
            </div>
          )}
  
          <div className="flex items-center">
            {isAuthenticated ? (
              <div className="hidden lg:block relative">
                <button
                  onClick={toggleUserSelect}
                  className="bg-black text-white py-3 px-5 rounded-md hover:bg-gray-800 text-lg font-medium flex items-center"
                >
                  {selectedUser ? `${selectedUser} ` : "Select User"}
                  <ChevronDown className="ml-2 h-5 w-5" />
                </button>
                {userSelectOpen && (
                  <div 
                    className="absolute right-0 mt-2 w-48 bg-white border border-gray-300 rounded-md shadow-lg z-10"
                    onMouseLeave={() => setUserSelectOpen(false)}
                  >
                    {loading ? (
                      <div className="px-4 py-2 text-sm text-gray-500">Loading...</div>
                    ) : (
                      <>
                        {users.map((user, index) => (
                          <button
                            key={index}
                            onClick={() => selectUser(user)}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            {user.name}
                          </button>
                        ))}
                        {selectedUser && (
                          <button
                            onClick={handleClearUser}
                            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                          >
                            Clear Selection
                          </button>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <SignInButton />
            )}
  
            <div className="lg:hidden ml-4">
              <button onClick={toggleNavbar} aria-label={mobileDrawerOpen ? "Close menu" : "Open menu"}>
                <Menu className="text-black w-8 h-8" />
              </button>
            </div>
          </div>
        </div>
  
        {mobileDrawerOpen && isAuthenticated && (
          <div className="fixed right-0 top-0 z-20 bg-white w-full h-full p-12 flex flex-col lg:hidden">
            <button
              onClick={toggleNavbar}
              className="absolute top-4 right-4"
              aria-label="Close menu"
            >
              <X className="text-black w-8 h-8" />
            </button>
            <ul className="text-center mt-16">
              {renderNavItems()}
            </ul>
            <div className="mt-8 text-center">
              <button
                onClick={toggleUserSelect}
                className="bg-black text-white py-3 px-5 rounded-md hover:bg-gray-800 text-lg font-medium inline-flex items-center"
              >
                {selectedUser ? `${selectedUser} ` : "Select User"}
                <ChevronDown className="ml-2 h-5 w-5" />
              </button>
              {userSelectOpen && (
                <div className="mt-2 bg-white border border-gray-300 rounded-md shadow-lg">
                  {users.map((user, index) => (
                    <button
                      key={index}
                      onClick={() => selectUser(user)}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      {user.name}
                    </button>
                  ))}
                  {selectedUser && (
                    <button
                      onClick={handleClearUser}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    >
                      Clear Selection
                    </button>
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
