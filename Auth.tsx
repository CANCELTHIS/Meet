import React, { useState } from "react";
import { signInWithPopup, signOut } from "firebase/auth";
import { auth, googleProvider } from "./firebaseConfig";
import Button from "./components/Button";
import Icon from "./components/Icon";
import Card from "./components/Card";
import { ICONS } from "./constants";

interface AuthProps {
  onAuthSuccess: (user: any) => void;
}

const Auth: React.FC<AuthProps> = ({ onAuthSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await signInWithPopup(auth, googleProvider);
      onAuthSuccess(result.user);
    } catch (err: any) {
      setError(err.message || "Failed to sign in with Google");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto text-center">
      <h1 className="text-3xl font-bold text-white mb-6">
        Welcome to Meeting Summarizer
      </h1>
      <p className="text-gray-400 mb-8">
        Sign in with your Google account to access the meeting summarizer tool.
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-900/50 text-red-300 rounded-lg">
          {error}
        </div>
      )}

      <Button
        onClick={handleGoogleSignIn}
        isLoading={loading}
        className="w-full max-w-xs mx-auto"
      >
        <Icon icon={ICONS.GOOGLE} className="mr-3" />
        Sign in with Google
      </Button>

      <div className="mt-8 text-sm text-gray-500">
        By signing in, you agree to our Terms of Service and Privacy Policy
      </div>
    </Card>
  );
};

export default Auth;
