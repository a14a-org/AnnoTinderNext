"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

function ConfirmPageContent() {
    const searchParams = useSearchParams();
    const url = searchParams.get("url");
    const [isRedirecting, setIsRedirecting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!url) {
            setError("Invalid link. Please request a new magic link.");
        }
    }, [url]);

    const handleConfirm = () => {
        if (!url) return;

        setIsRedirecting(true);
        // Use window.location.href to navigate to the magic link
        // This consumes the token
        window.location.href = url;
    };

    if (error) {
        return (
            <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 text-center">
                <h1 className="text-xl font-bold text-red-600 mb-4">Error</h1>
                <p className="text-obsidian-muted mb-6">{error}</p>
                <a
                    href="/auth/signin"
                    className="inline-block px-6 py-3 bg-chili-coral text-white font-medium rounded-lg hover:bg-chili-light transition-colors"
                >
                    Back to Sign In
                </a>
            </div>
        );
    }

    return (
        <div className="w-full max-w-md">
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                <h1 className="text-2xl font-bold text-obsidian mb-4">
                    Confirm Sign In
                </h1>
                <p className="text-obsidian-muted mb-8">
                    Click the button below to complete your sign in to AnnoTinder.
                </p>

                <button
                    onClick={handleConfirm}
                    disabled={isRedirecting || !url}
                    className="w-full py-3 px-4 bg-chili-coral text-white font-medium rounded-lg hover:bg-chili-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isRedirecting ? (
                        <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Signing in...
                        </>
                    ) : (
                        "Sign In Now"
                    )}
                </button>

                <p className="text-xs text-obsidian-light mt-6">
                    This extra step protects your magic link from being expired by email scanners.
                </p>
            </div>
        </div>
    );
}

export default function ConfirmPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-canvas px-4">
            <Suspense
                fallback={
                    <div className="flex items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-chili-coral" />
                    </div>
                }
            >
                <ConfirmPageContent />
            </Suspense>
        </div>
    );
}
