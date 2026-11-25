import ProtectedDashboard from "@/components/ProtectedDashboard";

export default function AdminDashboardPage() {
  return <ProtectedDashboard role="ADMIN" />;
}
