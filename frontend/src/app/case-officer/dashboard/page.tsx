import ProtectedDashboard from "@/components/ProtectedDashboard";

export default function CaseOfficerDashboardPage() {
  return <ProtectedDashboard role="CASE_OFFICER" />;
}
