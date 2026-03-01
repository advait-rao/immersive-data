import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  const hasClerkKeys = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY);

  if (!hasClerkKeys) {
    return <main className="auth-page-shell">Auth is not configured yet.</main>;
  }

  return (
    <main className="auth-page-shell">
      <SignUp path="/sign-up" routing="path" signInUrl="/sign-in" forceRedirectUrl="/" />
    </main>
  );
}
