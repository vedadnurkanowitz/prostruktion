import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div
      className="flex min-h-screen w-full items-center justify-center p-4"
      style={{
        background:
          "radial-gradient(ellipse at top left, #1f2937 0%, #030712 50%, #000000 100%)",
      }}
    >
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none"></div>
      <LoginForm />
    </div>
  );
}
