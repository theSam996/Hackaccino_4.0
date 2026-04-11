import { Sector7Shell } from "@/components/sector7/Sector7Shell";

export default function Sector7Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Sector7Shell>{children}</Sector7Shell>;
}
