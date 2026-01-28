import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="dark flex min-h-screen w-full items-center justify-center bg-black p-4">
      <div className="absolute inset-0 bg-gradient-to-b from-neutral-900/50 via-black to-black"></div>
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none mix-blend-overlay"></div>
      <LoginForm />
    </div>
  );
}
