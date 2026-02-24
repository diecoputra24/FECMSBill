import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import type { LucideProps } from "lucide-react";

type BreadcrumbItem = {
  label: string;
  href: string;
  icon?: React.ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
  >;
  segment: string;
};

const Breadcrumb: React.FC = () => {
  const location = useLocation();
  const pathSegments = location.pathname.split("/").filter((segment) => segment !== "");

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "Home", href: "/", icon: Home, segment: "" },
  ];

  const segmentLabels: Record<string, string> = {
    dashboard: "Dashboard",
    pelanggan: "Pelanggan",
    list: "List Pelanggan",
    paket: "Paket Internet",
    billing: "Billing",
    invoice: "Invoice",
    payment: "Payment",
    layanan: "Layanan",
    tagihan: "Tagihan",
    laporan: "Laporan",
    keamanan: "Keamanan",
    pengaturan: "Pengaturan",
    baru: "Tambah Baru",
    riwayat: "Riwayat",
  };

  const dropdownSegments = ["pelanggan", "billing", "layanan", "settings", "system"];

  let currentPath = "";
  pathSegments.forEach((segment) => {
    currentPath += `/${segment}`;
    breadcrumbItems.push({
      label: segmentLabels[segment] || segment,
      href: currentPath,
      icon: undefined,
      segment,
    });
  });

  // Filter out duplicates if any (e.g. if home is already in pathSegments)
  const uniqueItems = breadcrumbItems.filter((item, index, self) =>
    index === self.findIndex((t) => t.href === item.href)
  );

  if (uniqueItems.length <= 1) return null;

  return (
    <nav className="flex items-center space-x-1 text-sm text-gray-600 mb-4">
      {uniqueItems.map((item, index) => {
        const isLast = index === uniqueItems.length - 1;
        const Icon = item.icon;
        const isDropdown = dropdownSegments.includes(item.segment);

        return (
          <React.Fragment key={item.href}>
            {index > 0 && (
              <ChevronRight size={16} className="text-gray-400 mx-1" />
            )}

            {isLast || isDropdown ? (
              <span className="flex items-center space-x-1 text-gray-900 font-medium">
                {Icon && <Icon size={16} />}
                <span>{item.label}</span>
              </span>
            ) : (
              <Link
                to={item.href}
                className="flex items-center space-x-1 hover:text-blue-600 transition-colors duration-200"
              >
                {Icon && <Icon size={16} />}
                <span>{item.label}</span>
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default Breadcrumb;
