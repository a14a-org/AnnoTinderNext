import Link from "next/link";
import { Mail } from "lucide-react";

export default function VerifyRequestPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-bio-soft rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="w-8 h-8 text-bio-teal" />
          </div>

          <h1 className="text-2xl font-bold text-obsidian mb-2">
            Check your email
          </h1>

          <p className="text-obsidian-muted mb-6">
            A sign-in link has been sent to your email address. Click the link
            to sign in to your account.
          </p>

          <div className="bg-canvas rounded-lg p-4 mb-6">
            <p className="text-sm text-obsidian-light">
              The link will expire in 24 hours. If you don&apos;t see the email,
              check your spam folder.
            </p>
          </div>

          <Link
            href="/auth/signin"
            className="text-chili-coral hover:text-chili-dark font-medium transition-colors"
          >
            Try a different email
          </Link>
        </div>
      </div>
    </div>
  );
}
