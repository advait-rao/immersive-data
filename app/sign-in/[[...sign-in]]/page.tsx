import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  const hasClerkKeys = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY);

  if (!hasClerkKeys) {
    return <main className="auth-page-shell">Auth is not configured yet.</main>;
  }

  return (
    <main className="auth-page-shell">
      <SignIn path="/sign-in" routing="path" signUpUrl="/sign-up" forceRedirectUrl="/" />
    </main>
  );
}
