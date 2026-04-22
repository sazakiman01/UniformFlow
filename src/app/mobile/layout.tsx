import MobileLayout from "@/components/mobile/MobileLayout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <MobileLayout>{children}</MobileLayout>;
}
