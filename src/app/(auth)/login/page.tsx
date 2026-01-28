import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="dark flex min-h-screen w-full items-center justify-center bg-[radial-gradient(ellipse_at_top_left,var(--tw-gradient-stops))] from-gray-800 via-gray-950 to-black p-4">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none"></div>
      <LoginForm />
    </div>
  );
}
