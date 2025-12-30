import React, { useContext, useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Disclosure, Menu } from "@headlessui/react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { AuthContext } from "../context/AuthContext";
import { useWaba } from "../context/WabaContext";
import { authFetch } from "../services/api";

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const { activeWaba, selectWaba } = useWaba();
  const [wabaAccounts, setWabaAccounts] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user) {
      const fetchAccounts = async () => {
        try {
          const data = await authFetch("/waba/accounts");
          if (data.success) {
            setWabaAccounts(data.data);
            if (!activeWaba && data.data.length > 0) {
              selectWaba(data.data[0]._id);
            }
          }
        } catch (error) {
          console.error("Error fetching WABA accounts:", error);
        }
      };
      fetchAccounts();
    }
  }, [user, activeWaba, selectWaba]);

  const handleLogout = () => {
    logout();
    selectWaba(null);
    navigate("/login");
  };

  const handleWabaChange = (wabaId) => {
    selectWaba(wabaId);
    window.location.reload();
  };

  const activeWabaName =
    wabaAccounts.find((a) => a._id === activeWaba)?.accountName ||
    "Select Account";

  // Shared Helper for Hover Dropdowns
  const NavDropdown = ({ title, active, children }) => (
    <div className="relative group h-full flex items-center px-1">
      <button
        className={classNames(
          active
            ? "text-white bg-gray-900"
            : "text-gray-300 hover:text-white hover:bg-gray-800",
          "rounded-md px-3 py-2 text-sm font-medium flex items-center gap-1 transition-colors duration-200"
        )}
      >
        {title}
        <svg
          className="w-4 h-4 text-gray-400 group-hover:text-white transition-transform duration-200 group-hover:rotate-180"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown Menu - Hover Logic */}
      <div className="absolute top-full left-0 pt-2 w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 ease-out transform group-hover:translate-y-0 translate-y-2 z-50">
        <div className="bg-gray-800 rounded-lg shadow-xl border border-gray-700 overflow-hidden ring-1 ring-black ring-opacity-5">
          <div className="py-1">{children}</div>
        </div>
      </div>
    </div>
  );

  const DropdownItem = ({ to, children }) => (
    <Link
      to={to}
      className={classNames(
        location.pathname === to
          ? "bg-gray-700 text-white"
          : "text-gray-300 hover:bg-gray-700 hover:text-white",
        "block px-4 py-2 text-sm transition-colors duration-150"
      )}
    >
      {children}
    </Link>
  );

  return (
    <Disclosure as="nav" className="relative bg-black border-b border-gray-800">
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

              {/* Logo + Navigation */}
              <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
                <div className="flex shrink-0 items-center">
                  <img
                    alt="Logo"
                    src="https://thecapitalavenue.com/wp-content/uploads/2025/09/Capital-Avenue-White.png"
                    className="h-8 w-auto hover:opacity-90 transition-opacity cursor-pointer"
                    onClick={() => navigate("/")}
                  />
                </div>
                {user && (
                  <div className="hidden sm:ml-6 sm:block">
                    <div className="flex space-x-1 h-full items-center">
                      {/* 1. DASHBOARD */}
                      {user.role !== "viewer" && (
                        <Link
                          to="/"
                          className={classNames(
                            location.pathname === "/"
                              ? "bg-gray-900 text-white"
                              : "text-gray-300 hover:bg-gray-800 hover:text-white",
                            "rounded-md px-3 py-2 text-sm font-medium transition-colors"
                          )}
                        >
                          Dashboard
                        </Link>
                      )}

                      {/* 2. REPLIES */}
                      <Link
                        to="/replies"
                        className={classNames(
                          location.pathname === "/replies"
                            ? "bg-gray-900 text-white"
                            : "text-gray-300 hover:bg-gray-800 hover:text-white",
                          "rounded-md px-3 py-2 text-sm font-medium transition-colors"
                        )}
                      >
                        Chat
                      </Link>

                      {/* 3. CRM DROPDOWN */}
                      <NavDropdown
                        title="CRM"
                        active={[
                          "/enquiries",
                          "/contacts",
                          "/properties",
                        ].includes(location.pathname)}
                      >
                        <DropdownItem to="/enquiries">Enquiries</DropdownItem>
                        {user.role !== "viewer" && (
                          <>
                            <DropdownItem to="/contacts">Contacts</DropdownItem>
                            <DropdownItem to="/properties">
                              Properties
                            </DropdownItem>
                          </>
                        )}
                      </NavDropdown>

                      {/* 4. AUTOMATION DROPDOWN */}
                      {user.role !== "viewer" && (
                        <NavDropdown
                          title="Automation"
                          active={["/auto-reply", "/bot-studio"].includes(
                            location.pathname
                          )}
                        >
                          <DropdownItem to="/auto-reply">
                            Auto-Reply
                          </DropdownItem>
                          {user.role === "admin" && (
                            <DropdownItem to="/bot-studio">
                              Bot Studio
                            </DropdownItem>
                          )}
                        </NavDropdown>
                      )}

                      {/* 5. ADMIN DROPDOWN */}
                      {user.role !== "viewer" && (
                        <NavDropdown
                          title="Admin"
                          active={[
                            "/analytics",
                            "/users",
                            "/logs",
                            "/integrations",
                          ].includes(location.pathname)}
                        >
                          <DropdownItem to="/analytics">Analytics</DropdownItem>
                          {user.role === "admin" && (
                            <>
                              <DropdownItem to="/users">Users</DropdownItem>
                              <DropdownItem to="/logs">Logs</DropdownItem>
                              <DropdownItem to="/integrations">
                                Integrations
                              </DropdownItem>
                            </>
                          )}
                        </NavDropdown>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Side: WABA & Profile */}
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
                {user ? (
                  <>
                    {/* WABA Dropdown (Click is better for selection) */}
                    <Menu as="div" className="relative ml-3">
                      <Menu.Button className="relative flex rounded-md bg-fuchsia-900/80 capitalize px-4 py-2 text-sm text-gray-100 hover:bg-fuchsia-800 transition-colors border border-fuchsia-700 shadow-md backdrop-blur-sm">
                        <span className="sr-only">Select WABA</span>
                        {activeWabaName}
                      </Menu.Button>
                      <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-[#202d33] py-1 shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none border border-gray-700">
                        {wabaAccounts.map((account) => (
                          <Menu.Item key={account._id}>
                            {({ active }) => (
                              <button
                                onClick={() => handleWabaChange(account._id)}
                                className={classNames(
                                  active
                                    ? "bg-[#2a373f] text-white"
                                    : "text-gray-300",
                                  "block w-full text-left px-4 py-2 text-sm capitalize transition-colors"
                                )}
                              >
                                {account.accountName}
                              </button>
                            )}
                          </Menu.Item>
                        ))}
                      </Menu.Items>
                    </Menu>

                    {/* Profile Dropdown */}
                    <Menu as="div" className="relative ml-3">
                      <Menu.Button className="relative flex rounded-full ring-2 ring-transparent hover:ring-gray-500 transition-all">
                        <span className="sr-only">Open user menu</span>
                        <img
                          alt="profile"
                          src="https://thecapitalavenue.com/wp-content/uploads/2025/08/Group-3.svg"
                          className="size-9 rounded-full bg-gray-100"
                        />
                      </Menu.Button>
                      <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-[#202d33] py-1 shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none border border-gray-700">
                        <div className="px-4 py-3 text-sm text-white border-b border-gray-700/50 bg-[#1a252a]/50">
                          <p className="font-semibold">{user.name}</p>
                          <p className="text-gray-400 capitalize text-xs mt-0.5">
                            {user.role}
                          </p>
                        </div>
                        <div className="py-1">
                          <Menu.Item>
                            {({ active }) => (
                              <Link
                                to="/profile"
                                className={classNames(
                                  active
                                    ? "bg-[#2a373f] text-white"
                                    : "text-gray-300",
                                  "block px-4 py-2 text-sm transition-colors"
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
                                  active
                                    ? "bg-[#2a373f] text-orange-400"
                                    : "text-gray-300",
                                  "block w-full text-left px-4 py-2 text-sm transition-colors"
                                )}
                              >
                                Logout
                              </button>
                            )}
                          </Menu.Item>
                        </div>
                      </Menu.Items>
                    </Menu>
                  </>
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

          {/* Mobile Menu */}
          {user && (
            <Disclosure.Panel className="sm:hidden bg-[#111b21] border-b border-gray-800">
              <div className="space-y-1 px-2 pt-2 pb-3">
                <Disclosure.Button
                  as={Link}
                  to="/"
                  className="block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-white/5 hover:text-white"
                >
                  Dashboard
                </Disclosure.Button>
                <Disclosure.Button
                  as={Link}
                  to="/replies"
                  className="block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-white/5 hover:text-white"
                >
                  Chat
                </Disclosure.Button>
                <Disclosure.Button
                  as={Link}
                  to="/enquiries"
                  className="block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-white/5 hover:text-white"
                >
                  Enquiries
                </Disclosure.Button>
                <Disclosure.Button
                  as={Link}
                  to="/contacts"
                  className="block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-white/5 hover:text-white"
                >
                  Contacts
                </Disclosure.Button>
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
