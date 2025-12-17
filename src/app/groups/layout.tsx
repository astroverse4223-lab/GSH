import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Groups",
  description: "Join and create groups with other gamers",
};

export default function GroupsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
