// frontend/src/components/Navbar.js

import React, { useContext } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Disclosure, Menu } from "@headlessui/react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { AuthContext } from "../context/AuthContext";

// This is a helper function to determine which links a user can see
const getNavigation = (userRole) => {
  const allRoutes = [
    { name: "Dashboard", href: "/", roles: ["admin", "manager"] },
    {
      name: "Replies",
      href: "/replies",
      roles: ["admin", "manager", "viewer"],
    },
    { name: "Contacts", href: "/contacts", roles: ["admin", "manager"] },
    { name: "Analytics", href: "/analytics", roles: ["admin", "manager"] },
    { name: "Logs", href: "/logs", roles: ["admin"] },
    { name: "Users", href: "/users", roles: ["admin"] },
    { name: "Integrations", href: "/integrations", roles: ['admin'] }, // <-- NEW LINK
  ];
  // Filter the routes based on the current user's role
  return allRoutes.filter((route) => route.roles.includes(userRole));
};

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  // Get the navigation items that are allowed for the current user's role
  const navigation = user ? getNavigation(user.role) : [];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <Disclosure
      as="nav"
      className="relative bg-black after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-white/10"
    >
      {({ open }) => (
        <>
          <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
            <div className="relative flex h-16 items-center justify-between">
              {/* Mobile menu button */}
              <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
                <Disclosure.Button className="group relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-white/5 hover:text-white">
                  <span className="sr-only">Open main menu</span>
                  {open ? (
                    <XMarkIcon aria-hidden="true" className="block size-6" />
                  ) : (
                    <Bars3Icon aria-hidden="true" className="block size-6" />
                  )}
                </Disclosure.Button>
              </div>

              {/* Logo + navigation */}
              <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
                <div className="flex shrink-0 items-center">
                  <img
                    alt="Logo"
                    src="https://thecapitalavenue.com/wp-content/uploads/2025/09/Capital-Avenue-White.png"
                    className="h-8 w-auto"
                  />
                </div>
                {user && (
                  <div className="hidden sm:ml-6 sm:block">
                    <div className="flex space-x-4">
                      {navigation.map((item) => (
                        <Link
                          key={item.name}
                          to={item.href}
                          className={classNames(
                            location.pathname === item.href
                              ? "bg-gray-950/50 text-white"
                              : "text-gray-300 hover:bg-white/5 hover:text-white",
                            "rounded-md px-3 py-2 text-sm font-medium"
                          )}
                        >
                          {item.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right side */}
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
                {user ? (
                  <Menu as="div" className="relative ml-3">
                    <Menu.Button className="relative flex rounded-full">
                      <span className="sr-only">Open user menu</span>
                      <img
                        alt="profile"
                        src="https://thecapitalavenue.com/wp-content/uploads/2025/08/Group-3.svg"
                        className="size-8 rounded-full bg-gray-100"
                      />
                    </Menu.Button>
                    <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-gray-800 py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                      <div className="px-4 py-2 text-sm text-white border-b border-gray-700">
                        <p className="font-medium">{user.name}</p>
                        <p className="text-gray-400 capitalize">{user.role}</p>
                      </div>

                      {/* --- THIS IS THE NEW LINK --- */}
                      <Menu.Item>
                        {({ active }) => (
                          <Link
                            to="/profile"
                            className={classNames(
                              active ? "bg-white/5" : "",
                              "block px-4 py-2 text-sm text-gray-300"
                            )}
                          >
                            My Profile
                          </Link>
                        )}
                      </Menu.Item>

                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={handleLogout}
                            className={classNames(
                              active ? "bg-white/5" : "",
                              "block w-full text-left px-4 py-2 text-sm text-gray-300"
                            )}
                          >
                            Logout
                          </button>
                        )}
                      </Menu.Item>
                    </Menu.Items>
                  </Menu>
                ) : (
                  <Link
                    to="/login"
                    className="text-gray-300 hover:bg-white/5 hover:text-white rounded-md px-3 py-2 text-sm font-medium"
                  >
                    Login
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Mobile menu */}
          {user && (
            <Disclosure.Panel className="sm:hidden">
              <div className="space-y-1 px-2 pt-2 pb-3">
                {navigation.map((item) => (
                  <Disclosure.Button
                    as={Link}
                    key={item.name}
                    to={item.href}
                    className={classNames(
                      location.pathname === item.href
                        ? "bg-gray-950/50 text-white"
                        : "text-gray-300 hover:bg-white/5 hover:text-white",
                      "block rounded-md px-3 py-2 text-base font-medium"
                    )}
                  >
                    {item.name}
                  </Disclosure.Button>
                ))}
                <Disclosure.Button
                  as="button"
                  onClick={handleLogout}
                  className="block w-full text-left rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-white/5 hover:text-white"
                >
                  Logout
                </Disclosure.Button>
              </div>
            </Disclosure.Panel>
          )}
        </>
      )}
    </Disclosure>
  );
}
