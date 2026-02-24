import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronRight,
  ChevronLeft,
  LogOut,
} from "lucide-react";
import clsx from "clsx";
import { useTheme } from "@/context/ThemeContext";
import { themeConfig } from "@/config/themes";
import { menuItems, type MenuItem } from "@/config/menu";
import { useAuthStore } from "@/store/authStore";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  isMobile: boolean;
  onMenuClick: (item: MenuItem) => void;
  onLogout: () => Promise<void>;
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onToggle,
  isMobile,
  onMenuClick,
  onLogout,
}) => {
  const { theme } = useTheme();
  // @ts-ignore
  const currentTheme = themeConfig[theme];
  const navigate = useNavigate();
  const router = {
    push: (path: string) => navigate(path)
  };
  const [hoveredMenu, setHoveredMenu] = useState<string | null>(null);
  const [clickedMenu, setClickedMenu] = useState<string | null>(null);
  const [anchorRects, setAnchorRects] = useState<Record<string, DOMRect>>({});
  const [dropdownTimeouts, setDropdownTimeouts] = useState<
    Record<string, ReturnType<typeof setTimeout>>
  >({});
  const sidebarRef = useRef<HTMLDivElement>(null);

  const { user, isLoading } = useAuthStore();

  const hasPermission = (permission?: string) => {
    if (!permission) return true;
    if (!user) return false;
    // SUPERADMIN bypass
    if (user.role === 'SUPERADMIN') return true;
    return user.permissions?.includes(permission);
  };

  const filterMenuItems = (items: MenuItem[]): MenuItem[] => {
    return items.reduce<MenuItem[]>((acc, item) => {
      // 1. Check Permission
      if (!hasPermission(item.permission)) return acc;

      // 2. Handle Children
      if (item.children && item.children.length > 0) {
        const filteredChildren = filterMenuItems(item.children);

        // If it was a folder (no href) and all children are gone, hide it
        if (filteredChildren.length === 0 && !item.href) {
          return acc;
        }

        // Push a copy with new children to avoid mutation
        acc.push({ ...item, children: filteredChildren });
        return acc;
      }

      // 3. No children or empty children, just push item
      acc.push(item);
      return acc;
    }, []);
  };

  const filteredMenuItems = useMemo(() => {
    if (!user) return [];
    return filterMenuItems(menuItems);
  }, [user]);

  const handleLogout = async () => {
    try {
      await onLogout();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleMenuClick = (item: MenuItem) => {
    const hasChildren = item.children && item.children.length > 0;

    if (hasChildren) {
      setClickedMenu(clickedMenu === item.id ? null : item.id);
    }

    if (item.href) {
      router.push(item.href);
      onMenuClick(item);
      setClickedMenu(null);
      setHoveredMenu(null);
      if (isMobile && isOpen) {
        onToggle();
      }
    }
  };

  const handleMenuHover = (menuId: string, isEntering: boolean, rect?: DOMRect) => {
    if (isMobile) return;
    if (dropdownTimeouts[menuId]) clearTimeout(dropdownTimeouts[menuId]);

    if (isEntering) {
      if (rect) {
        setAnchorRects(prev => ({ ...prev, [menuId]: rect }));
      }
      setHoveredMenu(menuId);
      if (clickedMenu && clickedMenu !== menuId) {
        setClickedMenu(null);
      }
    } else {
      const timeoutId = setTimeout(() => {
        setHoveredMenu((current) => (current === menuId ? null : current));
      }, 300);
      setDropdownTimeouts((prev) => ({ ...prev, [menuId]: timeoutId }));
    }
  };

  const handleDropdownHover = (menuId: string, isEntering: boolean) => {
    if (isMobile) return;
    if (dropdownTimeouts[menuId]) {
      clearTimeout(dropdownTimeouts[menuId]);
    }

    if (isEntering) {
      setHoveredMenu(menuId);
    } else {
      const timeoutId = setTimeout(() => {
        setHoveredMenu((current) => (current === menuId ? null : current));
      }, 300);

      setDropdownTimeouts((prev) => ({
        ...prev,
        [menuId]: timeoutId,
      }));
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (
        !target.closest(".sidebar-dropdown") &&
        !target.closest(".sidebar-menu-item")
      ) {
        setHoveredMenu(null);
        setClickedMenu(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getThemeColors = () => {
    switch (theme) {
      case "blue":
        return {
          bgHover: "hover:bg-blue-500",
          bgActive: "bg-blue-500",
          textHover: "group-hover:text-white",
          iconHover: "group-hover:text-white",
          textActive: "text-white",
          iconActive: "text-white",
        };
      case "green":
        return {
          bgHover: "hover:bg-green-500",
          bgActive: "bg-green-500",
          textHover: "group-hover:text-white",
          iconHover: "group-hover:text-white",
          textActive: "text-white",
          iconActive: "text-white",
        };
      case "purple":
        return {
          bgHover: "hover:bg-purple-500",
          bgActive: "bg-purple-500",
          textHover: "group-hover:text-white",
          iconHover: "group-hover:text-white",
          textActive: "text-white",
          iconActive: "text-white",
        };
      case "pink":
        return {
          bgHover: "hover:bg-pink-500",
          bgActive: "bg-pink-500",
          textHover: "group-hover:text-white",
          iconHover: "group-hover:text-white",
          textActive: "text-white",
          iconActive: "text-white",
        };
      case "yellow":
        return {
          bgHover: "hover:bg-yellow-500",
          bgActive: "bg-yellow-500",
          textHover: "group-hover:text-white",
          iconHover: "group-hover:text-white",
          textActive: "text-white",
          iconActive: "text-white",
        };
      case "gray":
      default:
        return {
          bgHover: "hover:bg-gray-600",
          bgActive: "bg-gray-600",
          textHover: "group-hover:text-white",
          iconHover: "group-hover:text-white",
          textActive: "text-white",
          iconActive: "text-white",
        };
    }
  };

  const themeColors = getThemeColors();

  const isItemActive = (item: MenuItem): boolean => {
    if (hoveredMenu === item.id || clickedMenu === item.id) return true;
    if (item.children) {
      return item.children.some(child => isItemActive(child));
    }
    return false;
  };

  const renderDropdown = (
    children: MenuItem[] | undefined,
    parentRect: DOMRect,
    menuId: string,
    depth = 1
  ) => {
    if (!children || children.length === 0) return null;

    const rect = anchorRects[menuId] || parentRect;
    const isSubDropdown = depth > 1;

    return (
      <div
        className="sidebar-dropdown fixed bg-white shadow-xl border border-gray-200 rounded-lg py-1 z-[100] animate-in fade-in slide-in-from-left-2 duration-200 w-[190px]"
        style={{
          left: isSubDropdown ? rect.right - 4 : rect.right + 8,
          top: rect.top,
        }}
        onMouseEnter={() => handleDropdownHover(menuId, true)}
        onMouseLeave={() => handleDropdownHover(menuId, false)}
      >
        {children.map((child) => {
          const SubIcon = child.icon;
          const hasInnerChildren = child.children && child.children.length > 0;
          const isActive = isItemActive(child);

          return (
            <div
              key={child.id}
              className="relative group/sub px-1"
              onMouseEnter={(e) => handleMenuHover(child.id, true, e.currentTarget.getBoundingClientRect())}
              onMouseLeave={() => handleMenuHover(child.id, false)}
            >
              <div
                onClick={() => handleMenuClick(child)}
                className={clsx(
                  "flex items-center justify-between px-2.5 py-2 cursor-pointer transition-all duration-200 rounded-lg group",
                  themeColors.bgHover,
                  isActive && themeColors.bgActive
                )}
              >
                <div className="flex items-center space-x-2.5 overflow-hidden">
                  <SubIcon
                    size={15}
                    className={clsx(
                      "flex-shrink-0 transition-colors duration-200",
                      isActive ? themeColors.iconActive : "text-gray-500",
                      themeColors.iconHover
                    )}
                  />
                  <span
                    className={clsx(
                      "text-xs font-medium truncate transition-colors duration-200",
                      isActive ? themeColors.textActive : "text-gray-700",
                      themeColors.textHover
                    )}
                  >
                    {child.label}
                  </span>
                </div>
                {hasInnerChildren && (
                  <ChevronRight
                    size={14}
                    strokeWidth={3}
                    className={clsx(
                      "transition-all duration-200 flex-shrink-0",
                      isActive ? themeColors.iconActive : "text-gray-400",
                      "group-hover:translate-x-0.5",
                      isActive ? "opacity-100" : "opacity-70"
                    )}
                  />
                )}
              </div>

              {hasInnerChildren && isActive && (
                renderDropdown(
                  child.children,
                  anchorRects[child.id] || new DOMRect(rect.right + 186, rect.top, 0, 0),
                  child.id,
                  depth + 1
                )
              )}

              <div data-menu-id={child.id} className="absolute inset-0 pointer-events-none" />
            </div>
          );
        })}
      </div>
    );
  };

  const renderMenuItem = (item: MenuItem) => {
    const Icon = item.icon;
    const hasChildren = item.children && item.children.length > 0;
    const isActive = isItemActive(item);
    const showDropdown = isActive && hasChildren;

    return (
      <div
        key={item.id}
        className="relative sidebar-menu-item"
        onMouseEnter={(e) => handleMenuHover(item.id, true, e.currentTarget.getBoundingClientRect())}
        onMouseLeave={() => handleMenuHover(item.id, false)}
      >
        <div
          className={clsx(
            "flex items-center justify-between p-2 rounded-lg mx-2 my-1 transition-colors duration-200 group cursor-pointer",
            themeColors.bgHover,
            isActive && themeColors.bgActive
          )}
          onClick={() => handleMenuClick(item)}
        >
          <div className="flex items-center space-x-2.5 overflow-hidden">
            <Icon
              size={18}
              className={clsx(
                "flex-shrink-0 transition-colors duration-200",
                isActive ? themeColors.iconActive : "text-gray-600",
                themeColors.iconHover
              )}
            />
            {isOpen && (
              <span
                className={clsx(
                  "text-sm font-medium truncate transition-colors duration-200",
                  isActive ? themeColors.textActive : "text-gray-700",
                  themeColors.textHover
                )}
              >
                {item.label}
              </span>
            )}
          </div>
          {hasChildren && isOpen && (
            <ChevronRight
              size={16}
              strokeWidth={3}
              className={clsx(
                "transition-transform duration-200 flex-shrink-0 group-hover:translate-x-1",
                isActive ? themeColors.iconActive : "text-gray-400",
                "opacity-80"
              )}
            />
          )}
        </div>

        {showDropdown &&
          renderDropdown(
            item.children,
            document
              .querySelector(`[data-menu-id="${item.id}"]`)
              ?.getBoundingClientRect() || new DOMRect(isOpen ? 256 : 64, 0, 0, 0),
            item.id
          )}

        <div
          data-menu-id={item.id}
          className="absolute inset-0 pointer-events-none"
        />
      </div>
    );
  };

  if (isLoading) {
    return (
      <div
        className={`bg-white transition-all duration-300 ease-in-out flex-shrink-0 z-50 ${isOpen ? "w-56" : "w-14"
          } ${isMobile ? (isOpen ? "fixed" : "hidden") : "relative"
          } h-full flex flex-col`}
      >
        <div className="flex items-center justify-center h-full">
          <div className="animate-pulse text-gray-400">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      {isOpen && isMobile && (
        <div
          className="fixed inset-0 bg-transparent z-40 backdrop-blur-[2px] transition-all duration-300"
          onClick={onToggle}
        />
      )}

      <div
        ref={sidebarRef}
        className={`bg-white transition-all duration-500 ease-in-out flex-shrink-0 z-[80] border-r border-gray-200 ${isOpen ? "w-64" : "w-16"
          } ${isMobile ? (isOpen ? "fixed" : "hidden") : "relative"
          } h-full flex flex-col`}
      >
        <div className="flex items-center p-4">
          {isOpen ? (
            <div className="flex items-center space-x-3">
              <img
                src="/cms.png"
                alt="CMSOne Logo"
                className="h-10 w-10 object-contain"
              />
              <span className="font-brand text-xl font-bold tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-purple-600">
                CMSOne
              </span>
            </div>
          ) : (
            <img
              src="/cms.png"
              alt="CMSOne Logo"
              className="h-10 w-10 object-contain mx-auto"
            />
          )}
        </div>

        <div className="py-2 flex-1 overflow-y-auto">
          <div className="px-1">
            {filteredMenuItems.map((item) => renderMenuItem(item))}
          </div>
        </div>

        <div className="p-2 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 p-2 hover:bg-red-50 cursor-pointer rounded-lg transition-all duration-200 ease-in-out group transform hover:scale-[1.02] hover:shadow-sm"
          >
            <LogOut
              size={16}
              className="text-red-600 flex-shrink-0 transition-transform duration-200 group-hover:rotate-12"
            />
            {isOpen && (
              <span className="text-xs font-medium text-red-600 transition-all duration-200 group-hover:text-red-700">
                Logout
              </span>
            )}
          </button>
        </div>
      </div>

      <button
        onClick={onToggle}
        className={clsx(
          "fixed top-1/2 transform -translate-y-1/2 z-[70] shadow-lg rounded-r-xl py-4 px-0.5 transition-all duration-500 ease-in-out hover:shadow-xl hover:scale-105",
          {
            "bg-blue-600 hover:bg-blue-700": theme === "blue",
            "bg-green-600 hover:bg-green-700": theme === "green",
            "bg-purple-600 hover:bg-purple-700": theme === "purple",
            "bg-pink-600 hover:bg-pink-700": theme === "pink",
            "bg-yellow-600 hover:bg-yellow-700": theme === "yellow",
            "bg-gray-600 hover:bg-gray-700": theme === "gray",
          }
        )}
        style={{
          left: isMobile && !isOpen ? "14px" : isOpen ? "256px" : "64px",
          transition: "left 0.5s ease-in-out, background-color 0.2s ease-in-out",
        }}
      >
        {isOpen ? (
          <ChevronLeft
            size={16}
            className="text-white transition-transform duration-200 hover:scale-110"
          />
        ) : (
          <ChevronRight
            size={16}
            className="text-white transition-transform duration-200 hover:scale-110"
          />
        )}
      </button>
    </>
  );
};

export default Sidebar;
