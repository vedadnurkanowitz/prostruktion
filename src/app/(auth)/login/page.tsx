import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="dark flex min-h-screen w-full items-center justify-center bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-neutral-900 via-neutral-950 to-black p-4 text-foreground">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay"></div>
      <LoginForm />
    </div>
  );
}
