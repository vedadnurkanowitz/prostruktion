import { redirect } from "next/navigation";

export default function Home() {
  redirect("/login"); // Middleware will handle the actual logic if logged in, but this is a safe default
}
